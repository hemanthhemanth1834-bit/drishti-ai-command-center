/**
 * NE-SAFE demo + live providers with automatic DEMO fallback.
 * Live weather uses free Open-Meteo (no key). Everything else demo-first.
 */
import { envFlag, isForceDemo } from './types';
import type {
  MapProvider, NotificationProvider, ProviderMode, ProviderStatus,
  SatelliteObs, SatelliteProvider, SensorProvider, SensorReading,
  SensorState, TerrainCell, TerrainProvider, WeatherNow, WeatherProvider,
  MLRiskProvider, RiskInput, RiskOutput,
} from './types';
import { assessRisk } from '../engine/riskEngine';
import { NE_SENSORS } from '../data/northeast';

function stamp(): string { return new Date().toLocaleTimeString(); }

// ---------- WEATHER ----------
class DemoWeather implements WeatherProvider {
  readonly name = 'DemoWeather';
  mode(): ProviderMode { return 'DEMO'; }
  status(): ProviderStatus { return { mode: 'DEMO', label: 'DEMO MODE', source: 'Simulated weather', lastUpdated: stamp() }; }
  async now(_lat?: number, _lon?: number): Promise<WeatherNow> {
    return { tempC: 24, condition: 'Heavy rain (simulated)', humidityPct: 88, windKmh: 18, rainfallMmHr: 46, source: 'DEMO' };
  }
}

