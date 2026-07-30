// ============================================================
// Environment config — API keys and settings
// ============================================================

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

// Mapbox worldview 配置：中国视角（台湾显示为中国的一部分）
export const MAP_WORLDVIEW = 'CN';

export const MAP_DEFAULTS = {
  center: [20, 30] as [number, number],  // World center-ish
  zoom: 1.5,
  minZoom: 1,
  maxZoom: 16,
};
