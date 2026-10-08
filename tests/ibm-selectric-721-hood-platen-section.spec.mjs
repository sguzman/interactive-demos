import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(180_000);

test('platen/hood central cross section preserves source geometry and returns finite margin', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, {timeout:20000});
  await expect(page.locator('#loading')).toBeHidden();

  const payload=await page.evaluate(() => {
    const debug=window.__selectricDebug;
    debug.setPower(false);
    debug.setExplosion(0);
    debug.setCheekSmoothingPreview(false);
    const state=debug.state;
    const saved={carrierX:state.carrierX,cycle:state.cycle,line:state.line};
    const cases=[];
    for(const smooth of [false,true]){
      debug.setCheekSmoothingPreview(smooth);
      for(const copy of [0,4]){
        debug.setCopyControl(copy);
        for(const fraction of [0,.25,.5,.75,1]){
          debug.setServiceCover(fraction);
          const p=debug.hoodPlatenCenterSectionProbe();
          if(p.cheekPreviewEnabled!==smooth || p.copyControlSetting!==copy
            || Math.abs(p.serviceCoverOpen-fraction)>1e-9){
            throw new Error('incorrect snapshot for section geometry');
          }
          for(const name of ['platenCenterWorldYmm','platenCenterWorldZmm',
                 'platenRadiusMmP4','minHoodSurfaceToPlatenAxisMm',
                 'signedHoodSurfaceToPlatenCylinderMmP4']){
            if(!Number.isFinite(p[name]))throw new Error(name+' is nonfinite');
          }
          if(!(p.platenRadiusMmP4>0) || p.hoodCentralStationCount!==6
             || p.sectionPolygonEdgeCount!==12)throw new Error('loft station anatomy drift');
          // Browser page.evaluate has no Playwright 'expect' global.
          if (Math.abs(p.paperWrapRadiusMmP4 - p.platenRadiusMmP4 - 0.65) > 1e-8
              || p.paperWrapIsConcentricP4Arc !== true
              || p.originalPaperWrapArcConfirmed !== false
              || p.fullOutputPaperCollisionCertified !== false
              || !(p.paperWrapSectionDistanceLowerBoundMmP4 > 0)
              || Math.abs(p.paperWrapSectionDistanceLowerBoundMmP4 -
                 (p.signedHoodSurfaceToPlatenCylinderMmP4 - 0.65)) > 1e-6) {
            throw new Error('P4 concentric-wrap radius or conservative bound drift');
          }
          if(p.factoryClearanceCertified!==false || p.sourceCoverLevelVerified!==false
              || p.whole3DMeshCollisionCertified!==false){
            throw new Error('unearned factory certification');
          }
          cases.push(p);
        }
      }
    }
    debug.setCheekSmoothingPreview(false);
    debug.setCopyControl(0);
    debug.setServiceCover(0);
    const end=debug.state;
    const restored=saved.carrierX===end.carrierX && saved.cycle===end.cycle
      && saved.line===end.line
      && end.geometry.cheekSmoothingPreviewP5.enabled===false
      && end.copyControlSetting===0 && end.serviceCoverOpen===0;
    return {cases,restored};
  });
  expect(payload.restored).toBe(true);
  expect(payload.cases).toHaveLength(20);
  // The optional cheek preview must never influence hood/platen anatomy.
  for(let i=0;i<10;i++){
    const original=payload.cases[i],smooth=payload.cases[i+10];
    expect(smooth.signedHoodSurfaceToPlatenCylinderMmP4)
      .toBeCloseTo(original.signedHoodSurfaceToPlatenCylinderMmP4, 6);
    expect(smooth.centralSectionIndicatesModelOverlap)
      .toBe(original.centralSectionIndicatesModelOverlap);
  }
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-hood-platen-section.json',
    JSON.stringify({
      version:1,publicCommit:process.env.GITHUB_SHA||null,
      scope:'actual P4 hood centerline section versus radius of P4 platen cylinder',
      exact3DSolidCollisionCertified:false,
      factoryCoverLevelOrPlatenClearanceCertified:false,
      geometryPromoted:false,
      ...payload
    },null,2)+'\n','utf8');
});
