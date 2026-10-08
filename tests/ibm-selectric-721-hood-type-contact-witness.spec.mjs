import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
test.setTimeout(420_000);

test('model P4 hood/type 90-pose segment and coplanar triangle contact witnesses',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.goto('http://127.0.0.1:4173/ibm-selectric-721/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
 expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
 const result=await page.evaluate(()=>{
  const d=window.__selectricDebug;
  const synthetic=d.syntheticTriangleContactWitnessP4();
  const before=d.state,data=d.hoodTypeElementContactWitnessSweepProbe(),after=d.state;
  const restored=before.carrierX===after.carrierX &&
   before.printApproach===after.printApproach &&
   before.serviceCoverOpen===after.serviceCoverOpen &&
   before.geometry.cheekSmoothingPreviewP5.enabled===after.geometry.cheekSmoothingPreviewP5.enabled &&
   before.cycle===after.cycle && before.line===after.line &&
   before.copyControlSetting===after.copyControlSetting;
  return {data,restored,synthetic};
 });
 expect(result.synthetic).toEqual({
  separated:true,coplanar:true,coplanarSeparated:true,transverse:true});
 expect(result.restored).toBe(true);
 const d=result.data;
 expect(d.totalCases).toBe(90);
 expect(d.cases).toHaveLength(90);
 expect(d.modeledSurfaceContactWitnessOnly).toBe(true);
 const summary={witnessedModelSurfacePoseCount:0,unwitnessedSATAmbiguous:0,
  priorSATDisjoint:0,maximumWitnessPrimitives:0,maximumWitnessTriangleChecks:0,
  contactExamples:[],hoodPanelExampleCounts:{},maximumPointToSurfaceDistanceMmP4:0};
 const byMode=new Map();
 for(const p of d.cases){
  expect(p.parentSubmeshCount).toBe(8);
  expect(p.renderedTypePrimitiveCount).toBe(95);
  expect(p.hoodTriangleCount).toBe(44);
  expect(p.refinedTriangleSATEnabled).toBe(true);
  expect(p.witnessProbeEnabled).toBe(true);
  expect(p.modeledSurfaceContactWitnessed).toBe(p.modeledSurfaceContactWitnessPrimitives>0);
  expect(p.modeledSurfaceContactWitnessPrimitives).toBeLessThanOrEqual(p.refinedTriangleCandidatePrimitives);
  for(const candidate of p.contactWitnessExamples){
   expect(candidate.worldPointMmP4).toHaveLength(3);
   expect(candidate.worldPointMmP4.every(Number.isFinite)).toBe(true);
   expect(['type-triangle-edge-to-hood-face','hood-triangle-edge-to-type-face','coplanar-face-overlap']).toContain(candidate.method);
   expect(Number.isInteger(candidate.hoodTriangleIndex)).toBe(true);
   expect(candidate.hoodTriangleIndex).toBeGreaterThanOrEqual(0);
   expect(candidate.hoodTriangleIndex).toBeLessThan(44);
   const span=candidate.hoodStationSpanIndexP4;
   const panel=candidate.hoodPanelClassP4;
   if(candidate.hoodTriangleIndex<40){
    expect(span).toBe(Math.floor(candidate.hoodTriangleIndex/8));
    expect(panel).toBe(['underside','right-wall','top-panel','left-wall'][
     Math.floor(candidate.hoodTriangleIndex/2)%4]);
   }else {
    expect(span).toBe(null);
    expect(panel).toBe(candidate.hoodTriangleIndex<42?'front-cap':'rear-cap');
   }
   for(const name of ['typeSurfaceDistanceMmP4','hoodSurfaceDistanceMmP4']){
    expect(Number.isFinite(candidate[name])).toBe(true);
    expect(candidate[name]).toBeGreaterThanOrEqual(0);
    expect(candidate[name]).toBeLessThan(1e-4);
    summary.maximumPointToSurfaceDistanceMmP4=Math.max(
      summary.maximumPointToSurfaceDistanceMmP4,candidate[name]);
   }
   summary.hoodPanelExampleCounts[panel]=(summary.hoodPanelExampleCounts[panel]||0)+1;
  }
  expect(p.sourceManufacturingContactCertified).toBe(false);
  expect(p.filledSolidContainmentRuledOut).toBe(false);
  expect(p.historicSourceGeometryCalibrated).toBe(false);
  expect(p.geometryPromoted).toBe(false);
  if(p.modeledSurfaceContactWitnessed){
   summary.witnessedModelSurfacePoseCount++;
   if(summary.contactExamples.length<12)summary.contactExamples.push({
    cover:p.serviceCoverOpen,carrier:p.carrierXmm,rocker:p.printApproach,
    witnesses:p.contactWitnessExamples.slice(0,2)});
  }else if(p.refinedTriangleCandidatePrimitives){
   summary.unwitnessedSATAmbiguous++;
  }else summary.priorSATDisjoint++;
  summary.maximumWitnessPrimitives=Math.max(summary.maximumWitnessPrimitives,
   p.modeledSurfaceContactWitnessPrimitives);
  summary.maximumWitnessTriangleChecks=Math.max(summary.maximumWitnessTriangleChecks,
   p.trianglePairWitnessTests);
  const key=[p.carrierXmm,p.printApproach,p.serviceCoverOpen].join('|');
  const equivalent=[p.modeledSurfaceContactWitnessed,p.modeledSurfaceContactWitnessPrimitives,
   p.refinedTriangleCandidatePrimitives];
  if(!byMode.has(key))byMode.set(key,equivalent);
  else expect(equivalent).toEqual(byMode.get(key));
 }
 expect(byMode.size).toBe(45);
 expect(summary.witnessedModelSurfacePoseCount+summary.unwitnessedSATAmbiguous+
  summary.priorSATDisjoint).toBe(90);
 expect(summary.priorSATDisjoint).toBe(48);
 for(const key of ['historicSourceGeometryCalibrated','fullSolidCollisionCertified','publicGeometryPromoted'])
  expect(d[key]).toBe(false);
 expect(errors).toEqual([]);
 await writeFile('test-results/selectric-hood-type-contact-witness.json',
  JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
   purpose:'P4 actual triangle-edge and coplanar-overlap surface witnesses; no production-geometry conclusion',
   modelContactWitnessOnly:true,sourcePhotoCalibrated:false,
   physicalManufacturingContactCertified:false,solidContainmentCertified:false,
   geometryPromoted:false,synthetic:result.synthetic,
   stateRestored:result.restored,summary,...d},null,2)+'\n');
});
