import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(420_000);
test('P4 left/right knob to rear bridge full cover-motion contact windows', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, { timeout: 20000 });
  expect(await page.evaluate(() => window.__selectricDebug.setPower(false))).toBe(true);
  const outcome = await page.evaluate(() => {
    const d = window.__selectricDebug;
    const names = ['left-platen-knob', 'right-platen-knob'];
    const fractions = Array.from({ length: 65 }, (_, i) => i / 64);
    const observations = [], transitions = [];
    function readPair(probe, knob) {
      const p = probe.pairs.find(x => x.knob === knob && x.coverPart === 'rear-service-bridge');
      if (!p) throw new Error('missing knob/bridge pair ' + knob);
      return {
        witnessed: p.surfaceWitnessPairs > 0, trianglePairs: p.surfaceWitnessPairs,
        aabbCandidate: p.parentAabbCandidate, satWithoutWitness: p.satWithoutWitness,
        degeneratePairs: p.degeneratePairs, facetCounts: p.witnessesByCoverFacet,
        example: p.examples[0] || null
      };
    }
    d.setExplosion(0); d.setCheekSmoothingPreview(false);
    d.setCopyControl(0); d.setServiceCover(0);
    const initial = d.state;
    const saved = [initial.carrierX, initial.cycle, initial.line, initial.platenIndex];
    try {
      for (const copy of [0,1,2,3,4]) {
        d.setCopyControl(copy);
        const sweep = [];
        for (const fraction of fractions) {
          d.setServiceCover(fraction);
          const probe = d.hoodPlatenKnobSurfaceContactProbe();
          if (probe.actualProductionCollisionAsserted || probe.geometryChanged ||
              probe.exactOriginal721CoverLevelIdentified || probe.OEMKnobDimensionsMeasured)
            throw new Error('unsupported OEM claim/geometry promotion');
          if (probe.copyControlSetting !== copy || Math.abs(probe.serviceCoverOpen-fraction)>1e-12)
            throw new Error('sampling state drift');
          const pairs = Object.fromEntries(names.map(n => [n, readPair(probe,n)]));
          const row = {copy, fraction, pairs};
          observations.push(row); sweep.push(row);
        }
        for (const name of names) {
          for (let i=0;i<sweep.length-1;i++) {
            const lhs=sweep[i], rhs=sweep[i+1];
            const first=lhs.pairs[name].witnessed, last=rhs.pairs[name].witnessed;
            if (first===last) continue;
            let low=lhs.fraction, high=rhs.fraction;
            for (let k=0;k<9;k++) {
              const mid=(low+high)/2;
              d.setServiceCover(mid);
              const at=readPair(d.hoodPlatenKnobSurfaceContactProbe(),name).witnessed;
              if (at===first) low=mid; else high=mid;
            }
            d.setServiceCover(low);
            const lower=readPair(d.hoodPlatenKnobSurfaceContactProbe(),name);
            d.setServiceCover(high);
            const upper=readPair(d.hoodPlatenKnobSurfaceContactProbe(),name);
            if (lower.witnessed!==first || upper.witnessed!==last)
              throw new Error('contact bracket endpoint inconsistent');
            transitions.push({copy,knob:name,from:first,to:last,
              coarse:[lhs.fraction,rhs.fraction],refined:[low,high],lower,upper});
          }
        }
      }
    } finally {
      d.setServiceCover(0); d.setCopyControl(0);
      d.setCheekSmoothingPreview(false); d.setExplosion(0);
    }
    const after=d.state;
    return {observations, transitions, fractions,
      restored:saved.every((v,i)=>v===[after.carrierX,after.cycle,after.line,after.platenIndex][i]) &&
        after.copyControlSetting===0 && after.serviceCoverOpen===0 &&
        !after.geometry.cheekSmoothingPreviewP5.enabled,
      sourceGeometryVerified:false, factoryCollisionCertified:false, geometryChanged:false};
  });
  expect(outcome.restored).toBe(true);
  expect(outcome.observations).toHaveLength(325);
  expect(outcome.fractions.at(-1)).toBe(1);
  for (const row of outcome.observations) for (const p of Object.values(row.pairs)) {
    expect(p.witnessed).toBe(p.trianglePairs > 0);
    expect(p.satWithoutWitness).toBeGreaterThanOrEqual(0);
    if (p.example) {
      expect(p.example.knobSurfacePointErrorMm).toBeLessThanOrEqual(.0001);
      expect(p.example.coverSurfacePointErrorMm).toBeLessThanOrEqual(.0001);
    }
  }
  for (const copy of [0,1]) for (const knob of ['left-platen-knob','right-platen-knob']) {
    const rows=outcome.observations.filter(x=>x.copy===copy);
    expect(rows[0].pairs[knob].witnessed).toBe(true);
    expect(rows.at(-1).pairs[knob].witnessed).toBe(false);
    expect(outcome.transitions.some(x=>x.copy===copy && x.knob===knob && x.from && !x.to)).toBe(true);
  }
  for (const knob of ['left-platen-knob', 'right-platen-knob']) {
    const copy2 = outcome.observations.filter(x => x.copy === 2);
    expect(copy2[0].pairs[knob].witnessed).toBe(false);
    expect(copy2.some(x => x.pairs[knob].witnessed)).toBe(true);
    expect(copy2.at(-1).pairs[knob].witnessed).toBe(false);
  }
  // Frozen CURRENT-P4 model regression only, not measured IBM geometry.
  // Intentional source-backed bridge/knob correction must update this contract.
  const expectedCurrentP4Brackets = [
    [0, 'left-platen-knob', true, false, .20904541015625, .209075927734375],
    [0, 'right-platen-knob', true, false, .20904541015625, .209075927734375],
    [1, 'left-platen-knob', true, false, .129852294921875, .1298828125],
    [1, 'right-platen-knob', true, false, .129852294921875, .1298828125],
    [2, 'left-platen-knob', false, true, .030975341796875, .031005859375],
    [2, 'left-platen-knob', true, false, .10302734375, .103057861328125],
    [2, 'right-platen-knob', false, true, .030975341796875, .031005859375],
    [2, 'right-platen-knob', true, false, .10302734375, .103057861328125]
  ];
  expect(outcome.transitions).toHaveLength(expectedCurrentP4Brackets.length);
  for (let i=0; i<expectedCurrentP4Brackets.length; i++) {
    const actual=outcome.transitions[i], expected=expectedCurrentP4Brackets[i];
    expect([actual.copy,actual.knob,actual.from,actual.to]).toEqual(expected.slice(0,4));
    expect(actual.refined[0]).toBeCloseTo(expected[4],10);
    expect(actual.refined[1]).toBeCloseTo(expected[5],10);
  }
  for (const record of outcome.observations) {
    if (record.copy >= 3 || record.fraction > .25) {
      for (const pair of Object.values(record.pairs)) {
        expect(pair.witnessed).toBe(false);
      }
    }
  }
  for (const x of outcome.transitions) {
    expect(x.refined[1]-x.refined[0]).toBeLessThanOrEqual(1/(64*512)+1e-12);
    expect(x.lower.witnessed).not.toBe(x.upper.witnessed);
  }
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-platen-knob-full-motion.json',
    JSON.stringify({
      version:1, publicCommit:process.env.GITHUB_SHA||null,
      study:'modeled P4 knob/rear-bridge nondegenerate surface contact through full P5 hinge opening',
      fullOpenPresentationDegrees:52,
      exactOriginal721CoverIdentified:false,OEMCopyControlTravelMeasured:false,
      actualIBMCollisionAsserted:false,publicGeometryPromoted:false,
      ...outcome
    },null,2)+'\n','utf8');
});
