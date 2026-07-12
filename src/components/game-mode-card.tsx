"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import type { GameMode } from "@/data/game-modes";

type GameModeCardProps = {
  mode: GameMode;
  selected: boolean;
  onSelect: (mode: GameMode) => void;
};

const modeStyles: Record<
  GameMode["id"],
  {
    icon: string;
    glow: string;
    selectedBorder: string;
  }
> = {
  swiftplay: {
    icon: "text-[#67d8ff]",
    glow: "group-hover:shadow-[0_0_40px_rgba(103,216,255,0.09)]",
    selectedBorder: "border-[#67d8ff]/55",
  },
  "blind-pick": {
    icon: "text-[#ae91ff]",
    glow: "group-hover:shadow-[0_0_40px_rgba(174,145,255,0.09)]",
    selectedBorder: "border-[#ae91ff]/55",
  },
  ranked: {
    icon: "text-[#e2bd65]",
    glow: "group-hover:shadow-[0_0_40px_rgba(226,189,101,0.11)]",
    selectedBorder: "border-[#c89b3c]/70",
  },
};

export function GameModeCard({
  mode,
  selected,
  onSelect,
}: GameModeCardProps) {
  const styles = modeStyles[mode.id];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(mode)}
      className={[
        "group relative flex h-full w-full flex-col overflow-hidden border p-6 text-left",
        "bg-[linear-gradient(145deg,rgba(255,255,255,0.042),rgba(255,255,255,0.012))]",
        "transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ac8b9]",
        "hover:-translate-y-1 hover:bg-white/[0.045]",
        styles.glow,
        selected
          ? `${styles.selectedBorder} -translate-y-1 bg-white/[0.055]`
          : "border-white/[0.095]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/[0.025] blur-2xl transition group-hover:bg-white/[0.055]" />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div
          className={[
            "grid h-12 w-12 place-items-center border border-white/[0.09]",
            "bg-[#07131b] text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
            styles.icon,
          ].join(" ")}
        >
          <FontAwesomeIcon icon={mode.icon} />
        </div>

        {mode.recommended && !selected && (
          <span className="border border-[#c89b3c]/30 bg-[#c89b3c]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e2bd65]">
            Recommended
          </span>
        )}

        {selected && (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0ac8b9] text-[11px] text-[#02110f] shadow-[0_0_24px_rgba(10,200,185,0.26)]">
            <FontAwesomeIcon icon={faCheck} />
          </span>
        )}
      </div>

      <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#748892]">
        {mode.eyebrow}
      </span>

      <h3 className="font-display mb-3 text-2xl font-semibold tracking-[0.035em] text-white">
        {mode.title}
      </h3>

      <p className="mb-7 min-h-[72px] text-sm leading-6 text-[#8fa1aa]">
        {mode.description}
      </p>

      <ul className="mb-8 space-y-3">
        {mode.features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-3 text-xs font-medium text-[#b1bec4]"
          >
            <span className="h-1 w-1 rotate-45 bg-[#c89b3c]" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-5">
        <span
          className={[
            "text-xs font-bold uppercase tracking-[0.16em] transition-colors",
            selected
              ? "text-[#65e3d7]"
              : "text-[#83949d] group-hover:text-white",
          ].join(" ")}
        >
          {selected ? "Selected" : "Select mode"}
        </span>

        <FontAwesomeIcon
          icon={faChevronRight}
          className={[
            "text-xs transition duration-300",
            selected
              ? "translate-x-0.5 text-[#65e3d7]"
              : "text-[#60727c] group-hover:translate-x-1 group-hover:text-white",
          ].join(" ")}
        />
      </div>
    </button>
  );
}