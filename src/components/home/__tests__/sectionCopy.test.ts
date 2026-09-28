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
    expect(HOME).toContain('landslide-debris-flow');
  });

  it('twin section pairs simulation label with real-terrain context note', () => {
    expect(HOME).toContain('procedural simulation used for scenario exploration');
    expect(HOME).toContain('Simulation is always labeled');
    expect(HOME).toContain("getDisasterImage('twin-himalaya-nepal')");
    expect(HOME).not.toContain('/img/hero-scene.svg');
  });

  it('deformation panel explains measurement-vs-photograph distinction', () => {
    expect(SATPANEL).toContain('SIMULATED SATELLITE OBSERVATION');
    expect(SATPANEL).toContain('represents deformation measurements rather than a conventional photograph');
  });

  it('AI/ML visual is a real terrain photo, not the old pipeline illustration', () => {
    expect(HOME).toContain("getDisasterImage('landslide-debris-flow')");
    expect(HOME).not.toContain('/img/ml-pipeline.svg');
  });
});
