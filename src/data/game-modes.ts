import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBolt,
  faEye,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";

export type GameModeId = "swiftplay" | "blind-pick" | "ranked";

export type GameMode = {
  id: GameModeId;
  title: string;
  eyebrow: string;
  description: string;
  icon: IconDefinition;
  features: string[];
  recommended?: boolean;
};

export const gameModes: GameMode[] = [
  {
    id: "swiftplay",
    title: "Swiftplay",
    eyebrow: "Fast preparation",
    description:
      "Get a quick overview of dangerous matchups and useful champion-specific advice.",
    icon: faBolt,
    features: [
      "Quick matchup overview",
      "Champion threat analysis",
      "Fast recommendations",
    ],
  },
  {
    id: "blind-pick",
    title: "Blind Pick",
    eyebrow: "Adapt during loading",
    description:
      "Analyze visible opponents and prepare for their likely champions, roles and playstyles.",
    icon: faEye,
    features: [
      "Opponent scouting",
      "Likely role detection",
      "Champion pool insights",
    ],
  },
  {
    id: "ranked",
    title: "Ranked",
    eyebrow: "Draft intelligence",
    description:
      "Combine matchup data and opponent history to discover the strongest possible ban.",
    icon: faTrophy,
    features: [
      "Target ban recommendations",
      "Ban priority score",
      "Ranked opponent analysis",
    ],
    recommended: true,
  },
];