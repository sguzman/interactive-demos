import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(420_000);
test('Selectric hood/type contact transitions are source-unpromoted facet diagnostics',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const outcome=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    const a=d.state;
    const data=d.hoodTypeFacetContactPhaseProbe();
    const b=d.state;
    return {data,restored:a.carrierX===b.carrierX &&
      a.printApproach===b.printApproach &&
      a.serviceCoverOpen===b.serviceCoverOpen &&
      a.geometry.cheekSmoothingPreviewP5.enabled===
         b.geometry.cheekSmoothingPreviewP5.enabled &&
      a.cycle===b.cycle && a.line===b.line && a.copyControlSetting===b.copyControlSetting};
  });
  const d=outcome.data;
  expect(outcome.restored).toBe(true);
  expect(d.coarseCaseCount).toBe(108);
  expect(d.coarseCases).toHaveLength(108);
  expect(d.rockerPhases).toEqual([0,.9,1]);
  expect(d.coverFractions).toEqual([0,.125,.25,.375,.5,.625,.75,.875,1]);
  expect(d.refinementIterations).toBe(10);
  expect(d.carrierXmm).toBe(0);
  expect(d.masks.map(x=>x.name)).toEqual([
    'all-faces','without-rear-cap','without-underside','without-rear-cap-and-underside'
  ]);
  expect(d.broadGridCannotExcludeUnobservedContactIslands).toBe(true);
  for(const key of ['publicHoodMeshesModified','historicalOriginalCoverVerified',
    'filledSolidCollisionCertified','OEMContactCertified','productionGeometryPromoted']){
    expect(d[key]).toBe(false);
  }
  const byKey=new Map();
  for(const row of d.coarseCases){
    const key=[row.printApproach,row.serviceCoverOpen].join('|');
    if(!byKey.has(key))byKey.set(key,{});
    byKey.get(key)[row.mask]=row;
    expect(row.hoodTrianglesInDiagnostic).toBeGreaterThanOrEqual(32);
    expect(row.hoodTrianglesInDiagnostic).toBeLessThanOrEqual(44);
    expect(row.carrierXmm).toBe(0);
    expect(row.modeledSurfaceContactWitnessed).toBe(row.witnessPrimitiveCount>0);
    expect(row.nondegenerateSATWithoutWitnessPairs).toBeGreaterThanOrEqual(0);
  }
  expect(byKey.size).toBe(27);
  for(const rows of byKey.values()){
    const all=rows['all-faces'].modeledSurfaceContactWitnessed;
    for(const mode of ['without-rear-cap','without-underside',
                       'without-rear-cap-and-underside']){
      if(rows[mode].modeledSurfaceContactWitnessed)expect(all).toBe(true);
    }
  }
  for(const b of d.brackets){
    expect(b.residualWidthFraction).toBeCloseTo(1/8192,8);
    expect(b.lowerCoverFraction).toBeLessThan(b.upperCoverFraction);
    expect(b.lowerWitnessed).not.toBe(b.upperWitnessed);
    expect(b.diagnosticOnly).toBe(true);
  }
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-hood-type-contact-phase.json',
    JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
      originalMechanicalStateRestored:outcome.restored,
      sourceOriginalHoodVerified:false,solidContactCertified:false,
      productionGeometryPromoted:false,...d},null,2)+'\n');
});