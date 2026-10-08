import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(240_000);

test('P4 actual type submesh vs hood-triangle world AABB surface candidates at 90 poses', async ({page}) => {
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const output=await page.evaluate(()=>{
    const debug=window.__selectricDebug;
    const before=debug.state;
    const data=debug.hoodTypeElementSubmeshBroadphaseSweepProbe();
    const after=debug.state;
    const restored=before.carrierX===after.carrierX &&
      before.printApproach===after.printApproach &&
      before.serviceCoverOpen===after.serviceCoverOpen &&
      before.geometry.cheekSmoothingPreviewP5.enabled===after.geometry.cheekSmoothingPreviewP5.enabled &&
      before.cycle===after.cycle && before.line===after.line &&
      before.copyControlSetting===after.copyControlSetting;
    return {data,restored};
  });
  expect(output.restored).toBe(true);
  const report=output.data;
  expect(report.totalCases).toBe(90);
  expect(report.cases).toHaveLength(90);
  expect(report.carrierPositionsMm).toHaveLength(3);
  expect(report.rockerPhases).toEqual([0,.9,1]);
  expect(report.coverFractions).toEqual([0,.25,.5,.75,1]);
  expect(report.cheekPreviewModes).toEqual([false,true]);
  const summary={
    typeSubmeshCounts:[],
    excludedSurfaceTrianglePairs:0,possibleSurfaceTrianglePairs:0,
    minCandidateTriangleAABBPairs:Infinity,
    maxCandidateTriangleAABBPairs:-Infinity
  };
  for(const p of report.cases){
    expect(p.hoodTriangleCount).toBe(44);
    expect(p.typeSubmeshCount).toBeGreaterThan(0);
    expect(p.typeSubmeshBoundsOverlappingHoodBounds).toBeGreaterThanOrEqual(p.typeSubmeshTriangleAABBCandidates);
    expect(p.hoodTriangleSubmeshAABBCandidatePairs).toBeGreaterThanOrEqual(p.typeSubmeshTriangleAABBCandidates);
    expect(p.noTypeSubmeshAABBOverlapsAnyHoodTriangleAABB).toBe(p.typeSubmeshTriangleAABBCandidates===0);
    expect(p.modeledSurfaceTriangleIntersectionExcluded).toBe(p.typeSubmeshTriangleAABBCandidates===0);
    expect(p.candidateSubmeshExamples.length).toBeLessThanOrEqual(8);
    for(const forbidden of ['modeledSolidInterpenetrationCertifiedAbsent',
      'actualTriangleTriangleIntersectionTested','historicalSourceCalibrated',
      'factoryClearanceCertified','geometryPromoted']){
      expect(p[forbidden]).toBe(false);
    }
    summary.typeSubmeshCounts.push(p.typeSubmeshCount);
    if(p.modeledSurfaceTriangleIntersectionExcluded)summary.excludedSurfaceTrianglePairs++;
    else summary.possibleSurfaceTrianglePairs++;
    summary.minCandidateTriangleAABBPairs=Math.min(summary.minCandidateTriangleAABBPairs,p.hoodTriangleSubmeshAABBCandidatePairs);
    summary.maxCandidateTriangleAABBPairs=Math.max(summary.maxCandidateTriangleAABBPairs,p.hoodTriangleSubmeshAABBCandidatePairs);
  }
  expect(summary.possibleSurfaceTrianglePairs+summary.excludedSurfaceTrianglePairs).toBe(90);
  expect(report.factoryClearanceCertified).toBe(false);
  expect(report.sourcePhotoGeometryAccepted).toBe(false);
  expect(report.geometryPromoted).toBe(false);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-hood-type-submesh-broadphase.json',
    JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
      purpose:'actual modeled type-child AABBs against transformed P4 hood triangle AABBs',
      surfaceOnly:true,solidsCertifiedDisjoint:false,
      sourcePhotoCalibrated:false,geometryPromoted:false,
      originalStateRestored:output.restored,summary,...report},null,2)+'\n');
});
