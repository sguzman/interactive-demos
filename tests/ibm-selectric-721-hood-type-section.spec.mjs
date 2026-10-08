import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(180_000);
test('source-limited hood/type-element section: only positive bounds can exclude collision', async ({page}) => {
  const errors=[];
  page.on('pageerror', e=>errors.push(String(e)));
  page.on('console', m=>{if(m.type()==='error') errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  const data=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setPower(false);
    d.setExplosion(0);
    d.setCheekSmoothingPreview(false);
    const frozen=d.state;
    const saved={carrierX:frozen.carrierX,cycle:frozen.cycle,line:frozen.line};
    const cases=[];
    for(const preview of [false,true]){
      d.setCheekSmoothingPreview(preview);
      for(const copy of [0,4]){
        d.setCopyControl(copy);
        for(const cover of [0,.25,.5,.75,1]){
          d.setServiceCover(cover);
          const p=d.hoodTypeElementSectionProbe();
          if(p.serviceCoverOpen!==cover || p.copyControlSetting!==copy ||
             p.cheekPreviewEnabled!==preview) throw Error('probe state drift');
          if(!Number.isFinite(p.enclosingTypeElementSphereRadiusMm)
            || !(p.enclosingTypeElementSphereRadiusMm>0)
            || !Number.isFinite(p.conservativeHoodTypeElementGapLowerBoundMm)){
            throw Error('nonfinite model bound');
          }
          if(p.boundedModelPairProvenDisjoint !==
            (p.conservativeHoodTypeElementGapLowerBoundMm>0)){
            throw Error('unsound disjoint classification');
          }
          if(p.modelIntersectionProven!==false ||
             p.realFactoryCoverLevelVerified!==false ||
             p.factoryClearanceCertified!==false ||
             p.completeCarrierMotionSweepCertified!==false)
             throw Error('unearned factory/contact certification');
          cases.push(p);
        }
      }
    }
    d.setCopyControl(0);d.setServiceCover(0);d.setCheekSmoothingPreview(false);
    const now=d.state;
    return {cases,restored:now.carrierX===saved.carrierX &&
      now.cycle===saved.cycle && now.line===saved.line &&
      now.copyControlSetting===0 && now.serviceCoverOpen===0 &&
      now.geometry.cheekSmoothingPreviewP5.enabled===false};
  });
  expect(data.restored).toBe(true);
  expect(data.cases).toHaveLength(20);
  for(let k=0;k<10;k++){
    expect(data.cases[k+10].conservativeHoodTypeElementGapLowerBoundMm)
      .toBeCloseTo(data.cases[k].conservativeHoodTypeElementGapLowerBoundMm,6);
  }
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-hood-type-element-section.json',
    JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
      purpose:'P4 modeled bounding sphere vs hood YZ section; positive lower bound excludes named pair only',
      productionContactCertified:false, sourcePhotoFitCertified:false,
      publicGeometryPromoted:false,...data},null,2)+'\n');
});