class OpenMeteoWeather implements WeatherProvider {
  readonly name = 'OpenMeteo(free)';
  mode(): ProviderMode { return isForceDemo() ? 'DEMO' : 'LIVE'; }
  status(): ProviderStatus {
    return isForceDemo()
      ? { mode: 'DEMO', label: 'DEMO MODE', source: 'Simulated (forced demo)', lastUpdated: stamp() }
      : { mode: 'LIVE', label: 'LIVE DATA', source: 'Open-Meteo (free, no key)', lastUpdated: stamp() };
  }
  async now(lat: number, lon: number): Promise<WeatherNow> {
    if (isForceDemo()) return new DemoWeather().now(lat, lon);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`,
        { signal: ctrl.signal },
      );
      clearTimeout(t);
      if (!r.ok) throw new Error('weather http ' + r.status);
      const j = await r.json();
      const c = j.current ?? {};
      return {
        tempC: Math.round((c.temperature_2m ?? 24) * 10) / 10,
        condition: `W-code ${c.weather_code ?? 0} (Open-Meteo)`,
        humidityPct: c.relative_humidity_2m ?? 70,
        windKmh: c.wind_speed_10m ?? 10,
        rainfallMmHr: c.precipitation ?? 0,
        source: 'LIVE:Open-Meteo',
      };
    } catch {
      return new DemoWeather().now(lat, lon);
    }
  }
}

// ---------- SATELLITE (simulated observation, labeled) ----------
class DemoSatellite implements SatelliteProvider {
  readonly name = 'DemoSatellite';
  mode(): ProviderMode { return 'DEMO'; }
  status(): ProviderStatus { return { mode: 'DEMO', label: 'DEMO MODE', source: 'SIMULATED SATELLITE OBSERVATION', lastUpdated: stamp() }; }
  async latest(): Promise<SatelliteObs> {
    return { passId: 'DEMO-PASS-042', capturedAt: new Date().toLocaleString(), deformationMm: 8.4, changePct: 6.2, simulated: true };
  }
}

// ---------- TERRAIN (procedural demo + honest label) ----------
class DemoTerrain implements TerrainProvider {
  readonly name = 'DemoTerrain(procedural)';
  mode(): ProviderMode { return 'DEMO'; }
  status(): ProviderStatus { return { mode: 'DEMO', label: 'DEMO MODE', source: 'Procedural elevation (demo)', lastUpdated: stamp() }; }
  async elevation(lat: number, lon: number): Promise<TerrainCell> {
    const e = 900 + 700 * Math.abs(Math.sin(lat * 3.1) * Math.cos(lon * 2.7));
    return { lat, lon, elevationM: Math.round(e), slopeDeg: Math.round((28 + 10 * Math.abs(Math.sin(lat + lon))) * 10) / 10 };
  }
}

// ---------- MAP (free basemap, no key) ----------
class FreeMap implements MapProvider {
  readonly name = 'OpenFreeMap/OSM(free)';
  mode(): ProviderMode { return 'DEMO'; }
  styleUrl(): string {
    return envFlag('NEXT_PUBLIC_MAP_STYLE') || 'https://tiles.openfreemap.org/styles/bright';
  }
  attribution(): string { return '© OpenMapTiles © OpenStreetMap contributors'; }
}

// ---------- SENSORS (demo readings derived from sim store via hookup below) ----------
let sensorHook: (() => SensorReading[]) | null = null;
export function hookSensorFeed(fn: () => SensorReading[]) { sensorHook = fn; }

function stateFor(risk: number, online: boolean): SensorState {
  if (!online) return 'OFFLINE';
  if (risk >= 80) return 'CRITICAL';
  if (risk >= 60) return 'HIGH';
  if (risk >= 40) return 'WARNING';
  return 'NORMAL';
}

class DemoSensors implements SensorProvider {
  readonly name = 'DemoSensors';
  mode(): ProviderMode { return 'DEMO'; }
  status(): ProviderStatus { return { mode: 'DEMO', label: 'DEMO MODE', source: 'Simulated IoT sensors', lastUpdated: stamp() }; }
  async list(): Promise<SensorReading[]> {
    if (sensorHook) return sensorHook();
    return NE_SENSORS.slice(0, 4).map((s, i) => ({
      id: s.id, soilMoisturePct: 60 + i * 5, tiltDeg: 2.1 + i * 0.7,
      groundMoveMm: 6 + i * 3, batteryPct: 82 - i * 4,
      state: stateFor(55 + i * 8, true), updatedAgoSec: 8 + i * 3,
    }));
  }
  async get(id: string): Promise<SensorReading | null> {
    return (await this.list()).find((s) => s.id === id) ?? null;
  }
}

// ---------- NOTIFICATIONS (browser-gated, no paid service) ----------
class BrowserNotify implements NotificationProvider {
  readonly name = 'BrowserNotify(free)';
  mode(): ProviderMode { return 'DEMO'; }
  channels() {
    return [
      { id: 'inapp', label: 'In-app alert', enabled: true },
      { id: 'browser', label: 'Browser notification (opt-in)', enabled: typeof Notification !== 'undefined' },
      { id: 'sound', label: 'Sound (user enables)', enabled: false },
    ];
  }
  async send(title: string, body: string) {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, { body });
        return { queued: false, channel: 'browser' };
      }
    } catch { /* noop */ }
    return { queued: true, channel: 'inapp' };
  }
}

// ---------- ML RISK (DEMO transparent model; label REAL vs DEMO) ----------
class DemoRisk implements MLRiskProvider {
  readonly name = 'DemoRiskEngine';
  mode(): ProviderMode { return 'DEMO'; }
  async assess(input: RiskInput, history: number[] = []): Promise<RiskOutput> {
    return assessRisk(input, history);
  }
}

export const weatherProvider: WeatherProvider = new OpenMeteoWeather();
export const satelliteProvider: SatelliteProvider = new DemoSatellite();
export const terrainProvider: TerrainProvider = new DemoTerrain();
export const mapProvider: MapProvider = new FreeMap();
export const sensorProvider: SensorProvider = new DemoSensors();
export const notificationProvider: NotificationProvider = new BrowserNotify();
export const mlRiskProvider: MLRiskProvider = new DemoRisk();

/** Every API at a glance for the final report / sources panel. */
export const PROVIDER_CATALOG = [
  { name: 'Weather (Open-Meteo)', purpose: 'Rain/temp/humidity', free: 'Free, no key', key: 'No', fallback: 'Yes — demo weather' },
  { name: 'Map basemap (OpenFreeMap/OSM)', purpose: 'Tiles + terrain', free: 'Free, openly licensed', key: 'No', fallback: 'Yes — OSM raster' },
  { name: 'Satellite', purpose: 'Deformation/change', free: 'Free tiles only', key: 'No', fallback: 'Yes — SIMULATED OBSERVATION' },
  { name: 'Terrain', purpose: 'Elevation/slope', free: 'Free procedural', key: 'No', fallback: 'Yes — demo DEM' },
  { name: 'Sensors (IoT)', purpose: 'Soil/tilt/movement', free: 'Free sim', key: 'No', fallback: 'Yes — simulated feed' },
  { name: 'Notifications', purpose: 'In-app/browser alerts', free: 'Free browser APIs', key: 'No', fallback: 'Yes — in-app queue' },
  { name: 'AI risk (demo model)', purpose: 'Risk score + explain', free: 'Free (local math)', key: 'No', fallback: 'N/A — DEMO/SIMULATION' },
  { name: 'Vision (demo CV)', purpose: 'Crack/debris detect', free: 'Free heuristic', key: 'No', fallback: 'N/A — DEMO CV' },
];
