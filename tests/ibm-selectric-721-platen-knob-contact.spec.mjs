import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(420_000);
test('Selectric outboard knob modeled triangle surface witnesses are nonpromoting',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const outcome=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setCheekSmoothingPreview(false);
    d.setExplosion(0);
    d.setCopyControl(0);
    d.setServiceCover(0);
    const begin=d.state;
    const before=[begin.carrierX,begin.cycle,begin.line,begin.platenIndex];
    const samples=[];
    try{
      for(let copy=0;copy<5;copy++){
        d.setCopyControl(copy);
        for(const cover of [0,.25,.5,.75,1]){
          d.setServiceCover(cover);
          samples.push(d.hoodPlatenKnobSurfaceContactProbe());
        }
      }
    }finally{
      d.setServiceCover(0);d.setCopyControl(0);
      d.setCheekSmoothingPreview(false);
    }
    const after=d.state;
    return {samples,
      restored:before.every((v,i)=>v===[
        after.carrierX,after.cycle,after.line,after.platenIndex][i]) &&
        after.copyControlSetting===0 &&
        after.serviceCoverOpen===0 &&
        after.geometry.cheekSmoothingPreviewP5.enabled===false};
  });
  expect(outcome.restored).toBe(true);
  expect(outcome.samples).toHaveLength(25);
  const stats={broadphaseCandidates:0,positivePairPoses:0,
    strictWitnessTrianglePairs:0,
    possibleSATWithoutWitnessPairs:0,degenerateTrianglePairs:0,
    byKnobAndCover:{}};
  const keys=['left-platen-knob|lofted-service-hood',
    'left-platen-knob|rear-service-bridge',
    'right-platen-knob|lofted-service-hood',
    'right-platen-knob|rear-service-bridge'];
  for(let i=0;i<25;i++){
    const row=outcome.samples[i];
    expect(row.pairCount).toBe(4);
    expect(row.pairs).toHaveLength(4);
    expect(row.copyControlSetting).toBe(Math.floor(i/5));
    expect(row.serviceCoverOpen).toBe([0,.25,.5,.75,1][i%5]);
    expect(row.cheekSmoothingPreview).toBe(false);
    expect(row.explosion).toBe(0);
    for(const flag of ['exactOriginal721CoverLevelIdentified',
      'OEMKnobDimensionsMeasured','actualProductionCollisionAsserted',
      'completeFilledSolidContactCertified','geometryChanged'])
      expect(row[flag]).toBe(false);
    row.pairs.forEach((p,index)=>{
      const id=p.knob+'|'+p.coverPart;
      expect(id).toBe(keys[index]);
      expect(p.knobTriangleCount).toBeGreaterThan(10);
      expect(p.coverTriangleCount).toBeGreaterThan(10);
      expect(p.triangleAabbPairs).toBeGreaterThanOrEqual(0);
      expect(p.satPairs).toBeGreaterThanOrEqual(p.surfaceWitnessPairs);
      expect(p.satPairs).toBeGreaterThanOrEqual(p.satWithoutWitness);
      expect(p.noSurfaceWitnessDoesNotCertifyFilledSolids).toBe(true);
      expect(p.modeledNondegenerateSurfaceContactWitnessed)
        .toBe(p.surfaceWitnessPairs>0);
      if(!p.parentAabbCandidate){
        expect(p.triangleAabbPairs).toBe(0);
        expect(p.surfaceWitnessPairs).toBe(0);
      }
      if(!stats.byKnobAndCover[id]){
        stats.byKnobAndCover[id]={broadphaseCandidates:0,
          surfaceWitnessedPoses:0,strictWitnessPairs:0,satWithoutWitness:0};
      }
      const v=stats.byKnobAndCover[id];
      if(p.parentAabbCandidate){stats.broadphaseCandidates++;v.broadphaseCandidates++;}
      if(p.surfaceWitnessPairs){
        stats.positivePairPoses++;v.surfaceWitnessedPoses++;
      }
      stats.strictWitnessTrianglePairs+=p.surfaceWitnessPairs;
      stats.possibleSATWithoutWitnessPairs+=p.satWithoutWitness;
      stats.degenerateTrianglePairs+=p.degeneratePairs;
      v.strictWitnessPairs+=p.surfaceWitnessPairs;
      v.satWithoutWitness+=p.satWithoutWitness;
      for(const ex of p.examples){
        expect(ex.knobSurfacePointErrorMm).toBeLessThanOrEqual(.0001);
        expect(ex.coverSurfacePointErrorMm).toBeLessThanOrEqual(.0001);
        expect(ex.worldPointMmP4).toHaveLength(3);
        expect(ex.worldPointMmP4.every(Number.isFinite)).toBe(true);
      }
    });
  }
  expect(stats.broadphaseCandidates).toBe(38);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-platen-knob-contact-witnesses.json',
    JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
      sourceOriginalCoverVerified:false,
      OEMKnobDimensionsVerified:false,
      actualProductionCollisionCertified:false,
      filledSolidContainmentCertified:false,
      geometryPromoted:false,
      originalStateRestored:outcome.restored,stats,samples:outcome.samples},
      null,2)+'\n','utf8');
});
