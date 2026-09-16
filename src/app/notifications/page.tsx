'use client';
import { useState } from 'react';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import { API_BASE, post } from '@/platform/api';
import { ALERT_LANGS, renderAlert, type AlertLevel } from '@/platform/alertTemplates';

export default function NotificationsPage() {
  const ch = usePlatform<{ channels: { channel: string; status: string; needs?: string }[]; web_push: { status: string; needs?: string; detail?: string }; email: { status: string; needs?: string; host?: string } }>('/api/v1/notifications/channels');
  const tp = usePlatform<{ templates: string[]; langs: string[] }>('/api/v1/notifications/templates');
  const [level, setLevel] = useState<AlertLevel>('WARNING');
  const [lang, setLang] = useState('en');
  const [pushMsg, setPushMsg] = useState('');

  const subscribePush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as ServiceWorkerRegistration & { pushManager: PushManager }).pushManager.getSubscription();
      await fetch(`${API_BASE}/api/v1/sync/subscriptions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub?.endpoint ?? 'pending-permission', keys: {}, audience: 'citizen' }),
      });
      setPushMsg(sub ? 'Push subscription stored.' : 'No subscription yet — grant notification permission first, then retry.');
    } catch { setPushMsg('Push unavailable in this browser/context.'); }
  };

  const testSend = async (channel: string) => {
    const r = await post<{ ok: boolean; status: string; preview?: string }>('/api/v1/notifications/send', {
      channel, audience: 'citizen', template: 'landslide_watch', place: 'Demo Valley', prob: '60%',
    }, true);
    setPushMsg(r.data ? `${channel}: ${r.data.status}${r.data.preview ? ` — ${r.data.preview}` : ''}` : `${channel} failed (${r.note ?? r.status})`);
  };

  return (
    <ModuleShell title="Notification Router" sub="Warning → audience → channel. Missing credentials show NOT CONFIGURED — never fake delivery." status="LIVE" source="Router + provider env">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">CHANNELS</div>
        {(ch.data?.channels ?? []).map((c) => (
          <div key={c.channel} className="text-xs py-1 border-b border-[#1b314b]">
            <div className="flex justify-between"><b className="text-white">{c.channel}</b><StatusBadge status={c.status === 'READY' || c.status.startsWith('READY') ? 'LIVE' : 'NOT_CONFIGURED'} small /></div>
            {c.needs && <div className="text-slate-400">{c.needs}</div>}
          </div>
        ))}
        <div className="text-xs mt-1">push: {ch.data?.web_push.status} · email: {ch.data?.email.status}</div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {['web', 'push', 'sms', 'email'].map((c) => <button key={c} onClick={() => testSend(c)} className="text-xs bg-[#051424] border border-[#1b314b] rounded px-2 py-1">test {c}</button>)}
          <button onClick={subscribePush} className="text-xs bg-[#00d2ff] text-black font-bold rounded px-2 py-1">enable web push</button>
        </div>
        {pushMsg && <p className="text-xs mt-1">{pushMsg}</p>}
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">TEMPLATES (REVIEWED, 9 LANGUAGES) — {tp.data?.templates.join(', ')}</div>
        <div className="flex gap-2 text-xs mt-2 flex-wrap">
          <select value={level} onChange={(e) => setLevel(e.target.value as AlertLevel)} className="bg-[#051424] border border-[#1b314b] rounded px-2 py-1">{(['WATCH', 'ALERT', 'WARNING', 'CRITICAL'] as AlertLevel[]).map((l) => <option key={l}>{l}</option>)}</select>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-[#051424] border border-[#1b314b] rounded px-2 py-1">{ALERT_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select>
        </div>
        <p className="text-sm mt-2 text-white">{renderAlert(level, lang, 'Demo Valley', '60%')}</p>
      </div>
    </ModuleShell>
  );
}
