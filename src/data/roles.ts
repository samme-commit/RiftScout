export type RoleId = "top" | "jungle" | "mid" | "adc" | "support";

export type Role = {
  id: RoleId;
  name: string;
  shortName: string;
  description: string;
  iconPath: string;
  suggestedChampions: string[];
};

export const roles: Role[] = [
  {
    id: "top",
    name: "Top",
    shortName: "TOP",
    description: "Solo lane fighters, tanks and split pushers.",
    iconPath: "/icons/roles/top.png",
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
    iconPath: "/icons/roles/jungle.png",
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
    iconPath: "/icons/roles/mid.png",
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
    iconPath: "/icons/roles/adc.png",
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
    iconPath: "/icons/roles/support.png",
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