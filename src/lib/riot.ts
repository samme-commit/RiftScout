import "server-only";

import type {
  FailedRiotOpponent,
  RiotAnalysisResult,
  RiotAnalyzeRequest,
  RiotBanRecommendation,
  RiotChampionPerformance,
  RiotOpponentInput,
  RiotOpponentResult,
  RiotPlatform,
  ScoutRole,
} from "@/types/riot";

type RegionalRoute = "americas" | "asia" | "europe" | "sea";

type RiotAccountDto = {
  puuid: string;
  gameName?: string;
  tagLine?: string;
};

type RiotMatchParticipantDto = {
  puuid: string;
  championId: number;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  teamPosition?: string;
  individualPosition?: string;
};

type RiotMatchDto = {
  metadata: {
    matchId: string;
  };
  info: {
    mapId: number;
    participants: RiotMatchParticipantDto[];
  };
};

type ChampionAccumulator = {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
};

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const MATCHES_TO_REQUEST = 12;
const PLAYER_CACHE_TIME = 5 * 60 * 1000;
const MATCH_CACHE_TIME = 15 * 60 * 1000;

const platformToRegionalRoute: Record<
  RiotPlatform,
  RegionalRoute
> = {
  br1: "americas",
  eun1: "europe",
  euw1: "europe",
  jp1: "asia",
  kr: "asia",
  la1: "americas",
  la2: "americas",
  na1: "americas",
  oc1: "sea",
  tr1: "europe",
  ru: "europe",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  tw2: "sea",
  vn2: "sea",
};

const globalRiotState = globalThis as typeof globalThis & {
  __riftScoutRiotCache?: Map<string, CacheEntry>;
};

const riotCache =
  globalRiotState.__riftScoutRiotCache ??
  new Map<string, CacheEntry>();

globalRiotState.__riftScoutRiotCache = riotCache;

export class RiotApiError extends Error {
  status: number;
  retryAfter: number | null;

  constructor(
    status: number,
    message: string,
    retryAfter: number | null = null,
  ) {
    super(message);

    this.name = "RiotApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export async function analyzeRiotOpponents(
  request: RiotAnalyzeRequest,
): Promise<RiotAnalysisResult> {
  const outcomes = await mapWithConcurrency(
    request.opponents,
    2,
    async (opponent) => {
      try {
        const result = await analyzeSingleOpponent(
          request.region,
          opponent,
          request.selectedRole,
        );

        return {
          success: true as const,
          result,
        };
      } catch (error) {
        if (
          error instanceof RiotApiError &&
          error.status === 404
        ) {
          return {
            success: false as const,
            failure: {
              role: opponent.role,
              riotId: `${opponent.gameName}#${opponent.tagLine}`,
              message: "Riot ID could not be found.",
            } satisfies FailedRiotOpponent,
          };
        }

        throw error;
      }
    },
  );

  const opponents = outcomes
    .filter(
      (
        outcome,
      ): outcome is {
        success: true;
        result: RiotOpponentResult;
      } => outcome.success,
    )
    .map((outcome) => outcome.result);

  const failedOpponents = outcomes
    .filter(
      (
        outcome,
      ): outcome is {
        success: false;
        failure: FailedRiotOpponent;
      } => !outcome.success,
    )
    .map((outcome) => outcome.failure);

  const warnings: string[] = [];

  for (const opponent of opponents) {
    if (opponent.games === 0) {
      warnings.push(
        `${opponent.riotId} had no recent Summoner's Rift matches available.`,
      );
    }
  }

  for (const failedOpponent of failedOpponents) {
    warnings.push(
      `${failedOpponent.riotId}: ${failedOpponent.message}`,
    );
  }

  return {
    source: "riot",
    analyzedAt: new Date().toISOString(),
    region: request.region,
    matchesRequestedPerPlayer: MATCHES_TO_REQUEST,
    opponents,
    recommendations: buildBanRecommendations(
      opponents,
      request.selectedRole,
      request.championName,
    ),
    failedOpponents,
    warnings,
  };
}

async function analyzeSingleOpponent(
  platform: RiotPlatform,
  opponent: RiotOpponentInput,
  selectedRole: ScoutRole,
): Promise<RiotOpponentResult> {
  const cacheKey = [
    "player-analysis",
    platform,
    opponent.gameName.trim().toLowerCase(),
    opponent.tagLine.trim().toLowerCase(),
    opponent.role,
    selectedRole,
  ].join(":");

  const cachedResult =
    getCachedValue<RiotOpponentResult>(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  const regionalRoute = platformToRegionalRoute[platform];

  const account = await riotFetch<RiotAccountDto>(
    regionalRoute,
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      opponent.gameName.trim(),
    )}/${encodeURIComponent(opponent.tagLine.trim())}`,
  );

  const matchIds = await riotFetch<string[]>(
    regionalRoute,
    `/lol/match/v5/matches/by-puuid/${encodeURIComponent(
      account.puuid,
    )}/ids?start=0&count=${MATCHES_TO_REQUEST}`,
  );

  const matches = await mapWithConcurrency(
    matchIds,
    4,
    async (matchId) => {
      try {
        return await getMatch(regionalRoute, matchId);
      } catch (error) {
        if (
          error instanceof RiotApiError &&
          error.status === 404
        ) {
          return null;
        }

        throw error;
      }
    },
  );

  const summonersRiftParticipants = matches
    .filter(
      (match): match is RiotMatchDto =>
        match !== null && match.info.mapId === 11,
    )
    .map((match) =>
      match.info.participants.find(
        (participant) => participant.puuid === account.puuid,
      ),
    )
    .filter(
      (
        participant,
      ): participant is RiotMatchParticipantDto =>
        participant !== undefined,
    );

  const result = createOpponentResult(
    opponent,
    account,
    summonersRiftParticipants,
    selectedRole,
  );

  setCachedValue(cacheKey, result, PLAYER_CACHE_TIME);

  return result;
}

async function getMatch(
  regionalRoute: RegionalRoute,
  matchId: string,
) {
  const cacheKey = `match:${regionalRoute}:${matchId}`;

  const cachedMatch =
    getCachedValue<RiotMatchDto>(cacheKey);

  if (cachedMatch) {
    return cachedMatch;
  }

  const match = await riotFetch<RiotMatchDto>(
    regionalRoute,
    `/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
  );

