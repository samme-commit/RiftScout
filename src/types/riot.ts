export type ScoutRole =
  | "top"
  | "jungle"
  | "mid"
  | "adc"
  | "support";

export type RiotPlatform =
  | "br1"
  | "eun1"
  | "euw1"
  | "jp1"
  | "kr"
  | "la1"
  | "la2"
  | "na1"
  | "oc1"
  | "tr1"
  | "ru"
  | "ph2"
  | "sg2"
  | "th2"
  | "tw2"
  | "vn2";

export type RiotOpponentInput = {
  role: ScoutRole;
  gameName: string;
  tagLine: string;
};

export type RiotAnalyzeRequest = {
  region: RiotPlatform;
  mode: string;
  selectedRole: ScoutRole;
  championName: string;
  opponents: RiotOpponentInput[];
};

export type RiotChampionPerformance = {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  winRate: number;
  adjustedWinRate: number;
  averageKda: number;
  comfortScore: number;
};

export type RiotOpponentResult = {
  role: ScoutRole;
  riotId: string;
  primaryChampion: string;
  secondaryChampion: string;
  games: number;
  winRate: number;
  threatScore: number;
  confidence: "High" | "Medium" | "Low";
  recentRole: ScoutRole | null;
  championPool: RiotChampionPerformance[];
};

export type RiotBanRecommendation = {
  champion: string;
  championId: number;
  score: number;
  role: ScoutRole;
  targetPlayer: string;
  reasons: string[];
};

export type FailedRiotOpponent = {
  role: ScoutRole;
  riotId: string;
  message: string;
};

export type RiotAnalysisResult = {
  source: "riot";
  analyzedAt: string;
  region: RiotPlatform;
  matchesRequestedPerPlayer: number;
  opponents: RiotOpponentResult[];
  recommendations: RiotBanRecommendation[];
  failedOpponents: FailedRiotOpponent[];
  warnings: string[];
};