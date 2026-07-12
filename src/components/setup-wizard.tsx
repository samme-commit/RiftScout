"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faChevronRight,
  faCircleExclamation,
  faGamepad,
  faLock,
  faMagnifyingGlass,
  faRotateRight,
  faShieldHalved,
  faSpinner,
  faTrophy,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";

import { roles, getRoleById, type RoleId } from "@/data/roles";
import type {
  Champion,
  ChampionDataResponse,
} from "@/types/champion";

type LoadingStatus = "loading" | "success" | "error";

const validModes = ["swiftplay", "blind-pick", "ranked"] as const;

type ValidMode = (typeof validModes)[number];

const modeInformation: Record<
  ValidMode,
  {
    name: string;
    description: string;
  }
> = {
  swiftplay: {
    name: "Swiftplay",
    description: "Fast matchup preparation",
  },
  "blind-pick": {
    name: "Blind Pick",
    description: "Opponent and role scouting",
  },
  ranked: {
    name: "Ranked",
    description: "Draft and ban intelligence",
  },
};

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

export function SetupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedMode = searchParams.get("mode");

  const mode: ValidMode = validModes.includes(requestedMode as ValidMode)
    ? (requestedMode as ValidMode)
    : "ranked";

  const [selectedRoleId, setSelectedRoleId] = useState<RoleId | null>(null);
  const [selectedChampion, setSelectedChampion] =
    useState<Champion | null>(null);

  const [champions, setChampions] = useState<Champion[]>([]);
  const [dataDragonVersion, setDataDragonVersion] = useState("");
  const [loadingStatus, setLoadingStatus] =
    useState<LoadingStatus>("loading");

  const [searchQuery, setSearchQuery] = useState("");

  const selectedRole = getRoleById(selectedRoleId);

  async function loadChampions(signal?: AbortSignal) {
    try {
      setLoadingStatus("loading");

      const versionsResponse = await fetch(
        "https://ddragon.leagueoflegends.com/api/versions.json",
        { signal },
      );

      if (!versionsResponse.ok) {
        throw new Error("Could not load Data Dragon versions.");
      }

      const versions = (await versionsResponse.json()) as string[];
      const latestVersion = versions[0];

      if (!latestVersion) {
        throw new Error("No Data Dragon version was found.");
      }

      const championsResponse = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`,
        { signal },
      );

      if (!championsResponse.ok) {
        throw new Error("Could not load champion data.");
      }

      const championData =
        (await championsResponse.json()) as ChampionDataResponse;

      const championList = Object.values(championData.data).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      setChampions(championList);
      setDataDragonVersion(latestVersion);
      setLoadingStatus("success");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error(error);
      setLoadingStatus("error");
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    loadChampions(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const suggestedChampionIds = useMemo(() => {
    return new Set(selectedRole?.suggestedChampions ?? []);
  }, [selectedRole]);

  const filteredChampions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...champions]
      .filter((champion) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          champion.name.toLowerCase().includes(normalizedQuery) ||
          champion.title.toLowerCase().includes(normalizedQuery) ||
          champion.tags.some((tag) =>
            tag.toLowerCase().includes(normalizedQuery),
          )
        );
      })
      .sort((a, b) => {
        const aSuggested = suggestedChampionIds.has(a.id);
        const bSuggested = suggestedChampionIds.has(b.id);

        if (aSuggested && !bSuggested) {
          return -1;
        }

        if (!aSuggested && bSuggested) {
          return 1;
        }

        return a.name.localeCompare(b.name);
      });
  }, [champions, searchQuery, suggestedChampionIds]);

  function handleRoleSelect(roleId: RoleId) {
    setSelectedRoleId(roleId);
    setSelectedChampion(null);
    setSearchQuery("");

    window.setTimeout(() => {
      document
        .getElementById("champion-selection")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 80);
  }

  function handleChampionSelect(champion: Champion) {
    setSelectedChampion(champion);
  }

  function handleContinue() {
    if (!selectedRole || !selectedChampion) {
      return;
    }

    const params = new URLSearchParams({
      mode,
      role: selectedRole.id,
      champion: selectedChampion.id,
      championName: selectedChampion.name,
      version: dataDragonVersion,
    });

    router.push(`/scout?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-7 lg:px-10 lg:py-14">
      <SetupProgress />

      <div className="mt-10 grid gap-8 lg:grid-cols-[285px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[104px] lg:self-start">
          <button
            type="button"
            onClick={() => router.push("/#game-modes")}
            className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#738690] transition hover:text-white"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Change mode
          </button>

          <div className="glass-panel overflow-hidden">
            <div className="border-b border-white/[0.07] p-5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#637680]">
                Selected mode
              </span>

              <div className="mt-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center border border-[#c89b3c]/25 bg-[#c89b3c]/8 text-[#d9b85f]">
                  <FontAwesomeIcon
                    icon={mode === "ranked" ? faTrophy : faGamepad}
                  />
                </div>

                <div>
                  <p className="font-display text-lg font-semibold text-white">
                    {modeInformation[mode].name}
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#71848e]">
                    {modeInformation[mode].description}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1 p-3">
              <SideStep
                number="01"
                title="Game mode"
                description={modeInformation[mode].name}
                status="complete"
              />

              <SideStep
                number="02"
                title="Role"
                description={selectedRole?.name ?? "Not selected"}
                status={selectedRole ? "complete" : "active"}
              />

              <SideStep
                number="03"
                title="Champion"
                description={selectedChampion?.name ?? "Not selected"}
                status={
                  selectedChampion
                    ? "complete"
                    : selectedRole
                      ? "active"
                      : "locked"
                }
              />

              <SideStep
                number="04"
                title="Opponents"
                description="Riot IDs and lanes"
                status="locked"
              />
            </div>
          </div>

          <div className="mt-4 border border-white/[0.065] bg-white/[0.018] p-4">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="mt-0.5 text-sm text-[#c89b3c]"
              />

              <div>
                <p className="text-xs font-semibold text-[#c4d0d5]">
                  Why we need this
                </p>

                <p className="mt-1 text-[11px] leading-5 text-[#71848d]">
                  Your role and champion determine which enemy picks create
                  the greatest matchup risk.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <section>
            <SectionHeader
              number="01"
              eyebrow="Select your position"
              title="Which role are you playing?"
              description="Choose your intended role so RiftScout can prioritize relevant champions and matchups."
            />

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {roles.map((role) => {
                const selected = selectedRoleId === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleRoleSelect(role.id)}
                    className={[
                      "group relative flex min-h-[168px] flex-col border p-5 text-left",
                      "transition duration-300",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ac8b9]",
                      selected
                        ? "-translate-y-1 border-[#c89b3c]/65 bg-[#c89b3c]/7 shadow-[0_18px_45px_rgba(0,0,0,0.24)]"
                        : "border-white/[0.085] bg-white/[0.018] hover:-translate-y-1 hover:border-white/[0.18] hover:bg-white/[0.035]",
                    ].join(" ")}
                  >
                    <div className="flex h-12 w-full items-start justify-between">
                      <div
                        className={[
                          "grid h-12 w-12 shrink-0 place-items-center border",
                          "transition duration-300",
                          selected
                            ? "border-[#c89b3c]/40 bg-[#c89b3c]/10 text-[#e1bd63]"
                            : "border-white/[0.09] bg-[#07131b] text-[#71858f] group-hover:border-white/[0.16] group-hover:text-[#b8c7cd]",
                        ].join(" ")}
                      >
                        <LaneIcon
                          src={role.iconPath}
                          className="h-6 w-6"
                        />
                      </div>

                      {selected && (
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0ac8b9] text-[10px] text-[#02110f]">
                          <FontAwesomeIcon icon={faCheck} />
                        </span>
                      )}
                    </div>

                    <span className="mt-7 block text-[9px] font-bold tracking-[0.18em] text-[#61747e]">
                      {role.shortName}
                    </span>

                    <h3 className="font-display mt-1 text-lg font-semibold text-white">
                      {role.name}
                    </h3>

                    <p className="mt-2 text-[11px] leading-5 text-[#71838d]">
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="my-12 h-px bg-white/[0.065]" />

          <section
            id="champion-selection"
            className="scroll-mt-28"
          >
            <SectionHeader
              number="02"
              eyebrow="Choose your champion"
              title={
                selectedRole
                  ? `Who are you playing ${selectedRole.name}?`
                  : "Select your champion"
              }
              description={
                selectedRole
                  ? `Champions commonly played ${selectedRole.name} are displayed first, but you can select any champion.`
                  : "Select your role first to unlock champion selection."
              }
            />

            {!selectedRole ? (
              <div className="mt-7 flex min-h-[260px] flex-col items-center justify-center border border-white/[0.07] bg-white/[0.015] px-6 text-center">
                <div className="grid h-12 w-12 place-items-center border border-white/[0.08] bg-white/[0.025] text-[#657780]">
                  <FontAwesomeIcon icon={faLock} />
                </div>

                <h3 className="mt-5 text-sm font-semibold text-[#a7b5bb]">
                  Champion selection is locked
                </h3>

                <p className="mt-2 max-w-sm text-xs leading-5 text-[#62747d]">
                  Choose Top, Jungle, Mid, ADC or Support before selecting your
                  champion.
                </p>
              </div>
            ) : (
              <div className="mt-7">
                <div className="flex flex-col gap-3 border border-white/[0.075] bg-white/[0.018] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="relative block flex-1">
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#62747d]"
                    />

                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(event.target.value)
                      }
                      placeholder="Search champions..."
                      className="h-11 w-full border border-white/[0.085] bg-[#050d13] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-[#53656e] focus:border-[#0ac8b9]/45"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#62747d]">
                      {filteredChampions.length} champions
                    </span>

                    {dataDragonVersion && (
                      <span className="border border-white/[0.07] bg-white/[0.02] px-2.5 py-1.5 text-[9px] font-semibold text-[#71848d]">
                        Patch {dataDragonVersion}
                      </span>
                    )}
                  </div>
                </div>

                {loadingStatus === "loading" && (
                  <ChampionLoading />
                )}

                {loadingStatus === "error" && (
                  <ChampionError onRetry={() => loadChampions()} />
                )}

                {loadingStatus === "success" && (
                  <>
                    <div className="mt-4 grid max-h-[620px] grid-cols-[repeat(auto-fill,minmax(105px,1fr))] gap-2 overflow-y-auto border border-white/[0.07] bg-[#030a0f]/55 p-3 sm:p-4">
                      {filteredChampions.map((champion) => {
                        const selected =
                          selectedChampion?.id === champion.id;

                        const suggested =
                          suggestedChampionIds.has(champion.id);

                        const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${dataDragonVersion}/img/champion/${champion.image.full}`;

                        return (
                          <button
                            key={champion.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              handleChampionSelect(champion)
                            }
                            className={[
                              "group relative overflow-hidden border p-2 text-left transition duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ac8b9]",
                              selected
                                ? "border-[#c89b3c]/75 bg-[#c89b3c]/9"
                                : "border-white/[0.065] bg-white/[0.018] hover:border-white/[0.2] hover:bg-white/[0.05]",
                            ].join(" ")}
                          >
                            <div className="relative aspect-square overflow-hidden bg-[#07131b]">
                              <Image
                                src={imageUrl}
                                alt={champion.name}
                                fill
                                sizes="120px"
                                className={[
                                  "object-cover transition duration-300",
                                  selected
                                    ? "scale-105"
                                    : "group-hover:scale-105",
                                ].join(" ")}
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-[#02070b]/70 via-transparent to-transparent" />

                              {selected && (
                                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[#0ac8b9] text-[9px] text-[#02110f] shadow-lg">
                                  <FontAwesomeIcon icon={faCheck} />
                                </span>
                              )}

                              {suggested && !selected && (
                                <span className="absolute left-2 top-2 border border-[#c89b3c]/25 bg-[#071018]/85 px-1.5 py-1 text-[7px] font-bold uppercase tracking-[0.12em] text-[#d4ad52] backdrop-blur">
                                  Suggested
                                </span>
                              )}
                            </div>

                            <div className="px-1 pb-1 pt-2">
                              <p className="truncate text-xs font-semibold text-[#d9e1e5]">
                                {champion.name}
                              </p>

                              <p className="mt-1 truncate text-[9px] uppercase tracking-[0.1em] text-[#61747d]">
                                {champion.tags.join(" · ")}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {filteredChampions.length === 0 && (
                      <div className="border-x border-b border-white/[0.07] py-16 text-center">
                        <p className="text-sm font-semibold text-[#a7b5bb]">
                          No champion found
                        </p>

                        <p className="mt-2 text-xs text-[#62747d]">
                          Try another champion name or class.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>

          <SelectionFooter
            mode={modeInformation[mode].name}
            role={selectedRole?.name ?? null}
            champion={selectedChampion}
            dataDragonVersion={dataDragonVersion}
            onContinue={handleContinue}
          />
        </div>
      </div>
    </div>
  );
}

function SetupProgress() {
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
          state="active"
        />

        <ProgressItem
          number="03"
          label="Opponent scouting"
          state="locked"
        />
      </div>
    </div>
  );
}

type ProgressItemProps = {
  number: string;
  label: string;
  state: "complete" | "active" | "locked";
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
            : state === "active"
              ? "border-[#c89b3c]/35 bg-[#c89b3c]/8 text-[#dbb65c]"
              : "border-white/[0.07] bg-white/[0.02] text-[#52636b]",
        ].join(" ")}
      >
        {state === "complete" ? (
          <FontAwesomeIcon icon={faCheck} />
        ) : state === "locked" ? (
          <FontAwesomeIcon icon={faLock} />
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
              : state === "complete"
                ? "text-[#94a5ad]"
                : "text-[#566870]",
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

type SideStepProps = {
  number: string;
  title: string;
  description: string;
  status: "complete" | "active" | "locked";
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
            : status === "active"
              ? "border-[#c89b3c]/30 bg-[#c89b3c]/8 text-[#d9b85f]"
              : "border-white/[0.07] text-[#50616a]",
        ].join(" ")}
      >
        {status === "complete" ? (
          <FontAwesomeIcon icon={faCheck} />
        ) : status === "locked" ? (
          <FontAwesomeIcon icon={faLock} />
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

      {status !== "locked" && (
        <FontAwesomeIcon
          icon={faChevronRight}
          className="text-[9px] text-[#53666f]"
        />
      )}
    </div>
  );
}

type SectionHeaderProps = {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
};

function SectionHeader({
  number,
  eyebrow,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center border border-[#c89b3c]/25 bg-[#c89b3c]/7 text-[9px] font-bold text-[#d6b054]">
        {number}
      </span>

      <div>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#0ac8b9]">
          {eyebrow}
        </span>

        <h1 className="font-display mt-2 text-2xl font-semibold text-white sm:text-3xl">
          {title}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7d9099]">
          {description}
        </p>
      </div>
    </div>
  );
}

function ChampionLoading() {
  return (
    <div className="mt-4 flex min-h-[320px] flex-col items-center justify-center border border-white/[0.07] bg-white/[0.015]">
      <FontAwesomeIcon
        icon={faSpinner}
        spin
        className="text-xl text-[#0ac8b9]"
      />

      <p className="mt-4 text-sm font-semibold text-[#a8b6bc]">
        Loading champions
      </p>

      <p className="mt-1 text-xs text-[#62747d]">
        Fetching the latest Data Dragon data...
      </p>
    </div>
  );
}

type ChampionErrorProps = {
  onRetry: () => void;
};

function ChampionError({ onRetry }: ChampionErrorProps) {
  return (
    <div className="mt-4 flex min-h-[320px] flex-col items-center justify-center border border-[#ef5a67]/20 bg-[#ef5a67]/4 px-6 text-center">
      <FontAwesomeIcon
        icon={faCircleExclamation}
        className="text-xl text-[#ef7b85]"
      />

      <p className="mt-4 text-sm font-semibold text-[#d9e1e5]">
        Could not load champions
      </p>

      <p className="mt-2 max-w-sm text-xs leading-5 text-[#73858e]">
        Check your connection and try loading the champion data again.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 border border-white/[0.1] bg-white/[0.035] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.07]"
      >
        <FontAwesomeIcon icon={faRotateRight} />
        Try again
      </button>
    </div>
  );
}

type SelectionFooterProps = {
  mode: string;
  role: string | null;
  champion: Champion | null;
  dataDragonVersion: string;
  onContinue: () => void;
};

function SelectionFooter({
  mode,
  role,
  champion,
  dataDragonVersion,
  onContinue,
}: SelectionFooterProps) {
  const ready = Boolean(role && champion);

  const imageUrl =
    champion && dataDragonVersion
      ? `https://ddragon.leagueoflegends.com/cdn/${dataDragonVersion}/img/champion/${champion.image.full}`
      : null;

  return (
    <div className="glass-panel sticky bottom-4 z-30 mt-10 border-[#0ac8b9]/15 p-4 shadow-[0_18px_65px_rgba(0,0,0,0.55)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {imageUrl ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-[#c89b3c]/35">
              <Image
                src={imageUrl}
                alt={champion?.name ?? "Selected champion"}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center border border-white/[0.08] bg-white/[0.025] text-[#5e7079]">
              <FontAwesomeIcon icon={faUserGroup} />
            </div>
          )}

          <div className="min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#61747d]">
              Your scout setup
            </span>

            <p className="mt-1 truncate text-sm font-semibold text-white">
              {ready
                ? `${champion?.name} · ${role} · ${mode}`
                : "Choose your role and champion"}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!ready}
          onClick={onContinue}
          className={[
            "group inline-flex min-h-11 items-center justify-center gap-3 border px-5",
            "text-xs font-bold uppercase tracking-[0.12em] transition duration-300",
            ready
              ? "border-[#0ac8b9]/45 bg-[#0ac8b9] text-[#02110f] hover:bg-[#32d8cb]"
              : "cursor-not-allowed border-white/[0.07] bg-white/[0.025] text-[#52636b]",
          ].join(" ")}
        >
          Continue to opponents

          <FontAwesomeIcon
            icon={faArrowRight}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>
    </div>
  );
}