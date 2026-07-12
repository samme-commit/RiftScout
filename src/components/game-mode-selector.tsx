"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

import { GameModeCard } from "@/components/game-mode-card";
import { gameModes, type GameMode } from "@/data/game-modes";

export function GameModeSelector() {
  const router = useRouter();

  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  function handleSelect(mode: GameMode) {
    setSelectedMode(mode);
  }

  function handleContinue() {
    if (!selectedMode || isNavigating) {
      return;
    }

    setIsNavigating(true);
    router.push(`/setup?mode=${selectedMode.id}`);
  }

  return (
    <section
      id="game-modes"
      className="mx-auto max-w-[1240px] scroll-mt-28 px-5 py-24 sm:px-7 lg:px-10 lg:py-32"
    >
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 border border-[#0ac8b9]/20 bg-[#0ac8b9]/7 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#65dcd2]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0ac8b9] shadow-[0_0_10px_rgba(10,200,185,0.75)]" />
          Start your scout
        </div>

        <h2 className="font-display text-balance text-3xl font-semibold tracking-[0.025em] text-white sm:text-4xl">
          Which game mode are you playing?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#84969f] sm:text-base">
          Your selected mode determines which recommendations and scouting
          tools RiftScout prepares for you.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {gameModes.map((mode) => (
          <GameModeCard
            key={mode.id}
            mode={mode}
            selected={selectedMode?.id === mode.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-3">
        <button
          type="button"
          disabled={!selectedMode || isNavigating}
          onClick={handleContinue}
          className={[
            "group inline-flex min-h-12 min-w-[210px] items-center justify-center gap-3 border px-6",
            "text-sm font-bold uppercase tracking-[0.12em] transition duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ac8b9]",
            selectedMode
              ? "border-[#0ac8b9]/50 bg-[#0ac8b9] text-[#02110f] shadow-[0_12px_34px_rgba(10,200,185,0.16)] hover:bg-[#30d7ca]"
              : "cursor-not-allowed border-white/[0.07] bg-white/[0.025] text-[#53636b]",
          ].join(" ")}
        >
          {isNavigating ? "Opening setup..." : "Continue setup"}

          <FontAwesomeIcon
            icon={faArrowRight}
            className="text-xs transition-transform duration-300 group-hover:translate-x-1"
          />
        </button>

        <p className="text-xs text-[#62747d]">
          {selectedMode
            ? `${selectedMode.title} selected`
            : "Select a game mode to continue"}
        </p>
      </div>
    </section>
  );
}