  setCachedValue(cacheKey, match, MATCH_CACHE_TIME);

  return match;
}

function createOpponentResult(
  opponent: RiotOpponentInput,
  account: RiotAccountDto,
  participants: RiotMatchParticipantDto[],
  selectedRole: ScoutRole,
): RiotOpponentResult {
  const championMap = new Map<
    number,
    ChampionAccumulator
  >();

  const roleCounts = new Map<ScoutRole, number>();

  let totalWins = 0;

  for (const participant of participants) {
    if (participant.win) {
      totalWins += 1;
    }

    const detectedRole = normalizeRiotPosition(
      participant.teamPosition ||
        participant.individualPosition ||
        "",
    );

    if (detectedRole) {
      roleCounts.set(
        detectedRole,
        (roleCounts.get(detectedRole) ?? 0) + 1,
      );
    }

    const existingChampion = championMap.get(
      participant.championId,
    );

    if (existingChampion) {
      existingChampion.games += 1;
      existingChampion.wins += participant.win ? 1 : 0;
      existingChampion.kills += participant.kills;
      existingChampion.deaths += participant.deaths;
      existingChampion.assists += participant.assists;
      continue;
    }

    championMap.set(participant.championId, {
      championId: participant.championId,
      championName: participant.championName,
      games: 1,
      wins: participant.win ? 1 : 0,
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
    });
  }

  const championPool = [...championMap.values()]
    .map((champion) =>
      createChampionPerformance(
        champion,
        participants.length,
      ),
    )
    .sort((a, b) => b.comfortScore - a.comfortScore)
    .slice(0, 5);

  const primaryChampion = championPool[0];
  const secondaryChampion = championPool[1];

  const directLaneBonus =
    opponent.role === selectedRole ? 7 : 0;

  const threatScore = primaryChampion
    ? clamp(
        primaryChampion.comfortScore + directLaneBonus,
        0,
        98,
      )
    : 0;

  const confidence = getConfidenceLevel(
    participants.length,
    primaryChampion?.games ?? 0,
  );

  return {
    role: opponent.role,
    riotId: `${
      account.gameName ?? opponent.gameName.trim()
    }#${account.tagLine ?? opponent.tagLine.trim()}`,
    primaryChampion:
      primaryChampion?.championName ?? "No recent data",
    secondaryChampion:
      secondaryChampion?.championName ?? "—",
    games: participants.length,
    winRate:
      participants.length > 0
        ? Math.round(
            (totalWins / participants.length) * 100,
          )
        : 0,
    threatScore,
    confidence,
    recentRole: getMostPlayedRole(roleCounts),
    championPool,
  };
}

function createChampionPerformance(
  champion: ChampionAccumulator,
  totalMatches: number,
): RiotChampionPerformance {
  const winRate =
    champion.games > 0
      ? (champion.wins / champion.games) * 100
      : 0;

  // Bayesian adjustment prevents one 1-0 champion
  // from automatically receiving a 100% performance score.
  const adjustedWinRate =
    ((champion.wins + 2) / (champion.games + 4)) *
    100;

  const averageKda =
    (champion.kills + champion.assists) /
    Math.max(1, champion.deaths);

  const usageRate =
    totalMatches > 0 ? champion.games / totalMatches : 0;

  const comfortScore = clamp(
    Math.round(
      40 +
        usageRate * 35 +
        (adjustedWinRate - 50) * 0.35 +
        Math.min(averageKda, 6) * 3,
    ),
    0,
    96,
  );

  return {
    championId: champion.championId,
    championName: champion.championName,
    games: champion.games,
    wins: champion.wins,
    winRate: Math.round(winRate),
    adjustedWinRate: Math.round(adjustedWinRate),
    averageKda: roundToOneDecimal(averageKda),
    comfortScore,
  };
}

