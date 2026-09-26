/**
 * STEP 26 — Weather presentation helpers (pure, deterministic, tested).
 * WMO weather-code mapping follows the documented Open-Meteo specification.
 * No severity labels; conditions render as documented categories only.
 */
import type { DailyProperties, HourlyProperties, WeatherProperties } from '../../data/engine/adapters';

const WMO: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

export function weatherCodeText(code: number | null): string {
  if (code == null) return 'NOT AVAILABLE';
  return WMO[code] ?? `Code ${code}`;
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function windCompass(deg: number | null): string {
  if (deg == null || !Number.isFinite(deg)) return 'NOT AVAILABLE';
  const n = ((deg % 360) + 360) % 360;
  return `${COMPASS[Math.round(n / 22.5) % 16]} (${Math.round(n)}°)`;
}

export function fmt(value: number | null, unit: string, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return 'NOT AVAILABLE';
  return `${value.toFixed(digits)} ${unit}`;
}

export function fmtHour(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toISOString().slice(11, 16) + ' UTC';
}

export function fmtDay(date: string): string {
  const t = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(t)) return date;
  return new Date(t).toUTCString().slice(0, 11);
}

export function isCurrentRecord(r: { properties: WeatherProperties | HourlyProperties | DailyProperties }): boolean {
  return (r.properties as WeatherProperties).kind === 'observation';
}

export function isHourlyRecord(r: { properties: WeatherProperties | HourlyProperties | DailyProperties }): boolean {
  return (r.properties as HourlyProperties).kind === 'forecast' && 'hourIso' in r.properties;
}

export function isDailyRecord(r: { properties: WeatherProperties | HourlyProperties | DailyProperties }): boolean {
  return (r.properties as HourlyProperties).kind === 'forecast' && 'date' in (r.properties as DailyProperties);
}
