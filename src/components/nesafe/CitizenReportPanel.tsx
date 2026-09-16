'use client';
/** Mobile-first citizen reporting with offline queue + simulated AI analysis. */
import { useEffect, useState } from 'react';
import { loadQueue, queueReport, syncQueue, pendingCount, lastSync } from '@/nesafe/utils/offlineQueue';
import { pushIncident } from '@/nesafe/store/nesafeStore';

const HAZARDS = ['Crack', 'Rockfall', 'Debris', 'Water accumulation', 'Road blockage', 'Slope failure'];

export default function CitizenReportPanel() {
  const [hazard, setHazard] = useState(HAZARDS[0]);
  const [note, setNote] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const [syncMsg, setSyncMsg] = useState('');
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setPending(pendingCount());
    const on = () => setOnline(navigator.onLine);
    setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    window.addEventListener('online', on); window.addEventListener('offline', on);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', on); };
  }, []);
  const submit = () => {
    const r = queueReport({ hazard, note, gps: 'demo-fix', photo: 'on-device' });
    setDone(r.id);
    pushIncident('Citizen report received (demo)', `${hazard} · ${r.id}`, 'info');
    setPending(pendingCount());
  };
  const sync = () => {
    const { synced } = syncQueue();
    setSyncMsg(`✓ ${synced} report(s) synchronized`);
    setPending(pendingCount());
    setTimeout(() => setSyncMsg(''), 3000);
  };
  if (done) {
    return (
      <div className="nesafe-glass">
        <h3>REPORT RECEIVED ✓</h3>
        <ul className="nesafe-checks"><li>Location verified (demo)</li><li>Image analyzed (demo CV)</li><li>Risk assessment created</li></ul>
        <p>REPORT ID: <b>{done}</b></p>
        <button onClick={() => setDone(null)}>File another report</button>
      </div>
    );
  }
  return (
    <div className="nesafe-glass">
      <b>📱 CITIZEN REPORTING</b>
      <div className="nesafe-steps"><span>📷 PHOTO ↓</span><span>📍 GPS ↓</span><span>HAZARD ↓</span><span>AI ANALYSIS ↓</span><span>SUBMIT</span></div>
      <div className="nesafe-row" style={{ flexWrap: 'wrap' }}>
        {HAZARDS.map((h) => (<button key={h} onClick={() => setHazard(h)} className={h === hazard ? 'nesafe-btn-on' : ''}>{h}</button>))}
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe what you see (optional)" rows={3} className="nesafe-input" />
      <button onClick={submit} className="nesafe-primary">SUBMIT REPORT</button>
      <div className="nesafe-offline">
        <span>{online ? '📶 ONLINE' : '📡 OFFLINE'}</span>
        <span>{pending} report(s) waiting · last sync {lastSync()}</span>
        <button onClick={sync}>SYNC NOW</button>
        {syncMsg && <b>{syncMsg}</b>}
        <small>Queued locally ({loadQueue().length}); auto-syncs when connectivity returns.</small>
      </div>
    </div>
  );
}
