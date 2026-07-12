import { NextRequest, NextResponse } from "next/server";

import {
  analyzeRiotOpponents,
  RiotApiError,
} from "@/lib/riot";

import type {
  RiotAnalyzeRequest,
  RiotPlatform,
  ScoutRole,
} from "@/types/riot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW = 60_000;
const MAX_ANALYSES_PER_WINDOW = 5;

const allowedPlatforms = new Set<RiotPlatform>([
  "br1",
  "eun1",
  "euw1",
  "jp1",
  "kr",
  "la1",
  "la2",
  "na1",
  "oc1",
  "tr1",
  "ru",
  "ph2",
  "sg2",
  "th2",
  "tw2",
  "vn2",
]);

const allowedRoles = new Set<ScoutRole>([
  "top",
  "jungle",
  "mid",
  "adc",
  "support",
]);

const globalRateLimitState =
  globalThis as typeof globalThis & {
    __riftScoutRateLimits?: Map<
      string,
      RateLimitEntry
    >;
  };

const rateLimits =
  globalRateLimitState.__riftScoutRateLimits ??
  new Map<string, RateLimitEntry>();

globalRateLimitState.__riftScoutRateLimits =
  rateLimits;

export async function POST(request: NextRequest) {
  const clientIdentifier = getClientIdentifier(request);
  const rateLimitResult = consumeRateLimit(
    clientIdentifier,
  );

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many analyses. Wait a moment before trying again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            rateLimitResult.retryAfter,
          ),
        },
      },
    );
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "The request body must contain valid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  const validationResult =
    validateAnalyzeRequest(rawBody);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: validationResult.error,
      },
      {
        status: 400,
      },
    );
  }

  try {
    const result = await analyzeRiotOpponents(
      validationResult.data,
    );

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Riot analysis failed:", error);

    if (error instanceof RiotApiError) {
      if (error.status === 401 || error.status === 403) {
        return NextResponse.json(
          {
            error:
              "The Riot API key is invalid or has expired. Add a current key to RIOT_API_KEY and restart the server.",
          },
          {
            status: 502,
          },
        );
      }

      if (error.status === 429) {
        const retryAfter = error.retryAfter ?? 30;

        return NextResponse.json(
          {
            error: `Riot's rate limit was reached. Try again in approximately ${retryAfter} seconds.`,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfter),
            },
          },
        );
      }

      if (error.status === 500) {
        return NextResponse.json(
          {
            error:
              "The server is missing its Riot API configuration.",
          },
          {
            status: 500,
          },
        );
      }

      return NextResponse.json(
        {
          error:
            "Riot could not complete the player analysis.",
        },
        {
          status: 502,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "An unexpected server error occurred during the analysis.",
      },
      {
        status: 500,
      },
    );
  }
}

function validateAnalyzeRequest(
  value: unknown,
):
  | {
      success: true;
      data: RiotAnalyzeRequest;
    }
  | {
      success: false;
      error: string;
    } {
  if (!isRecord(value)) {
    return {
      success: false,
      error: "Invalid request body.",
    };
  }

  if (
    typeof value.region !== "string" ||
    !allowedPlatforms.has(
      value.region as RiotPlatform,
    )
  ) {
    return {
      success: false,
      error: "Select a supported Riot server region.",
    };
  }

  if (
    typeof value.selectedRole !== "string" ||
    !allowedRoles.has(
      value.selectedRole as ScoutRole,
    )
  ) {
    return {
      success: false,
      error: "Select a valid player role.",
    };
  }

  if (
    typeof value.championName !== "string" ||
    value.championName.trim().length < 1 ||
    value.championName.trim().length > 50
  ) {
    return {
      success: false,
      error: "Select a valid champion.",
    };
  }

  if (
    typeof value.mode !== "string" ||
    value.mode.trim().length > 30
  ) {
    return {
      success: false,
      error: "Select a valid game mode.",
    };
  }

  if (
    !Array.isArray(value.opponents) ||
    value.opponents.length < 1 ||
    value.opponents.length > 5
  ) {
    return {
      success: false,
      error: "Enter between one and five opponents.",
    };
  }

  const opponents: RiotAnalyzeRequest["opponents"] =
    [];

  const usedRoles = new Set<ScoutRole>();

  for (const rawOpponent of value.opponents) {
    if (!isRecord(rawOpponent)) {
      return {
        success: false,
        error: "An opponent entry is invalid.",
      };
    }

    if (
      typeof rawOpponent.role !== "string" ||
      !allowedRoles.has(
        rawOpponent.role as ScoutRole,
      )
    ) {
      return {
        success: false,
        error: "An opponent has an invalid role.",
      };
    }

    const role = rawOpponent.role as ScoutRole;

    if (usedRoles.has(role)) {
      return {
        success: false,
        error:
          "The same opponent role cannot be entered twice.",
      };
    }

    if (
      typeof rawOpponent.gameName !== "string" ||
      rawOpponent.gameName.trim().length < 1 ||
      rawOpponent.gameName.trim().length > 32
    ) {
      return {
        success: false,
        error: `The ${role} player's game name is invalid.`,
      };
    }

    if (
      typeof rawOpponent.tagLine !== "string" ||
      rawOpponent.tagLine.trim().length < 1 ||
      rawOpponent.tagLine.trim().length > 16
    ) {
      return {
        success: false,
        error: `The ${role} player's tagline is invalid.`,
      };
    }

    usedRoles.add(role);

    opponents.push({
      role,
      gameName: rawOpponent.gameName.trim(),
      tagLine: rawOpponent.tagLine
        .trim()
        .replace(/^#/, ""),
    });
  }

  return {
    success: true,
    data: {
      region: value.region as RiotPlatform,
      mode: value.mode.trim(),
      selectedRole: value.selectedRole as ScoutRole,
      championName: value.championName.trim(),
      opponents,
    },
  };
}

function getClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return forwardedFor || "local-development";
}

function consumeRateLimit(identifier: string): {
  allowed: boolean;
  retryAfter: number;
} {
  const now = Date.now();
  const existing = rateLimits.get(identifier);

  if (!existing || now >= existing.resetAt) {
    rateLimits.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });

    return {
      allowed: true,
      retryAfter: 0,
    };
  }

  if (existing.count >= MAX_ANALYSES_PER_WINDOW) {
    return {
      allowed: false,
      retryAfter: Math.ceil(
        (existing.resetAt - now) / 1000,
      ),
    };
  }

  existing.count += 1;
  rateLimits.set(identifier, existing);

  return {
    allowed: true,
    retryAfter: 0,
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}