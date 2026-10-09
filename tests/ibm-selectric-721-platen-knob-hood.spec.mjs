import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(180_000);
test('Selectric P4 outboard platen knob versus hinged hood AABB broadphase', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, {timeout:20000});
  await expect(page.locator('#loading')).toBeHidden();
  const result = await page.evaluate(() => {
    const d = window.__selectricDebug;
    d.setPower(false);
    d.setExplosion(0);
    d.setCopyControl(0);
    d.setServiceCover(0);
    d.setCheekSmoothingPreview(false);
    const original = d.state;
    const saved = [original.carrierX, original.cycle,
      original.line, original.platenIndex];
    const samples = [];
    try {
      for (const preview of [false, true]) {
        d.setCheekSmoothingPreview(preview);
        for (let copy = 0; copy < 5; copy++) {
          d.setCopyControl(copy);
          for (const cover of [0,.25,.5,.75,1]) {
            d.setServiceCover(cover);
            samples.push(d.hoodPlatenKnobCoverBroadphaseProbe());
          }
        }
      }
    } finally {
      d.setCheekSmoothingPreview(false);
      d.setServiceCover(0);
      d.setCopyControl(0);
    }
    const s = d.state;
    return {
      samples,
      stateRestored: saved[0]===s.carrierX && saved[1]===s.cycle &&
        saved[2]===s.line && saved[3]===s.platenIndex &&
        s.copyControlSetting===0 && s.serviceCoverOpen===0 &&
        s.geometry.cheekSmoothingPreviewP5.enabled===false
    };
  });
  expect(result.stateRestored).toBe(true);
  expect(result.samples).toHaveLength(50);
  const perPart = new Map();
  const canonical = ['left-platen-knob|lofted-service-hood',
    'left-platen-knob|rear-service-bridge',
    'right-platen-knob|lofted-service-hood',
    'right-platen-knob|rear-service-bridge'];
  for (let i = 0; i < result.samples.length; i++) {
    const item=result.samples[i];
    expect(item.pairCount).toBe(4);
    expect(item.pairs).toHaveLength(4);
    expect(item.explosion).toBe(0);
    expect(item.copyControlSetting).toBe(Math.floor((i%25)/5));
    expect(item.serviceCoverOpen).toBe([0,.25,.5,.75,1][i%5]);
    expect(item.cheekSmoothingPreview).toBe(i>=25);
    for(const key of ['P4ProductionKnobDimensionsVerified',
      'original721CoverLevelAssigned','exact3DMeshContactCertified',
      'fullOriginalPlatenClearanceCertified','publicGeometryPromoted']){
      expect(item[key]).toBe(false);
    }
    const seen = [];
    for(const p of item.pairs){
      const name=p.knob+'|'+p.coverPart;
      seen.push(name);
      expect(p.actualTriangleContactEstablished).toBe(false);
      const gaps=p.signedWorldAabbGapMm;
      for(const axis of ['x','y','z'])expect(Number.isFinite(gaps[axis])).toBe(true);
      expect(p.worldAabbCandidate).toBe(
        gaps.x<=0 && gaps.y<=0 && gaps.z<=0);
      if(!perPart.has(name))perPart.set(name,{pairs:0,candidates:0,
        mostPositiveGapMm: -Infinity,mostNegativeGapMm:Infinity});
      const s=perPart.get(name);
      s.pairs++;
      if(p.worldAabbCandidate)s.candidates++;
      const separatingGap=Math.max(gaps.x,gaps.y,gaps.z);
      s.mostPositiveGapMm=Math.max(s.mostPositiveGapMm,separatingGap);
      s.mostNegativeGapMm=Math.min(s.mostNegativeGapMm,separatingGap);
    }
    expect(seen).toEqual(canonical);
  }
  expect([...perPart.keys()]).toEqual(canonical);
  for (const item of perPart.values())expect(item.pairs).toBe(50);
  // The cheek interpolation is independent of hood/knob geometry.
  for(let i=0;i<25;i++){
    const a=result.samples[i],b=result.samples[i+25];
    for(let j=0;j<4;j++){
      expect(b.pairs[j].worldAabbCandidate).toBe(a.pairs[j].worldAabbCandidate);
      for(const axis of ['x','y','z']){
        expect(b.pairs[j].signedWorldAabbGapMm[axis])
          .toBeCloseTo(a.pairs[j].signedWorldAabbGapMm[axis],6);
      }
    }
  }
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-platen-knob-cover-broadphase.json',JSON.stringify({
    version:1,publicCommit:process.env.GITHUB_SHA||null,
    study:'50 poses: 5 copy detents x 5 cover fractions x 2 optional cheek modes',
    IBMOriginalKnobAndCoverGeometryEstablished:false,
    OEMCollisionCertified:false,
    P4GeometryPromoted:false,
    aabbCandidateIsNotContact:true,
    originalStateRestored:result.stateRestored,
    summary:Object.fromEntries(perPart),samples:result.samples
  },null,2)+'\n','utf8');
});
