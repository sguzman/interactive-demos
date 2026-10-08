import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(180_000);

test('P4 hood YZ polygon vs transformed type-element YZ bounding rectangle', async ({page}) => {
  const errors=[];
  page.on('pageerror', err=>errors.push(String(err)));
  page.on('console', msg=>{if(msg.type()==='error') errors.push(msg.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const data=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    const before=d.state, result=d.hoodTypeElementMotionSweepProbe(),after=d.state;
    return {result,restored:before.carrierX===after.carrierX &&
      before.printApproach===after.printApproach &&
      before.serviceCoverOpen===after.serviceCoverOpen &&
      before.cycle===after.cycle && before.line===after.line &&
      before.geometry.cheekSmoothingPreviewP5.enabled ===
        after.geometry.cheekSmoothingPreviewP5.enabled};
  });
  expect(data.restored).toBe(true);
  expect(data.result.totalCases).toBe(90);
  const counts={sphereExclusions:0,rectangleExclusions:0,newExclusions:0,
    rectangleCandidates:0};
  for(const p of data.result.cases){
    expect(p.projectedHoodVertexCount).toBe(12);
    const box=p.typeYZRectangleBoundsMm;
    for(const key of ['minY','maxY','minZ','maxZ']){
      expect(Number.isFinite(box[key])).toBe(true);
    }
    expect(box.minY).toBeLessThan(box.maxY);
    expect(box.minZ).toBeLessThan(box.maxZ);
    expect(p.projectedRectangleProvesDisjoint).toBe(
      !p.projectedRectanglePolygonOverlapCandidate);
    expect(p.originalYZSphereProvesDisjoint).toBe(p.originalYZSectionProvenDisjoint);
    expect(p.modeledIntersectionProven).toBe(false);
    expect(p.productionCollisionCertified).toBe(false);
    expect(p.sourceCameraCalibrated).toBe(false);
    if(p.originalYZSectionProvenDisjoint) counts.sphereExclusions++;
    if(p.projectedRectangleProvesDisjoint) counts.rectangleExclusions++;
    if(p.projectedRectangleProvesDisjoint && !p.originalYZSectionProvenDisjoint)
      counts.newExclusions++;
    if(p.projectedRectanglePolygonOverlapCandidate) counts.rectangleCandidates++;
  }
  expect(counts.sphereExclusions).toBe(36);
  expect(counts.rectangleExclusions).toBeGreaterThanOrEqual(counts.sphereExclusions);
  expect(counts.rectangleExclusions+counts.rectangleCandidates).toBe(90);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-hood-type-rectangle-sweep.json',
    JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
      purpose:'P4 true projected hood polygon vs actual type-element world YZ AABB rectangle, one-way disjointness certificate',
      productionGeometryAccepted:false,sourcePhotoFitCertified:false,
      modelCollisionProven:false,mechanicsRestored:data.restored,
      counts,...data.result},null,2)+'\n');
});
