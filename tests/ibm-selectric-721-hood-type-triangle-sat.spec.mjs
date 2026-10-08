import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(360_000);

test('P4 hood/type-element 90-pose instance-aware two-way triangle-vs-box SAT',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const report=await page.evaluate(()=>{
    const debug=window.__selectricDebug,before=debug.state;
    const data=debug.hoodTypeElementTriangleBoxSATSweepProbe();
    const after=debug.state;
    const restored=before.carrierX===after.carrierX &&
      before.printApproach===after.printApproach &&
      before.serviceCoverOpen===after.serviceCoverOpen &&
      before.geometry.cheekSmoothingPreviewP5.enabled===after.geometry.cheekSmoothingPreviewP5.enabled &&
      before.cycle===after.cycle && before.line===after.line &&
      before.copyControlSetting===after.copyControlSetting;
    return {data,restored};
  });
  expect(report.restored).toBe(true);
  expect(report.data.totalCases).toBe(90);
  expect(report.data.cases).toHaveLength(90);
  expect(report.data.cheekPreviewModes).toEqual([false,true]);
  expect(report.data.coverFractions).toEqual([0,.25,.5,.75,1]);
  expect(report.data.rockerPhases).toEqual([0,.9,1]);
  const summary={
    surfaceDisjoint:0,stillAmbiguous:0,
    maxCandidateTypePrimitiveCount:0,requiredSlugPrimitives:0,
    byCover:{'0':0,'0.25':0,'0.5':0,'0.75':0,'1':0}
  };
  for(const p of report.data.cases){
    expect(p.parentSubmeshCount).toBe(8);
    expect(p.hoodTriangleCount).toBe(44);
    // The 88 instanced slugs must NOT collapse to one non-instance mesh.
    expect(p.renderedTypePrimitiveCount).toBeGreaterThanOrEqual(95);
    expect(p.fullyTriangulatedSlugInstancesIncluded).toBe(true);
    expect(p.primitiveTriangleAABBCandidates).toBeGreaterThanOrEqual(p.primitiveTriangleSATCandidates);
    expect(p.primitiveHoodBoundsCandidates).toBeGreaterThanOrEqual(p.primitiveTriangleAABBCandidates);
    expect(p.surfaceIntersectionExcludedByTwoWaySAT).toBe(p.primitiveTriangleSATCandidates===0);
    if(p.priorSubmeshAABBCandidates===0)expect(p.primitiveTriangleSATCandidates).toBe(0);
    expect(p.examples.length).toBeLessThanOrEqual(8);
    expect(Number.isFinite(p.examinedTypeHoodTriangleBoxPairs)).toBe(true);
    for(const flag of ['exactTriangleTriangleIntersectionTested','filledSolidContainmentRuledOut',
      'historicSourceGeometryCalibrated','factoryClearanceCertified','geometryPromoted']){
      expect(p[flag]).toBe(false);
    }
    summary.requiredSlugPrimitives=p.renderedTypePrimitiveCount;
    summary.maxCandidateTypePrimitiveCount=Math.max(summary.maxCandidateTypePrimitiveCount,
      p.primitiveTriangleSATCandidates);
    if(p.surfaceIntersectionExcludedByTwoWaySAT){
      summary.surfaceDisjoint++;
      summary.byCover[String(p.serviceCoverOpen)]++;
    }else summary.stillAmbiguous++;
  }
  expect(summary.surfaceDisjoint+summary.stillAmbiguous).toBe(90);
  // Preview only swaps fixed cheek meshes. It cannot move the modeled hood,
  // type element or these source-limited collision candidates.
  const classes=new Map();
  for(const p of report.data.cases){
    const key=[p.carrierXmm,p.printApproach,p.serviceCoverOpen].join('|');
    const signature=[p.primitiveHoodBoundsCandidates,
      p.primitiveTriangleAABBCandidates,p.primitiveTriangleSATCandidates,
      p.surfaceIntersectionExcludedByTwoWaySAT];
    if(!classes.has(key))classes.set(key,signature);
    else expect(signature).toEqual(classes.get(key));
  }
  expect(classes.size).toBe(45);
  // The older 90-state per-submesh AABB broadphase excluded 48 poses.
  // A triangle-level SAT necessary filter cannot make any of those newly
  // intersecting; a regression below 48 signals an implementation error.
  expect(summary.surfaceDisjoint).toBeGreaterThanOrEqual(48);
  expect(report.data.sourcePhotoGeometryAccepted).toBe(false);
  expect(report.data.exactTriangleTriangleIntersectionTested).toBe(false);
  expect(report.data.geometryPromoted).toBe(false);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-hood-type-triangle-sat.json',
    JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
      testKind:'instance-aware P4 triangle-vs-opposite-triangle-AABB SAT, two necessary tests, not triangle-triangle collision',
      submeshGeometryPromoted:false,sourceCameraCalibrated:false,OEMClearanceCertified:false,
      originalPhysicalStateRestored:report.restored,summary,...report.data},null,2)+'\n');
});
