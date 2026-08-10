// ============================================================
// Tennis Around the World — Type Definitions
// ============================================================

export interface Player {
  id: string;
  espnId: string;
  wtaId?: number | string;
  rank: number;
  previousRank: number | null;
  points: number;
  rankingSource?: 'live-tennis' | 'static';
  rankingUpdatedAt?: string;
  displayName: string;
  firstName: string;
  lastName: string;
  nameCn: string;
  country: string;
  age: number | null;
  dateOfBirth: string;
  height: string;
  weight: string;
  birthPlace: string;
  birthPlaceCn: string;
  headshot: string;
  headshotTorso?: string;
  flag: string;
  tier: 'featured' | 'standard' | 'basic';
}

export interface Tournament {
  id: string;
  name: string;
  level: TournamentLevel;
  city: string;
  country: string;
  countryName: string;
  surface: Surface;
  indoor: boolean;
  dateStart: string;
  dateEnd: string;
  prizeMoney?: string;
  drawSize: number;
  coordinates: Coordinates;
  venue: string;
  timezone: string;
  timezoneCn?: string;
  nameCn?: string;
  cityCn?: string;
  countryCn?: string;
  winner?: {
    name: string;
    nameCn?: string;
    countryCode: string;
    headshot?: string;
  };
  liveTennisId?: number | string;
}

export type TournamentLevel = 'GS' | 'WTA1000' | 'WTA500' | 'WTA250' | 'Finals';

export type Surface = 'Hard' | 'Clay' | 'Grass';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BucketListItem {
  tournamentId: string;
  addedAt: string;
  notes?: string;
  completed: boolean;
  diary?: string;       // 观赛日记文字
  diaryDate?: string;   // 日记写入日期
  rating?: number;      // 1-5 星评分
  photos?: string[];    // 照片 URL（base64 data URL）
}

export interface FollowedPlayer {
  playerId: string;
  followedAt: string;
}

// Weather data from OpenWeatherMap
export interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

// Tournament with computed properties
export interface TournamentWithStatus extends Tournament {
  status: 'upcoming' | 'ongoing' | 'completed';
  daysUntil: number | null;
}

// Player with tournament schedule
export interface PlayerSchedule {
  player: Player;
  tournaments: Tournament[];
}

// ============================================================
// Zine / 手账 Types
// ============================================================

export interface ZineElement {
  id: string;
  type: 'text' | 'image' | 'sticker' | 'badge';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  // text
  text?: string;
  fontSize?: number;
  fontFamily?: 'sans' | 'serif';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  // image
  src?: string;
  borderRadius?: number;
  // sticker
  emoji?: string;
}

export interface ZineWork {
  id: string;
  title: string;
  createdAt: string;
  elements: ZineElement[];
  background: string;
  thumbnail?: string; // base64
}

// Map marker
export interface MapMarker {
  id: string;
  coordinates: Coordinates;
  label: string;
  type: 'tournament' | 'player-origin';
  data: Tournament | Player;
}
