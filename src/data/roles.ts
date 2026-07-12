import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBullseye,
  faHandHoldingHeart,
  faLeaf,
  faShieldHalved,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

export type RoleId = "top" | "jungle" | "mid" | "adc" | "support";

export type Role = {
  id: RoleId;
  name: string;
  shortName: string;
  description: string;
  icon: IconDefinition;
  suggestedChampions: string[];
};

export const roles: Role[] = [
  {
    id: "top",
    name: "Top",
    shortName: "TOP",
    description: "Solo lane fighters, tanks and split pushers.",
    icon: faShieldHalved,
    suggestedChampions: [
      "Aatrox",
      "Camille",
      "Darius",
      "Fiora",
      "Garen",
      "Jax",
      "Ornn",
      "Yone",
    ],
  },
  {
    id: "jungle",
    name: "Jungle",
    shortName: "JGL",
    description: "Control objectives, pathing and map pressure.",
    icon: faLeaf,
    suggestedChampions: [
      "Amumu",
      "Diana",
      "JarvanIV",
      "Kayn",
      "LeeSin",
      "Lillia",
      "Nocturne",
      "Viego",
    ],
  },
  {
    id: "mid",
    name: "Mid",
    shortName: "MID",
    description: "Mages, assassins and central map control.",
    icon: faWandMagicSparkles,
    suggestedChampions: [
      "Ahri",
      "Katarina",
      "Lux",
      "Orianna",
      "Sylas",
      "Syndra",
      "Veigar",
      "Yone",
    ],
  },
  {
    id: "adc",
    name: "ADC",
    shortName: "ADC",
    description: "Ranged carries focused on consistent damage.",
    icon: faBullseye,
    suggestedChampions: [
      "Ashe",
      "Caitlyn",
      "Ezreal",
      "Jhin",
      "Jinx",
      "KaiSa",
      "MissFortune",
      "Smolder",
    ],
  },
  {
    id: "support",
    name: "Support",
    shortName: "SUP",
    description: "Protect allies, engage fights and control vision.",
    icon: faHandHoldingHeart,
    suggestedChampions: [
      "Leona",
      "Lulu",
      "Milio",
      "Nami",
      "Nautilus",
      "Pyke",
      "Rakan",
      "Thresh",
    ],
  },
];

export function getRoleById(roleId: RoleId | null) {
  return roles.find((role) => role.id === roleId) ?? null;
}