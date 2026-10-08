import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
test.setTimeout(420_000);

test('Selectric hood facet-family ablation isolates modeled interference without deleting meshes',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.goto('http://127.0.0.1:4173/ibm-selectric-721/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
 expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
 const result=await page.evaluate(()=>{
  const d=window.__selectricDebug;
  const before=d.state,data=d.hoodTypeElementPanelAblationSweepProbe(),after=d.state;
  return {data,restored:before.carrierX===after.carrierX &&
    before.printApproach===after.printApproach &&
    before.serviceCoverOpen===after.serviceCoverOpen &&
    before.geometry.cheekSmoothingPreviewP5.enabled===after.geometry.cheekSmoothingPreviewP5.enabled &&
    before.cycle===after.cycle && before.line===after.line &&
    before.copyControlSetting===after.copyControlSetting};
 });
 expect(result.restored).toBe(true);
 const d=result.data;
 expect(d.totalCases).toBe(180);
 expect(d.uniquePhysicalPoseCount).toBe(45);
 expect(d.cases).toHaveLength(180);
 expect(d.visibleHoodMeshModified).toBe(false);
 expect(d.historicalSourcePhotoCalibrated).toBe(false);
 expect(d.OEMContactCertified).toBe(false);
 expect(d.productionGeometryPromoted).toBe(false);
 const maskDefs=[
  ['all-faces',[],44],['without-rear-cap',['rear-cap'],42],
  ['without-underside',['underside'],34],
  ['without-rear-cap-and-underside',['rear-cap','underside'],32]];
 expect(d.masks.map(x=>[x.name,x.excluded])).toEqual(maskDefs.map(x=>x.slice(0,2)));
 const byPose=new Map(),summary={};
 for(const [name,excluded,size] of maskDefs){
  const samples=d.cases.filter(x=>x.mask===name);
  expect(samples).toHaveLength(45);
  summary[name]={contactPoses:0,satCandidatesWithoutWitness:0,surfaceDisjointPoses:0,
    degeneratePairCandidates:0,witnessExamplePanels:{}};
  for(const row of samples){
   expect(row.excludedHoodPanelClasses).toEqual(excluded);
   expect(row.originalHoodTriangles).toBe(44);
   expect(row.diagnosticHoodTriangles).toBe(size);
   expect(row.visibleMeshAltered).toBe(false);
   expect(row.sourceProductionGeometryAccepted).toBe(false);
   expect(row.modeledSurfaceContactWitnessed).toBe(row.witnessedPrimitiveCount>0);
   expect(row.exampleHoodPanels).toHaveLength(row.exampleHoodTriangleIndices.length);
   for(const p of row.exampleHoodPanels){
    expect(excluded).not.toContain(p);
    summary[name].witnessExamplePanels[p]=(summary[name].witnessExamplePanels[p]||0)+1;
   }
   summary[name].degeneratePairCandidates+=row.degeneratePairCount;
   if(row.modeledSurfaceContactWitnessed)summary[name].contactPoses++;
   else if(row.satCandidatePrimitiveCount>0)summary[name].satCandidatesWithoutWitness++;
   else summary[name].surfaceDisjointPoses++;
   const key=[row.carrierXmm,row.printApproach,row.serviceCoverOpen].join('|');
   if(!byPose.has(key))byPose.set(key,{});
   byPose.get(key)[name]=row;
  }
 }
 expect(byPose.size).toBe(45);
 expect(summary['all-faces'].contactPoses).toBe(21);
 expect(summary['all-faces'].surfaceDisjointPoses).toBe(24);
 for(const rows of byPose.values()){
  const baseline=rows['all-faces'].modeledSurfaceContactWitnessed;
  for(const name of maskDefs.slice(1).map(x=>x[0])){
   if(rows[name].modeledSurfaceContactWitnessed)expect(baseline).toBe(true);
  }
  if(rows['without-rear-cap-and-underside'].modeledSurfaceContactWitnessed){
   expect(rows['without-rear-cap'].modeledSurfaceContactWitnessed).toBe(true);
   expect(rows['without-underside'].modeledSurfaceContactWitnessed).toBe(true);
  }
 }
 expect(errors).toEqual([]);
 await writeFile('test-results/selectric-hood-type-facet-ablation.json',
  JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
    purpose:'diagnostic filtering of P4 hood triangle families without modifying visible renderer meshes',
    originalStateRestored:result.restored,sourcePhotoCalibrated:false,
    OEMCoverGeometryCertified:false,physicalCollisionCertified:false,
    actualMeshEdited:false,geometryPromoted:false,summary,...d},null,2)+'\n');
});
