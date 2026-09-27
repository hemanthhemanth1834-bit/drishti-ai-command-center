import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/** Topic explanations must stay paired with their visuals; diagrams that
 * must never become photos stay diagram-labeled. */
const HOME = fs.readFileSync(
  path.resolve(__dirname, '..', '..', 'home', 'HomeSections.tsx'), 'utf-8');
const SATPANEL = fs.readFileSync(
  path.resolve(__dirname, '..', '..', 'nesafe', 'SatellitePanel.tsx'), 'utf-8');

describe('section explanations', () => {
  it('AI/ML section explains the synthetic RandomForest honestly', () => {
    expect(HOME).toContain('Random Forest combines rainfall, soil, slope, terrain');
    expect(HOME).toContain('must not be interpreted as field-validated prediction');
    expect(HOME).toContain('SYNTHETIC-DEMO');
  });

  it('twin section pairs simulation label with real-terrain context note', () => {
    expect(HOME).toContain('procedural simulation used for scenario exploration');
    expect(HOME).toContain('Simulation is always labeled');
  });

  it('deformation panel explains measurement-vs-photograph distinction', () => {
    expect(SATPANEL).toContain('SIMULATED SATELLITE OBSERVATION');
    expect(SATPANEL).toContain('represents deformation measurements rather than a conventional photograph');
  });

  it('technical diagrams stay diagrams (ml-pipeline kept, labeled DEMO)', () => {
    expect(HOME).toContain('/img/ml-pipeline.svg');
    expect(HOME).toContain('SYNTHETIC-DEMO training');
  });
});
