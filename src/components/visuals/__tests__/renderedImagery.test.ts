import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Rendered-scene regression guard: real-world disaster/emergency scenes must
 * use verified photographs (disasterImages registry), never cartoon/vector
 * scene illustrations. Scans TSX render code — registry fallback strings,
 * docs, and tests are excluded; only `src="..."` render references count.
 */
const ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const BANNED_RENDERED = [
  '/img/response.svg',
  '/img/shelter.svg',
  '/img/dis-road.svg',
  '/img/dis-cyclone.svg',
  '/img/dis-flood.svg',
  '/img/dis-fire.svg',
  '/img/dis-landslide.svg',
  '/img/dis-drought.svg',
  '/img/dis-earthquake.svg',
  '/img/dis-storm.svg',
  '/img/wx-storm.svg',
  '/img/terrain.svg',
  '/img/hero-command.svg',
  '/img/sat-before.svg',
  '/img/sat-after.svg',
];

// Files whose raw strings are data (fallbacks/docs), not rendered scenes.
const EXCLUDED = ['imageSources.ts', 'disasterVisuals.ts', 'SOURCES.md'];

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...tsxFiles(p));
    else if (/\.tsx?$/.test(e.name) && !/\.test\./.test(e.name) && !/__tests__/.test(p)) out.push(p);
  }
  return out;
}

describe('no rendered scene illustrations', () => {
  it('no page/component renders banned scene SVGs as src', () => {
    const offenders: string[] = [];
    for (const f of tsxFiles(path.join(ROOT, 'src'))) {
      if (EXCLUDED.some((x) => f.endsWith(x))) continue;
      const text = fs.readFileSync(f, 'utf-8');
      for (const banned of BANNED_RENDERED) {
        if (text.includes(`src="${banned}"`) || text.includes(`src={'${banned}'}`)) {
          offenders.push(`${path.relative(ROOT, f)} -> ${banned}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
