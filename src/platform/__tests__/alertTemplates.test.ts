import { describe, expect, it } from 'vitest';
import { ALERT_LANGS, renderAlert } from '../alertTemplates';

describe('renderAlert', () => {
  it('renders EN + TE with placeholders filled', () => {
    const en = renderAlert('CRITICAL', 'en', 'Vijayawada', '80%');
    expect(en).toContain('Vijayawada');
    expect(en).toContain('80%');
    expect(en).not.toContain('{place}');
    const te = renderAlert('WARNING', 'te', 'Vijayawada', '60%');
    expect(te).toContain('Vijayawada');
    expect(te).not.toContain('{prob}');
  });
  it('falls back to English for unknown langs', () => {
    expect(renderAlert('WATCH', 'xx', 'X', '10%')).toContain('WATCH');
  });
  it('covers every declared language for every level', () => {
    for (const l of (['WATCH', 'ALERT', 'WARNING', 'CRITICAL'] as const)) {
      for (const { code } of ALERT_LANGS) {
        const t = renderAlert(l, code, 'P', '50%');
        expect(t.length).toBeGreaterThan(10);
      }
    }
  });
});
