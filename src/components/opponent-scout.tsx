"use client";

import {
  forwardRef,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBolt,
  faCheck,
  faChevronRight,
  faCircleExclamation,
  faClipboard,
  faEraser,
  faFlask,
  faGlobeEurope,
  faHashtag,
  faMagnifyingGlassChart,
  faRotateRight,
  faShieldHalved,
  faSpinner,
  faTrophy,
  faUserGroup,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";


type RoleId = "top" | "jungle" | "mid" | "adc" | "support";

type OpponentInput = {
  role: RoleId;
  gameName: string;
  tagLine: string;
};

type OpponentResult = {
  role: RoleId;
  riotId: string;
  primaryChampion: string;
  secondaryChampion: string;
  games: number;
  winRate: number;
  threatScore: number;
  confidence: "High" | "Medium";
};

type BanRecommendation = {
  champion: string;
  score: number;
  role: RoleId;
  targetPlayer: string;
  reasons: string[];
};

type AnalysisResult = {
  opponents: OpponentResult[];
  recommendations: BanRecommendation[];
};

type FieldErrors = Partial<
  Record<RoleId, { gameName?: string; tagLine?: string }>
>;

const roleInformation: Record<
  RoleId,
  {
    name: string;
    shortName: string;
    iconPath: string;
    description: string;
  }
> = {
  top: {
    name: "Top",
    shortName: "TOP",
    iconPath: "/icons/roles/top.png",
    description: "Enemy top laner",
  },
  jungle: {
    name: "Jungle",
    shortName: "JGL",
    iconPath: "/icons/roles/jungle.png",
    description: "Enemy jungler",
  },
  mid: {
    name: "Mid",
    shortName: "MID",
    iconPath: "/icons/roles/mid.png",
    description: "Enemy mid laner",
  },
  adc: {
    name: "ADC",
    shortName: "ADC",
    iconPath: "/icons/roles/adc.png",
    description: "Enemy marksman",
  },
  support: {
    name: "Support",
    shortName: "SUP",
    iconPath: "/icons/roles/support.png",
    description: "Enemy support",
  },
};

const regions = [
  {
    id: "euw1",
    label: "Europe West",
    shortLabel: "EUW",
  },
  {
    id: "eun1",
    label: "Europe Nordic & East",
    shortLabel: "EUNE",
  },
  {
    id: "na1",
    label: "North America",
    shortLabel: "NA",
  },
  {
    id: "kr",
    label: "Korea",
    shortLabel: "KR",
  },
  {
    id: "br1",
    label: "Brazil",
    shortLabel: "BR",
  },
  {
    id: "la1",
    label: "Latin America North",
    shortLabel: "LAN",
  },
  {
    id: "la2",
    label: "Latin America South",
    shortLabel: "LAS",
  },
  {
    id: "oc1",
    label: "Oceania",
    shortLabel: "OCE",
  },
];

const championPools: Record<RoleId, string[]> = {
  top: [
    "Fiora",
    "Darius",
    "Camille",
    "Jax",
    "Aatrox",
    "Yone",
    "Ornn",
  ],
  jungle: [
    "Nocturne",
    "Lillia",
    "Viego",
    "Kayn",
    "Lee Sin",
    "Diana",
    "Jarvan IV",
  ],
  mid: [
    "Katarina",
    "Zed",
    "Ahri",
    "Sylas",
    "Yone",
    "Veigar",
    "Syndra",
  ],
  adc: [
    "Jinx",
    "Caitlyn",
    "Kai'Sa",
    "Jhin",
    "Ezreal",
    "Ashe",
    "Smolder",
  ],
  support: [
    "Thresh",
    "Pyke",
    "Nautilus",
    "Leona",
    "Lulu",
    "Rakan",
    "Nami",
  ],
};

const initialOpponents: OpponentInput[] = (
  Object.keys(roleInformation) as RoleId[]
).map((role) => ({
  role,
  gameName: "",
  tagLine: "",
}));

export function OpponentScout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);

  const mode = searchParams.get("mode") ?? "ranked";
  const selectedRole = normalizeRole(searchParams.get("role"));
  const championId = searchParams.get("champion") ?? "";
  const championName =
    searchParams.get("championName") ?? championId ?? "Unknown champion";
  const dataDragonVersion = searchParams.get("version") ?? "";

  const [region, setRegion] = useState("euw1");
  const [opponents, setOpponents] =
    useState<OpponentInput[]>(initialOpponents);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResult | null>(null);

  const selectedRegion = useMemo(
    () => regions.find((item) => item.id === region) ?? regions[0],
    [region],
  );

  const completedOpponents = useMemo(
    () =>
      opponents.filter(
        (opponent) =>
          opponent.gameName.trim() && opponent.tagLine.trim(),
      ),
    [opponents],
  );

  const championImageUrl =
    championId && dataDragonVersion
      ? `https://ddragon.leagueoflegends.com/cdn/${dataDragonVersion}/img/champion/${championId}.png`
      : null;

  function updateOpponent(
    role: RoleId,
    field: "gameName" | "tagLine",
    value: string,
  ) {
    setOpponents((currentOpponents) =>
      currentOpponents.map((opponent) =>
        opponent.role === role
          ? {
              ...opponent,
              [field]: value,
            }
          : opponent,
      ),
    );

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [role]: {
        ...currentErrors[role],
        [field]: undefined,
      },
    }));

    setAnalysisResult(null);
  }

  function clearOpponent(role: RoleId) {
    setOpponents((currentOpponents) =>
      currentOpponents.map((opponent) =>
        opponent.role === role
          ? {
              ...opponent,
              gameName: "",
              tagLine: "",
            }
          : opponent,
      ),
    );

    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[role];
      return nextErrors;
    });

    setAnalysisResult(null);
  }

  function clearAllOpponents() {
    setOpponents(initialOpponents);
    setFieldErrors({});
    setAnalysisResult(null);
  }

  function handleBulkImport() {
    const lines = bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setBulkError("Enter at least one Riot ID.");
      return;
    }

    const parsedPlayers: Array<{
      gameName: string;
      tagLine: string;
    }> = [];

    for (const line of lines.slice(0, 5)) {
      const hashPosition = line.lastIndexOf("#");

      if (hashPosition <= 0 || hashPosition === line.length - 1) {
        setBulkError(
          `Could not read "${line}". Use the format Game Name#TAG.`,
        );
        return;
      }

      const gameName = line.slice(0, hashPosition).trim();
      const tagLine = line.slice(hashPosition + 1).trim();

      if (!gameName || !tagLine) {
        setBulkError(
          `Could not read "${line}". Use the format Game Name#TAG.`,
        );
        return;
      }

      parsedPlayers.push({
        gameName,
        tagLine,
      });
    }

    setOpponents((currentOpponents) =>
      currentOpponents.map((opponent, index) => ({
        ...opponent,
        gameName:
          parsedPlayers[index]?.gameName ?? opponent.gameName,
        tagLine:
          parsedPlayers[index]?.tagLine ?? opponent.tagLine,
      })),
    );

    setBulkError("");
    setBulkImportOpen(false);
    setBulkText("");
    setFieldErrors({});
    setAnalysisResult(null);
  }

  function validateOpponents() {
    const nextErrors: FieldErrors = {};
    let hasCompleteOpponent = false;

    for (const opponent of opponents) {
      const hasGameName = Boolean(opponent.gameName.trim());
      const hasTagLine = Boolean(opponent.tagLine.trim());

      if (hasGameName && hasTagLine) {
        hasCompleteOpponent = true;
        continue;
      }

      if (hasGameName || hasTagLine) {
        nextErrors[opponent.role] = {
          gameName: hasGameName
            ? undefined
            : "Enter the player's game name.",
          tagLine: hasTagLine
            ? undefined
            : "Enter the player's tag.",
        };
      }
    }

    setFieldErrors(nextErrors);

    return {
      valid:
        hasCompleteOpponent &&
        Object.keys(nextErrors).length === 0,
      hasCompleteOpponent,
    };
  }

  async function handleAnalyze() {
    if (isAnalyzing) {
      return;
    }

    const validation = validateOpponents();

    if (!validation.valid) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 1400);
    });

    const result = generateMockAnalysis(
      completedOpponents,
      selectedRole,
      championName,
    );

    setAnalysisResult(result);
    setIsAnalyzing(false);

    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-7 lg:px-10 lg:py-14">
      <ScoutProgress />

      <div className="mt-10 grid gap-8 lg:grid-cols-[285px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[104px] lg:self-start">
          <button
            type="button"
            onClick={() =>
              router.push(`/setup?mode=${encodeURIComponent(mode)}`)
            }
            className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#738690] transition hover:text-white"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to champion
          </button>

          <div className="glass-panel overflow-hidden">
            <div className="border-b border-white/[0.07] p-5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#637680]">
                Your scout setup
              </span>

              <div className="mt-4 flex items-center gap-3">
                {championImageUrl ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-[#c89b3c]/35">
                    <Image
                      src={championImageUrl}
                      alt={championName}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid h-12 w-12 place-items-center border border-[#c89b3c]/25 bg-[#c89b3c]/8 text-[#d9b85f]">
                    <FontAwesomeIcon icon={faShieldHalved} />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-display truncate text-lg font-semibold text-white">
                    {championName}
                  </p>

                  <p className="mt-0.5 text-[10px] capitalize text-[#71848e]">
                    {formatRole(selectedRole)} · {formatMode(mode)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1 p-3">
              <SideStep
                number="01"
                title="Game mode"
                description={formatMode(mode)}
                status="complete"
              />

              <SideStep
                number="02"
                title="Role & champion"
                description={`${formatRole(selectedRole)} · ${championName}`}
                status="complete"
              />

              <SideStep
                number="03"
                title="Opponents"
                description={`${completedOpponents.length} of 5 entered`}
                status="active"
              />
            </div>
          </div>

          <div className="mt-4 border border-[#c89b3c]/18 bg-[#c89b3c]/5 p-4">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon
                icon={faFlask}
                className="mt-0.5 text-sm text-[#c89b3c]"
              />

              <div>
                <p className="text-xs font-semibold text-[#c4d0d5]">
                  Demo analysis
                </p>

                <p className="mt-1 text-[11px] leading-5 text-[#71848d]">
                  This version generates preview data. No real player
                  statistics are fetched yet.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <SectionHeader />

          <section className="mt-7 border border-white/[0.075] bg-white/[0.018]">
            <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
              <div className="w-full sm:max-w-[300px]">
                <label
                  htmlFor="region"
                  className="mb-2 block text-[9px] font-bold uppercase tracking-[0.18em] text-[#71848d]"
                >
                  Server region
                </label>

                <div className="relative">
                  <FontAwesomeIcon
                    icon={faGlobeEurope}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#61747d]"
                  />

                  <select
                    id="region"
                    value={region}
                    onChange={(event) => {
                      setRegion(event.target.value);
                      setAnalysisResult(null);
                    }}
                    className="h-11 w-full appearance-none border border-white/[0.085] bg-[#050d13] pl-11 pr-10 text-sm text-[#d8e1e5] outline-none transition focus:border-[#0ac8b9]/45"
                  >
                    {regions.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                        className="bg-[#071018]"
                      >
                        {item.label} ({item.shortLabel})
                      </option>
                    ))}
                  </select>

                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[9px] text-[#61747d]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setBulkImportOpen((current) => !current)
                  }
                  className="inline-flex min-h-10 items-center gap-2 border border-white/[0.09] bg-white/[0.025] px-4 text-xs font-semibold text-[#aab8be] transition hover:border-white/[0.18] hover:bg-white/[0.05] hover:text-white"
                >
                  <FontAwesomeIcon icon={faClipboard} />
                  Paste team
                </button>

                <button
                  type="button"
                  onClick={clearAllOpponents}
                  className="inline-flex min-h-10 items-center gap-2 border border-white/[0.09] bg-white/[0.025] px-4 text-xs font-semibold text-[#7f929b] transition hover:border-[#ef5a67]/25 hover:text-[#ef8891]"
                >
                  <FontAwesomeIcon icon={faEraser} />
                  Clear
                </button>
              </div>
            </div>

            {bulkImportOpen && (
              <div className="border-b border-[#0ac8b9]/15 bg-[#0ac8b9]/[0.025] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Paste multiple Riot IDs
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[#71848d]">
                      Enter one player per line in lane order: Top,
                      Jungle, Mid, ADC and Support.
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Close bulk import"
                    onClick={() => {
                      setBulkImportOpen(false);
                      setBulkError("");
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center border border-white/[0.08] text-[#738690] transition hover:text-white"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>

                <textarea
                  value={bulkText}
                  onChange={(event) => {
                    setBulkText(event.target.value);
                    setBulkError("");
                  }}
                  placeholder={`PlayerOne#EUW\nJungleMain#1234\nMidPlayer#MID\nADCPlayer#EUW\nSupportMain#SUP`}
                  rows={6}
                  className="mt-4 w-full resize-y border border-white/[0.085] bg-[#030a0f] p-4 font-mono text-sm leading-6 text-white outline-none transition placeholder:text-[#465860] focus:border-[#0ac8b9]/45"
                />

                {bulkError && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-[#ef7b85]">
                    <FontAwesomeIcon icon={faCircleExclamation} />
                    {bulkError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 bg-[#0ac8b9] px-5 text-xs font-bold uppercase tracking-[0.12em] text-[#02110f] transition hover:bg-[#30d7ca]"
                >
                  <FontAwesomeIcon icon={faCheck} />
                  Import players
                </button>
              </div>
            )}

            <div className="space-y-3 p-4 sm:p-5">
              {opponents.map((opponent, index) => (
                <OpponentRow
                  key={opponent.role}
                  index={index}
                  opponent={opponent}
                  errors={fieldErrors[opponent.role]}
                  onChange={updateOpponent}
                  onClear={clearOpponent}
                />
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-xs font-semibold text-[#aebbc1]">
                  {completedOpponents.length} opponent
                  {completedOpponents.length === 1 ? "" : "s"} ready
                </p>

                <p className="mt-1 text-[10px] leading-4 text-[#61747d]">
                  You only need to enter the opponents you want to
                  analyze.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  completedOpponents.length === 0 || isAnalyzing
                }
                onClick={handleAnalyze}
                className={[
                  "group inline-flex min-h-12 items-center justify-center gap-3 border px-6",
                  "text-xs font-bold uppercase tracking-[0.12em] transition duration-300",
                  completedOpponents.length > 0 && !isAnalyzing
                    ? "border-[#0ac8b9]/45 bg-[#0ac8b9] text-[#02110f] shadow-[0_12px_34px_rgba(10,200,185,0.14)] hover:bg-[#30d7ca]"
                    : "cursor-not-allowed border-white/[0.07] bg-white/[0.025] text-[#52636b]",
                ].join(" ")}
              >
                <FontAwesomeIcon
                  icon={
                    isAnalyzing
                      ? faSpinner
                      : faMagnifyingGlassChart
                  }
                  spin={isAnalyzing}
                />

                {isAnalyzing
                  ? "Analyzing opponents..."
                  : "Analyze opponents"}

                {!isAnalyzing && (
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>
            </div>
          </section>

          {isAnalyzing && <AnalysisLoading />}

          {analysisResult && (
            <AnalysisResults
              ref={resultsRef}
              result={analysisResult}
              championName={championName}
              selectedRole={selectedRole}
              region={selectedRegion.shortLabel}
              onReset={() => {
                setAnalysisResult(null);

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

type OpponentRowProps = {
  index: number;
  opponent: OpponentInput;
  errors?: {
    gameName?: string;
    tagLine?: string;
  };
  onChange: (
    role: RoleId,
    field: "gameName" | "tagLine",
    value: string,
  ) => void;
  onClear: (role: RoleId) => void;
};

function OpponentRow({
  index,
  opponent,
  errors,
  onChange,
  onClear,
}: OpponentRowProps) {
  const role = roleInformation[opponent.role];
  const hasValue =
    opponent.gameName.trim() || opponent.tagLine.trim();
  const complete =
    opponent.gameName.trim() && opponent.tagLine.trim();

  return (
    <article
      className={[
        "grid gap-4 border p-4 transition duration-200",
        "lg:grid-cols-[170px_minmax(0,1fr)_170px_38px] lg:items-start",
        errors
          ? "border-[#ef5a67]/30 bg-[#ef5a67]/[0.025]"
          : complete
            ? "border-[#0ac8b9]/20 bg-[#0ac8b9]/[0.025]"
            : "border-white/[0.07] bg-white/[0.012]",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 lg:pt-1">
        <div
          className={[
            "grid h-11 w-11 shrink-0 place-items-center border",
            complete
              ? "border-[#0ac8b9]/25 bg-[#0ac8b9]/7 text-[#69ddd4]"
              : "border-white/[0.08] bg-[#07131b] text-[#71858f]",
          ].join(" ")}
        >
          <LaneIcon
            src={role.iconPath}
            className="h-6 w-6"
          />
        </div>

        <div>
          <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#5e717a]">
            Player 0{index + 1}
          </span>

          <p className="font-display mt-0.5 text-base font-semibold text-white">
            {role.name}
          </p>

          <p className="mt-0.5 text-[9px] text-[#62747d]">
            {role.description}
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor={`${opponent.role}-game-name`}
          className="mb-2 block text-[8px] font-bold uppercase tracking-[0.16em] text-[#61747d]"
        >
          Riot game name
        </label>

        <input
          id={`${opponent.role}-game-name`}
          type="text"
          value={opponent.gameName}
          onChange={(event) =>
            onChange(
              opponent.role,
              "gameName",
              event.target.value,
            )
          }
          placeholder="Game name"
          autoComplete="off"
          className={[
            "h-11 w-full border bg-[#050d13] px-4 text-sm text-white outline-none transition",
            "placeholder:text-[#465860]",
            errors?.gameName
              ? "border-[#ef5a67]/45"
              : "border-white/[0.085] focus:border-[#0ac8b9]/45",
          ].join(" ")}
        />

        {errors?.gameName && (
          <p className="mt-1.5 text-[10px] text-[#ef7b85]">
            {errors.gameName}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor={`${opponent.role}-tag-line`}
          className="mb-2 block text-[8px] font-bold uppercase tracking-[0.16em] text-[#61747d]"
        >
          Tagline
        </label>

        <div className="relative">
          <FontAwesomeIcon
            icon={faHashtag}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[#61747d]"
          />

          <input
            id={`${opponent.role}-tag-line`}
            type="text"
            value={opponent.tagLine}
            onChange={(event) =>
              onChange(
                opponent.role,
                "tagLine",
                event.target.value.replace("#", ""),
              )
            }
            placeholder="EUW"
            autoComplete="off"
            className={[
              "h-11 w-full border bg-[#050d13] pl-9 pr-4 text-sm uppercase text-white outline-none transition",
              "placeholder:text-[#465860]",
              errors?.tagLine
                ? "border-[#ef5a67]/45"
                : "border-white/[0.085] focus:border-[#0ac8b9]/45",
            ].join(" ")}
          />
        </div>

        {errors?.tagLine && (
          <p className="mt-1.5 text-[10px] text-[#ef7b85]">
            {errors.tagLine}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={!hasValue}
        onClick={() => onClear(opponent.role)}
        aria-label={`Clear ${role.name} opponent`}
        className={[
          "grid h-10 w-10 place-items-center border transition lg:mt-[22px]",
          hasValue
            ? "border-white/[0.08] text-[#71848d] hover:border-[#ef5a67]/25 hover:text-[#ef7b85]"
            : "cursor-not-allowed border-white/[0.04] text-[#3f4f56]",
        ].join(" ")}
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </article>
  );
}

function ScoutProgress() {
  return (
    <div className="border border-white/[0.07] bg-white/[0.018]">
      <div className="grid grid-cols-3">
        <ProgressItem
          number="01"
          label="Game mode"
          state="complete"
        />

        <ProgressItem
          number="02"
          label="Role & champion"
          state="complete"
        />

        <ProgressItem
          number="03"
          label="Opponent scouting"
          state="active"
        />
      </div>
    </div>
  );
}

type ProgressItemProps = {
  number: string;
  label: string;
  state: "complete" | "active";
};

function ProgressItem({
  number,
  label,
  state,
}: ProgressItemProps) {
  return (
    <div
      className={[
        "relative flex min-h-16 items-center gap-3 border-r border-white/[0.07] px-3 last:border-r-0 sm:px-5",
        state === "active" ? "bg-[#0ac8b9]/5" : "",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-7 w-7 shrink-0 place-items-center border text-[9px] font-bold",
          state === "complete"
            ? "border-[#0ac8b9]/30 bg-[#0ac8b9]/8 text-[#66ddd3]"
            : "border-[#c89b3c]/35 bg-[#c89b3c]/8 text-[#dbb65c]",
        ].join(" ")}
      >
        {state === "complete" ? (
          <FontAwesomeIcon icon={faCheck} />
        ) : (
          number
        )}
      </span>

      <div className="min-w-0">
        <span className="hidden text-[8px] font-bold uppercase tracking-[0.15em] text-[#53656e] sm:block">
          Step {number}
        </span>

        <p
          className={[
            "truncate text-[10px] font-semibold sm:text-xs",
            state === "active"
              ? "text-white"
              : "text-[#94a5ad]",
          ].join(" ")}
        >
          {label}
        </p>
      </div>

      {state === "active" && (
        <span className="absolute inset-x-0 bottom-0 h-px bg-[#c89b3c]" />
      )}
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center border border-[#c89b3c]/25 bg-[#c89b3c]/7 text-[9px] font-bold text-[#d6b054]">
        03
      </span>

      <div>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#0ac8b9]">
          Scout the enemy team
        </span>

        <h1 className="font-display mt-2 text-2xl font-semibold text-white sm:text-3xl">
          Who are you playing against?
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7d9099]">
          Enter the visible opponents you want RiftScout to analyze.
          Empty lanes will be ignored.
        </p>
      </div>
    </div>
  );
}

type SideStepProps = {
  number: string;
  title: string;
  description: string;
  status: "complete" | "active";
};

function SideStep({
  number,
  title,
  description,
  status,
}: SideStepProps) {
  return (
    <div
      className={[
        "flex items-center gap-3 border p-3",
        status === "active"
          ? "border-[#c89b3c]/25 bg-[#c89b3c]/6"
          : "border-transparent",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-7 w-7 shrink-0 place-items-center border text-[9px] font-bold",
          status === "complete"
            ? "border-[#0ac8b9]/25 bg-[#0ac8b9]/7 text-[#64ddd2]"
            : "border-[#c89b3c]/30 bg-[#c89b3c]/8 text-[#d9b85f]",
        ].join(" ")}
      >
        {status === "complete" ? (
          <FontAwesomeIcon icon={faCheck} />
        ) : (
          number
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-[#c4d0d5]">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-[#62747d]">
          {description}
        </p>
      </div>

      <FontAwesomeIcon
        icon={faChevronRight}
        className="text-[9px] text-[#53666f]"
      />
    </div>
  );
}

function AnalysisLoading() {
  return (
    <div className="mt-8 flex min-h-[240px] flex-col items-center justify-center border border-[#0ac8b9]/15 bg-[#0ac8b9]/[0.02]">
      <div className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full border border-[#0ac8b9]/20" />

        <div className="grid h-12 w-12 place-items-center border border-[#0ac8b9]/30 bg-[#0ac8b9]/7 text-[#63ddd3]">
          <FontAwesomeIcon
            icon={faMagnifyingGlassChart}
            className="text-lg"
          />
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-white">
        Analyzing opponent profiles
      </p>

      <p className="mt-2 text-xs text-[#6e818a]">
        Calculating comfort picks and ban priorities...
      </p>
    </div>
  );
}

type AnalysisResultsProps = {
  result: AnalysisResult;
  championName: string;
  selectedRole: RoleId;
  region: string;
  onReset: () => void;
};

const AnalysisResults = forwardRef<
  HTMLDivElement,
  AnalysisResultsProps
>(function AnalysisResults(
  {
    result,
    championName,
    selectedRole,
    region,
    onReset,
  },
  ref,
) {
  const primaryRecommendation = result.recommendations[0];

  return (
    <div
      ref={ref}
      className="scroll-mt-28"
    >
      <section className="mt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#0ac8b9]">
              Demo analysis complete
            </span>

            <h2 className="font-display mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Recommended bans
            </h2>

            <p className="mt-3 text-sm text-[#788b94]">
              Based on generated preview data for {championName}{" "}
              {formatRole(selectedRole)} on {region}.
            </p>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-10 w-fit items-center gap-2 border border-white/[0.09] bg-white/[0.025] px-4 text-xs font-semibold text-[#9cabb2] transition hover:text-white"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Edit opponents
          </button>
        </div>

        {primaryRecommendation && (
          <article className="glass-panel relative mt-7 overflow-hidden border-[#c89b3c]/30 p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#c89b3c]/8 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center border border-[#c89b3c]/35 bg-[#c89b3c]/10 text-xl text-[#e1bd63]">
                  <FontAwesomeIcon icon={faTrophy} />
                </div>

                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#b79548]">
                    Highest priority ban
                  </span>

                  <h3 className="font-display mt-2 text-3xl font-semibold text-white">
                    {primaryRecommendation.champion}
                  </h3>

                  <p className="mt-2 text-xs text-[#83969f]">
                    Targeting{" "}
                    {primaryRecommendation.targetPlayer} ·{" "}
                    {formatRole(primaryRecommendation.role)}
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="font-display text-4xl font-semibold text-[#e1bd63]">
                  {primaryRecommendation.score}
                </span>

                <span className="text-xs text-[#6f818a]">
                  /100
                </span>

                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#7a8d96]">
                  Ban priority
                </p>
              </div>
            </div>

            <div className="relative mt-6 h-1 overflow-hidden bg-white/[0.06]">
              <div
                className="h-full bg-[linear-gradient(90deg,#8d6923,#e1bd63)]"
                style={{
                  width: `${primaryRecommendation.score}%`,
                }}
              />
            </div>

            <ul className="relative mt-6 grid gap-3 sm:grid-cols-2">
              {primaryRecommendation.reasons.map((reason) => (
                <li
                  key={reason}
                  className="flex items-start gap-3 text-xs leading-5 text-[#a5b3b9]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#c89b3c]" />
                  {reason}
                </li>
              ))}
            </ul>
          </article>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {result.recommendations.map(
            (recommendation, index) => (
              <article
                key={`${recommendation.champion}-${recommendation.targetPlayer}`}
                className={[
                  "border p-5",
                  index === 0
                    ? "border-[#c89b3c]/25 bg-[#c89b3c]/5"
                    : "border-white/[0.075] bg-white/[0.018]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#61747d]">
                    Priority 0{index + 1}
                  </span>

                  <span
                    className={
                      index === 0
                        ? "text-sm font-semibold text-[#e1bd63]"
                        : "text-sm font-semibold text-[#a8b7be]"
                    }
                  >
                    {recommendation.score}
                  </span>
                </div>

                <h3 className="font-display mt-5 text-xl font-semibold text-white">
                  {recommendation.champion}
                </h3>

                <p className="mt-2 text-[10px] text-[#748790]">
                  {recommendation.targetPlayer}
                </p>

                <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4">
                  <LaneIcon
                    src={
                      roleInformation[recommendation.role]
                        .iconPath
                    }
                    className="h-4 w-4 text-[#71858f]"
                  />

                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#61747d]">
                    {formatRole(recommendation.role)}
                  </span>
                </div>
              </article>
            ),
          )}
        </div>

        <div className="mt-10">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c89b3c]">
            Player breakdown
          </span>

          <h2 className="font-display mt-2 text-2xl font-semibold text-white">
            Opponent threat overview
          </h2>
        </div>

        <div className="mt-6 space-y-3">
          {result.opponents.map((opponent) => (
            <OpponentResultCard
              key={`${opponent.role}-${opponent.riotId}`}
              opponent={opponent}
            />
          ))}
        </div>
      </section>
    </div>
  );
});

type OpponentResultCardProps = {
  opponent: OpponentResult;
};

function OpponentResultCard({
  opponent,
}: OpponentResultCardProps) {
  const role = roleInformation[opponent.role];

  return (
    <article className="grid gap-5 border border-white/[0.075] bg-white/[0.018] p-5 md:grid-cols-[180px_minmax(0,1fr)_120px] md:items-center">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center border border-white/[0.085] bg-[#07131b] text-[#7e929b]">
          <LaneIcon
            src={role.iconPath}
            className="h-6 w-6"
          />
        </div>

        <div className="min-w-0">
          <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#5e717a]">
            {role.shortName}
          </span>

          <p className="mt-1 truncate text-xs font-semibold text-white">
            {opponent.riotId}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultStat
          label="Comfort pick"
          value={opponent.primaryChampion}
        />

        <ResultStat
          label="Secondary"
          value={opponent.secondaryChampion}
        />

        <ResultStat
          label="Demo games"
          value={String(opponent.games)}
        />

        <ResultStat
          label="Demo win rate"
          value={`${opponent.winRate}%`}
        />
      </div>

      <div className="md:text-right">
        <span
          className={[
            "font-display text-2xl font-semibold",
            opponent.threatScore >= 88
              ? "text-[#e1bd63]"
              : opponent.threatScore >= 78
                ? "text-[#9fc4cb]"
                : "text-[#899ca5]",
          ].join(" ")}
        >
          {opponent.threatScore}
        </span>

        <span className="text-[10px] text-[#60727b]">
          /100
        </span>

        <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.15em] text-[#60727b]">
          Threat · {opponent.confidence}
        </p>
      </div>
    </article>
  );
}

type ResultStatProps = {
  label: string;
  value: string;
};

function ResultStat({
  label,
  value,
}: ResultStatProps) {
  return (
    <div>
      <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#5e717a]">
        {label}
      </span>

      <p className="mt-1 truncate text-xs font-semibold text-[#c4d0d5]">
        {value}
      </p>
    </div>
  );
}

type LaneIconProps = {
  src: string;
  className?: string;
};

function LaneIcon({
  src,
  className = "",
}: LaneIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

function generateMockAnalysis(
  opponents: OpponentInput[],
  selectedRole: RoleId,
  championName: string,
): AnalysisResult {
  const opponentResults: OpponentResult[] = opponents.map(
    (opponent) => {
      const seed = createSeed(
        `${opponent.gameName}-${opponent.tagLine}-${opponent.role}`,
      );

      const pool = championPools[opponent.role];
      const primaryIndex = seed % pool.length;
      const secondaryIndex = (primaryIndex + 2) % pool.length;

      const roleBonus =
        opponent.role === selectedRole ? 7 : 0;

      return {
        role: opponent.role,
        riotId: `${opponent.gameName}#${opponent.tagLine}`,
        primaryChampion: pool[primaryIndex],
        secondaryChampion: pool[secondaryIndex],
        games: 8 + (seed % 28),
        winRate: 48 + (seed % 20),
        threatScore: Math.min(
          97,
          66 + (seed % 25) + roleBonus,
        ),
        confidence: seed % 3 === 0 ? "Medium" : "High",
      };
    },
  );

  const sortedOpponents = [...opponentResults].sort(
    (a, b) => b.threatScore - a.threatScore,
  );

  const uniqueRecommendations: BanRecommendation[] = [];

  for (const opponent of sortedOpponents) {
    if (
      uniqueRecommendations.some(
        (recommendation) =>
          recommendation.champion ===
          opponent.primaryChampion,
      )
    ) {
      continue;
    }

    uniqueRecommendations.push({
      champion: opponent.primaryChampion,
      score: opponent.threatScore,
      role: opponent.role,
      targetPlayer: opponent.riotId,
      reasons: [
        `${opponent.primaryChampion} is generated as ${opponent.riotId}'s strongest comfort pick.`,
        opponent.role === selectedRole
          ? `This player is your likely direct lane opponent into ${championName}.`
          : "The generated profile shows a concentrated champion pool.",
        `${opponent.games} preview games produce a ${opponent.winRate}% demo win rate.`,
      ],
    });

    if (uniqueRecommendations.length === 3) {
      break;
    }
  }

  return {
    opponents: opponentResults,
    recommendations: uniqueRecommendations,
  };
}

function createSeed(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function normalizeRole(value: string | null): RoleId {
  if (
    value === "top" ||
    value === "jungle" ||
    value === "mid" ||
    value === "adc" ||
    value === "support"
  ) {
    return value;
  }

  return "mid";
}

function formatRole(role: RoleId) {
  return roleInformation[role].name;
}

function formatMode(mode: string) {
  return mode
    .replace("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}