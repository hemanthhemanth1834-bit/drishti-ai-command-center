// DATA SOURCES — what's free now, what plugs in later. No paid dependencies.
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import { Database } from 'lucide-react';

const LIVE_FREE: [string, string][] = [
  ['OpenStreetMap tiles', 'Basemap + radar layers. No key.'],
  ['Leaflet', '2D map rendering, client-side.'],
  ['Nominatim', 'Place search + reverse-geocode. No key, fair-use rate.'],
  ['Overpass API', 'Real amenities/shelters nearby. No key.'],
  ['Browser Geolocation', 'GPS only after your tap. Stays on-device.'],
  ['Web Speech API', 'Voice input + read-aloud. Built into the browser.'],
  ['Web Notifications', 'Critical alerts, opt-in only.'],
  ['Service Worker + localStorage', 'Offline shell, prefs, reports, checklists.'],
  ['Three.js (WebGL)', 'Digital twin + VFX. No key.'],
  ['FastAPI + WebSockets', 'Local sim telemetry mesh (this demo).'],
];

const FUTURE: [string, string][] = [
  ['Official weather feeds', 'IMD Doppler + forecasts via WeatherDataProvider.'],
  ['Official disaster alerts', 'NDMA/CAP feed via AlertDataProvider.'],
  ['Government disaster systems', 'Incident + resource sync via provider swap.'],
  ['River + IoT sensors', 'Gauge telemetry via sensor provider.'],
  ['Hospital HMIS', 'Real ICU/ED capacity via HospitalDataProvider.'],
  ['Shelter registry', 'Live occupancy via ShelterDataProvider.'],
  ['Satellite feeds', 'ISRO Bhuvan layers as tile overlays.'],
  ['Drone telemetry link', 'Real MAVLink bridge via DroneDataProvider.'],
];

export default function SourcesPage() {
  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={false} />
      <div className="p-4 max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">DATA SOURCES</h1>
        </div>
        <section className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white pb-2 border-b border-[#1b314b]">
            FREE TODAY <TrustBadge kind="LIVE" source="no keys, no billing" />
          </div>
          <div className="mt-2 space-y-1 text-[12px]">
            {LIVE_FREE.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1 border-b border-[#132d4a] last:border-0">
                <span className="font-bold text-white">{k}</span>
                <span className="text-slate-400 text-right">{v}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white pb-2 border-b border-[#1b314b]">
            FUTURE OFFICIAL PLUG-INS <TrustBadge kind="DEMO" source="interfaces ready, feeds pending" />
          </div>
          <div className="mt-2 space-y-1 text-[12px]">
            {FUTURE.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1 border-b border-[#132d4a] last:border-0">
                <span className="font-bold text-white">{k}</span>
                <span className="text-slate-400 text-right">{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            UI → service layer → provider interface → demo provider today, official provider
            tomorrow. Pages never change when a feed connects.
          </p>
        </section>
      </div>
    </main>
  );
}