function buildBanRecommendations(
  opponents: RiotOpponentResult[],
  selectedRole: ScoutRole,
  championName: string,
): RiotBanRecommendation[] {
  const candidates: RiotBanRecommendation[] = [];

  for (const opponent of opponents) {
    opponent.championPool
      .slice(0, 2)
      .forEach((champion, index) => {
        const directLaneBonus =
          opponent.role === selectedRole ? 8 : 0;

        const mainChampionBonus = index === 0 ? 4 : 0;

        const score = clamp(
          champion.comfortScore +
            directLaneBonus +
            mainChampionBonus,
          0,
          98,
        );

        const reasons = [
          `${opponent.riotId} played ${champion.championName} in ${champion.games} of ${opponent.games} analyzed Summoner's Rift matches.`,
          `${champion.winRate}% recent win rate with an average ${champion.averageKda} KDA.`,
        ];

        if (opponent.role === selectedRole) {
          reasons.push(
            `This player is assigned as your likely direct lane opponent while you are playing ${championName}.`,
          );
        } else {
          reasons.push(
            "The recent match history indicates this is one of the player's strongest comfort picks.",
          );
        }

        candidates.push({
          champion: champion.championName,
          championId: champion.championId,
          score,
          role: opponent.role,
          targetPlayer: opponent.riotId,
          reasons,
        });
      });
  }

  const bestByChampion = new Map<
    string,
    RiotBanRecommendation
  >();

  for (const candidate of candidates) {
    const key = candidate.champion.toLowerCase();
    const existing = bestByChampion.get(key);

    if (!existing || candidate.score > existing.score) {
      bestByChampion.set(key, candidate);
    }
  }

  return [...bestByChampion.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

async function riotFetch<T>(
  route: RegionalRoute,
  path: string,
): Promise<T> {
  const apiKey = process.env.RIOT_API_KEY;

  if (!apiKey) {
    throw new RiotApiError(
      500,
      "RIOT_API_KEY is missing from the server environment.",
    );
  }

  const response = await fetch(
    `https://${route}.api.riotgames.com${path}`,
    {
      headers: {
        Accept: "application/json",
        "X-Riot-Token": apiKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );

  if (!response.ok) {
    const retryAfterHeader =
      response.headers.get("retry-after");

    const retryAfter = retryAfterHeader
      ? Number(retryAfterHeader)
      : null;

    throw new RiotApiError(
      response.status,
      `Riot API returned status ${response.status}.`,
      Number.isFinite(retryAfter) ? retryAfter : null,
    );
  }

  return (await response.json()) as T;
}

function normalizeRiotPosition(
  position: string,
): ScoutRole | null {
  switch (position.toUpperCase()) {
    case "TOP":
      return "top";

    case "JUNGLE":
      return "jungle";

    case "MIDDLE":
      return "mid";

    case "BOTTOM":
      return "adc";

    case "UTILITY":
      return "support";

    default:
      return null;
  }
}

function getMostPlayedRole(
  roleCounts: Map<ScoutRole, number>,
): ScoutRole | null {
  let bestRole: ScoutRole | null = null;
  let bestCount = 0;

  for (const [role, count] of roleCounts.entries()) {
    if (count > bestCount) {
      bestRole = role;
      bestCount = count;
    }
  }

  return bestRole;
}

function getConfidenceLevel(
  analyzedMatches: number,
  primaryChampionGames: number,
): "High" | "Medium" | "Low" {
  if (
    analyzedMatches >= 8 &&
    primaryChampionGames >= 3
  ) {
    return "High";
  }

  if (
    analyzedMatches >= 4 ||
    primaryChampionGames >= 2
  ) {
    return "Medium";
  }

  return "Low";
}

async function mapWithConcurrency<
  TInput,
  TOutput,
>(
  items: TInput[],
  concurrency: number,
  mapper: (
    item: TInput,
    index: number,
  ) => Promise<TOutput>,
): Promise<TOutput[]> {
  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await mapper(
        items[currentIndex],
        currentIndex,
      );
    }
  }

  const workerCount = Math.min(
    concurrency,
    Math.max(1, items.length),
  );

  await Promise.all(
    Array.from(
      {
        length: workerCount,
      },
      () => worker(),
    ),
  );

  return results;
}

function getCachedValue<T>(key: string): T | null {
  const entry = riotCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() >= entry.expiresAt) {
    riotCache.delete(key);
    return null;
  }

  return entry.value as T;
}

function setCachedValue<T>(
  key: string,
  value: T,
  lifetime: number,
) {
  riotCache.set(key, {
    value,
    expiresAt: Date.now() + lifetime,
  });
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}