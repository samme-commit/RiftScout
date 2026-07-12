export type ChampionImage = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Champion = {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  tags: string[];
  partype: string;
  image: ChampionImage;
};

export type ChampionDataResponse = {
  type: string;
  format: string;
  version: string;
  data: Record<string, Champion>;
};