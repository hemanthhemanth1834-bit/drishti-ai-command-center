'use client';
/**
 * NE-SAFE AI — full-screen 3D terrain command center (additive route, preserves all existing pages).
 * Observe → Analyze → Predict → Visualize → Warn → Respond → Learn
 */
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { advanceNESim, setNESafe, useNESafe } from '@/nesafe/store/nesafeStore';
import { NE_SLOPES } from '@/nesafe/data/northeast';
import { NE_LANGS, useNEText } from '@/nesafe/i18n/strings';
import ModeBadge from '@/components/nesafe/ModeBadge';
import RiskScoreCard from '@/components/nesafe/RiskScoreCard';
import SensorPanel from '@/components/nesafe/SensorPanel';
import SatellitePanel from '@/components/nesafe/SatellitePanel';
import VisionPanel from '@/components/nesafe/VisionPanel';
import CitizenReportPanel from '@/components/nesafe/CitizenReportPanel';
import RoadPanel from '@/components/nesafe/RoadPanel';
import EmergencyPanel from '@/components/nesafe/EmergencyPanel';
import AlertCenter from '@/components/nesafe/AlertCenter';
import DemoControlPanel from '@/components/nesafe/DemoControlPanel';
import LandslideSimViz from '@/components/nesafe/LandslideSimViz';
import GlobeView from '@/components/nesafe/GlobeView';
import type { NESafeTab } from '@/nesafe/store/nesafeStore';

const Terrain3D = dynamic(() => import('@/components/nesafe/Terrain3D'), { ssr: false, loading: () => <div className="nesafe-fallback">Loading 3D terrain…</div> });
const MapLibreCommand = dynamic(() => import('@/components/nesafe/MapLibreCommand'), { ssr: false, loading: () => <div className="nesafe-fallback">Loading 3D GIS…</div> });

const TABS: { id: NESafeTab; label: string }[] = [
  { id: 'command', label: '🛰 Command' },
  { id: 'terrain', label: '🏔 3D Terrain' },
  { id: 'satellite', label: '🛰 Satellite' },
  { id: 'vision', label: '📷 Vision' },
  { id: 'citizen', label: '📱 Citizen' },
  { id: 'roads', label: '🛣 Roads' },
  { id: 'response', label: '🚑 Response' },
  { id: 'alerts', label: '🚨 Alerts' },
  { id: 'simulation', label: '🎬 Simulation' },
];

export default function NESafePage() {
  const { selectedSlopeId, tab, tick } = useNESafe();
  const t = useNEText();
  const [sensorId, setSensorId] = useState<string | null>('MEG-042');
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const id = setInterval(advanceNESim, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="nesafe-shell">
      {/* Header */}
      <header className="nesafe-head">
        <div>
          <div className="nesafe-micro">MIDNIGHT COMMAND CENTER · NORTHEAST LANDSLIDE INTELLIGENCE · tick {tick}</div>
          <h1>🌋 {t('command_center')} <span className="nesafe-ver">NE-SAFE AI</span></h1>
          <p>Observe → Analyze → Predict → Visualize → Warn → Respond → Learn · honest demo data</p>
        </div>
        <div className="nesafe-head-right">
          <ModeBadge />
          <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="NE-SAFE language">
            {NE_LANGS.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
          </select>
          <Link href="/command" className="nesafe-link">← DRISHTI-X command (preserved)</Link>
        </div>
      </header>

      {/* Slope picker */}
      <div className="nesafe-slopes" role="tablist" aria-label="NE slope picker">
        {NE_SLOPES.map((s) => (
          <button
            key={s.id} role="tab" aria-selected={s.id === selectedSlopeId}
            onClick={() => setNESafe({ selectedSlopeId: s.id })}
            className={s.id === selectedSlopeId ? 'on' : ''}
          >
            {s.id} · {s.state}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <nav className="nesafe-tabs" aria-label="NE-SAFE modules">
        {TABS.map((x) => (
          <button key={x.id} onClick={() => setNESafe({ tab: x.id })} className={tab === x.id ? 'on' : ''}>{x.label}</button>
        ))}
      </nav>

      {(tab === 'command' || tab === 'terrain') && (
        <section className="nesafe-grid-main">
          <div className="nesafe-col">
            <div className="nesafe-glass">
              <div className="nesafe-row" style={{ justifyContent: 'space-between' }}>
                <b>🗺 ADVANCED 3D GIS · MapLibre (free) + terrain</b><ModeBadge />
              </div>
              <MapLibreCommand onPickSensor={setSensorId} />
            </div>
            <div className="nesafe-glass">
              <div className="nesafe-row" style={{ justifyContent: 'space-between' }}>
                <b>🏔 CINEMATIC 3D TERRAIN · rotate to inspect</b>
                <span className="nesafe-chip">R3F + Three.js · fog + light + contours</span>
              </div>
              <Terrain3D onPickSensor={setSensorId} />
            </div>
            <LandslideSimViz />
          </div>
          <div className="nesafe-col">
            <RiskScoreCard />
            <SensorPanel focusId={sensorId} onFocus={setSensorId} />
            <DemoControlPanel />
          </div>
        </section>
      )}

      {tab === 'command' && (
        <section className="nesafe-grid2col">
          <AlertCenter />
          <EmergencyPanel />
          <GlobeView />
          <RoadPanel />
        </section>
      )}
      {tab === 'satellite' && (<section className="nesafe-grid2col"><SatellitePanel /><GlobeView /></section>)}
      {tab === 'vision' && (<section className="nesafe-grid2col"><VisionPanel /><CitizenReportPanel /></section>)}
      {tab === 'citizen' && (<section className="nesafe-grid2col"><CitizenReportPanel /><AlertCenter /></section>)}
      {tab === 'roads' && (<section className="nesafe-grid2col"><RoadPanel /><EmergencyPanel /></section>)}
      {tab === 'response' && (<section className="nesafe-grid2col"><EmergencyPanel /><AlertCenter /></section>)}
      {tab === 'alerts' && (<section className="nesafe-grid2col"><AlertCenter /><RiskScoreCard /></section>)}
      {tab === 'simulation' && (<section className="nesafe-grid2col"><DemoControlPanel /><LandslideSimViz /><RiskScoreCard /><span /></section>)}

      <footer className="nesafe-foot">
        <span>NE-SAFE AI prototype · free-first · no key required · simulated data labeled · existing DRISHTI-X pages untouched</span>
        <span>AI: DEMO/SIMULATION everywhere (no real model) · Maps: OpenFreeMap/OSM · Weather live optional via Open-Meteo</span>
      </footer>
    </main>
  );
}
