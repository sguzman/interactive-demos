import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
test.setTimeout(420_000);

test('P4 90-pose hood/type actual triangle pair SAT with coplanar synthetic cases',async({page})=>{
 const errors=[];
 page.on('pageerror',err=>errors.push(String(err)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.goto('http://127.0.0.1:4173/ibm-selectric-721/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
 expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
 const out=await page.evaluate(()=>{
  const debug=window.__selectricDebug;
  const synthetic=debug.syntheticTriangleSATRegressionP4();
  const before=debug.state;
  const data=debug.hoodTypeElementTriangleContactSATSweepProbe();
  const after=debug.state;
  const restored=before.carrierX===after.carrierX &&
   before.printApproach===after.printApproach &&
   before.serviceCoverOpen===after.serviceCoverOpen &&
   before.geometry.cheekSmoothingPreviewP5.enabled===after.geometry.cheekSmoothingPreviewP5.enabled &&
   before.cycle===after.cycle && before.line===after.line &&
   before.copyControlSetting===after.copyControlSetting;
  return {synthetic,data,restored};
 });
 expect(out.synthetic).toEqual({parallelDisjoint:false,coplanarOverlap:true,
  coplanarDisjoint:false,transverseContact:true});
 expect(out.restored).toBe(true);
 const data=out.data;
 expect(data.totalCases).toBe(90);
 expect(data.cases).toHaveLength(90);
 expect(data.rockerPhases).toEqual([0,.9,1]);
 expect(data.coverFractions).toEqual([0,.25,.5,.75,1]);
 const classes=new Map();
 const counts={surfaceExcluded:0,candidates:0,byCover:{'0':0,'0.25':0,
  '0.5':0,'0.75':0,'1':0},maxPairsTested:0,maxCandidatePrimitiveCount:0};
 for(const p of data.cases){
  expect(p.parentSubmeshCount).toBe(8);
  expect(p.renderedTypePrimitiveCount).toBe(95);
  expect(p.hoodTriangleCount).toBe(44);
  expect(p.refinedTriangleSATEnabled).toBe(true);
  expect(p.primitiveTriangleSATCandidates).toBeGreaterThanOrEqual(p.refinedTriangleCandidatePrimitives);
  expect(p.refinedSurfacePairProvenDisjoint).toBe(p.refinedTriangleCandidatePrimitives===0);
  if(p.primitiveTriangleSATCandidates===0)expect(p.refinedSurfacePairProvenDisjoint).toBe(true);
  for(const k of ['exactTriangleTriangleIntersectionTested','filledSolidContainmentRuledOut',
   'historicSourceGeometryCalibrated','factoryClearanceCertified','geometryPromoted']){
   expect(p[k]).toBe(false);
  }
  counts.maxPairsTested=Math.max(counts.maxPairsTested,p.refinedTrianglePairTests);
  counts.maxCandidatePrimitiveCount=Math.max(counts.maxCandidatePrimitiveCount,
   p.refinedTriangleCandidatePrimitives);
  if(p.refinedSurfacePairProvenDisjoint){
   counts.surfaceExcluded++;counts.byCover[String(p.serviceCoverOpen)]++;
  }else counts.candidates++;
  const key=[p.carrierXmm,p.printApproach,p.serviceCoverOpen].join('|');
  const snapshot=[p.refinedTriangleCandidatePrimitives,
   p.refinedSurfacePairProvenDisjoint,p.primitiveTriangleSATCandidates];
  if(!classes.has(key))classes.set(key,snapshot);
  else expect(snapshot).toEqual(classes.get(key));
 }
 expect(classes.size).toBe(45);
 expect(counts.surfaceExcluded+counts.candidates).toBe(90);
 expect(counts.surfaceExcluded).toBeGreaterThanOrEqual(48);
 expect(data.sourceCameraCalibrated).toBe(false);
 expect(data.productionCollisionCertified).toBe(false);
 expect(data.fullFilledSolidContainmentCertified).toBe(false);
 expect(data.publicGeometryPromoted).toBe(false);
 expect(errors).toEqual([]);
 await writeFile('test-results/selectric-hood-type-triangle-contact-sat.json',
  JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
   purpose:'3D triangle face/edge separating axes including coplanar projections, tolerance 1e-6 mm',
   candidateOnly:true,sourcePhotoCalibrated:false,OEMCollisionCertified:false,
   fullSolidContainmentCertified:false,geometryPromoted:false,
   originalStateRestored:out.restored,synthetic:out.synthetic,summary:counts,...data},null,2)+'\n');
});
