import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(120_000);

test('Selectric isolates closed-cover SAT ambiguity without changing the hood',async({page})=>{
 const errors=[];
 page.on('pageerror',x=>errors.push(String(x)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4173/ibm-selectric-721/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
 expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
 const out=await page.evaluate(()=>{
  const d=window.__selectricDebug,before=d.state;
  const data=d.hoodTypeElementAmbiguousFacetProbe(),after=d.state;
  return {data,restored:before.carrierX===after.carrierX &&
    before.printApproach===after.printApproach &&
    before.serviceCoverOpen===after.serviceCoverOpen &&
    before.geometry.cheekSmoothingPreviewP5.enabled===after.geometry.cheekSmoothingPreviewP5.enabled &&
    before.cycle===after.cycle && before.line===after.line};
 });
 expect(out.restored).toBe(true);
 expect(out.data.totalCases).toBe(3);
 expect(out.data.publicHoodMeshModified).toBe(false);
 expect(out.data.productionGeometryPromoted).toBe(false);
 expect(out.data.OEMClearanceCertified).toBe(false);
 const positions=[-107.95,0,107.95];
 for(const [i,p] of out.data.cases.entries()){
  expect(p.carrierXmm).toBeCloseTo(positions[i],6);
  expect(p.printApproach).toBe(0);
  expect(p.serviceCoverOpen).toBe(0);
  expect(p.diagnosticHoodTriangleCount).toBe(32);
  expect(p.modeledSurfaceContactWitnessed).toBe(false);
  expect(p.satCandidatePrimitives).toBe(1);
  expect(p.degenerateTrianglePairCandidates).toBe(7);
  expect(p.nondegenerateSATWithoutWitnessPairs).toBeGreaterThanOrEqual(0);
  for(const d of p.degeneratePairExamples){
   expect(Math.min(d.typeTriangleAreaMm2,d.hoodTriangleAreaMm2)).toBeLessThanOrEqual(1e-10);
   expect(d.hoodPanelClass).not.toBe('rear-cap');
   expect(d.hoodPanelClass).not.toBe('underside');
  }
  for(const d of p.nondegenerateSATWithoutWitnessExamples){
   expect(d.hoodPanelClass).not.toBe('rear-cap');
   expect(d.hoodPanelClass).not.toBe('underside');
  }
 }
 expect(errors).toEqual([]);
 await writeFile('test-results/selectric-hood-type-facet-ambiguity.json',
   JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
      definition:'Three previously ambiguous fully-closed rocker-rest poses, no visual mesh alteration',
      OEMCollisionCertified:false,publicGeometryPromoted:false,
      originalStateRestored:out.restored,...out.data},null,2)+'\n');
});
