'use client';

import { useEffect, useState } from 'react';

interface DailyWeather {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  weatherCode: number;
}

interface WeatherResponse {
  daily: DailyWeather[];
}

interface Props {
  coordinates: [number, number]; // [lat, lng]
  city: string;
}

function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code >= 1 && code <= 3) return '⛅';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '🌡️';
}

function getWeatherDesc(code: number): string {
  if (code === 0) return '晴天';
  if (code >= 1 && code <= 3) return '多云';
  if (code === 45 || code === 48) return '有雾';
  if (code >= 51 && code <= 67) return '降雨';
  if (code >= 71 && code <= 77) return '降雪';
  if (code >= 80 && code <= 82) return '阵雨';
  if (code >= 95 && code <= 99) return '雷暴';
  return '未知';
}

function getWeekdayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Skeleton loader for a single day card
function DayCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5 py-3 animate-pulse">
      <div className="h-3.5 w-8 rounded bg-black/10" />
      <div className="h-3 w-6 rounded bg-black/10 mt-0.5" />
      <div className="h-7 w-7 rounded-full bg-black/10 my-0.5" />
      <div className="h-4 w-10 rounded bg-black/10" />
      <div className="h-3.5 w-8 rounded bg-black/10" />
    </div>
  );
}

export function WeatherWidget({ coordinates, city }: Props) {
  const [weather, setWeather] = useState<DailyWeather[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const [lat, lng] = coordinates;
    setLoading(true);
    setError(false);

    fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<WeatherResponse>;
      })
      .then((data) => {
        setWeather(data.daily);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [coordinates]);

  return (
    <div>
      <h3 className="text-sm font-semibold font-noto-serif text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
        <span>🌤</span>
        <span>当地天气</span>
        {city && <span className="font-normal text-[var(--text-secondary)]">· {city}</span>}
      </h3>

      {loading && (
        <div className="grid grid-cols-7 gap-0.5 pb-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <DayCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-xs text-[var(--text-secondary)] py-2">暂无天气数据</p>
      )}

      {weather && !loading && (
        <div className="grid grid-cols-7 gap-0.5 pb-1">
          {weather.map((day, i) => (
            <div
              key={day.date}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-colors ${
                i === 0 ? 'bg-black/5' : 'hover:bg-black/[0.03]'
              }`}
            >
              {/* Weekday */}
              <span className="text-xs font-medium font-noto-serif text-[var(--text-secondary)]">
                {i === 0 ? '今天' : getWeekdayLabel(day.date)}
              </span>
              {/* Date */}
              <span className="text-[10px] text-[var(--text-secondary)] opacity-60">
                {formatDate(day.date)}
              </span>
              {/* Weather emoji */}
              <span
                className="text-2xl leading-none my-0.5"
                title={getWeatherDesc(day.weatherCode)}
              >
                {getWeatherEmoji(day.weatherCode)}
              </span>
              {/* Max temp */}
              <span className="text-sm font-bold font-noto-serif text-[var(--text-primary)] leading-none">
                {day.maxTemp}°
              </span>
              {/* Min temp */}
              <span className="text-xs text-[var(--text-secondary)] leading-none">
                {day.minTemp}°
              </span>
              {/* Precipitation */}
              {day.precipitation > 0 && (
                <span className="text-[10px] text-blue-500 mt-0.5">
                  {day.precipitation}mm
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
