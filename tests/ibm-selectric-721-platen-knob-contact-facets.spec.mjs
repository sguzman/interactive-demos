import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(420_000);
test('P4 rear bridge knob contacts identify local box-face families',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const outcome=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setExplosion(0);d.setCheekSmoothingPreview(false);
    d.setCopyControl(0);d.setServiceCover(0);
    const pre=d.state;
    const saved=[pre.carrierX,pre.cycle,pre.line,pre.platenIndex];
    const reports=[];
    try{
      for(let copy=0;copy<5;copy++){
        d.setCopyControl(copy);
        for(const hood of [0,.25,.5,.75,1]){
          d.setServiceCover(hood);
          const r=d.hoodPlatenKnobSurfaceContactProbe();
          reports.push({copy,hood,pairs:r.pairs.map(p=>({
            knob:p.knob,coverPart:p.coverPart,
            surfaceWitnessPairs:p.surfaceWitnessPairs,
            witnessesByCoverFacet:p.witnessesByCoverFacet,
            modeledNondegenerateSurfaceContactWitnessed:p.modeledNondegenerateSurfaceContactWitnessed
          }))});
        }
      }
    }finally{
      d.setServiceCover(0);d.setCopyControl(0);
      d.setCheekSmoothingPreview(false);
    }
    const aft=d.state;
    return {reports,restored:saved.every((x,i)=>x===[
      aft.carrierX,aft.cycle,aft.line,aft.platenIndex][i])&&
      aft.copyControlSetting===0&&aft.serviceCoverOpen===0&&
      aft.geometry.cheekSmoothingPreviewP5.enabled===false};
  });
  expect(outcome.restored).toBe(true);
  expect(outcome.reports).toHaveLength(25);
  const classes=['bridge-local-x-positive','bridge-local-x-negative',
    'bridge-local-y-positive','bridge-local-y-negative',
    'bridge-local-z-positive','bridge-local-z-negative'];
  const totals=Object.fromEntries(classes.map(key=>[key,0]));
  const byCase=[];
  for(const report of outcome.reports){
    for(const pair of report.pairs){
      const facetTotal=Object.values(pair.witnessesByCoverFacet)
        .reduce((a,b)=>a+b,0);
      expect(facetTotal).toBe(pair.surfaceWitnessPairs);
      expect(pair.modeledNondegenerateSurfaceContactWitnessed)
        .toBe(pair.surfaceWitnessPairs>0);
      if(pair.surfaceWitnessPairs){
        expect(pair.coverPart).toBe('rear-service-bridge');
        expect(report.hood).toBe(0);
        expect(report.copy).toBeLessThan(2);
        byCase.push({copy:report.copy,hood:report.hood,
          knob:pair.knob,trianglePairs:pair.surfaceWitnessPairs,
          facetCounts:pair.witnessesByCoverFacet});
      }
      for(const [facet,count] of Object.entries(pair.witnessesByCoverFacet)){
        expect(classes).toContain(facet);
        expect(Number.isInteger(count)).toBe(true);
        expect(count).toBeGreaterThan(0);
        totals[facet]+=count;
      }
    }
  }
  expect(byCase.map(x=>x.trianglePairs)).toEqual([24,25,25,25]);
  expect(Object.values(totals).reduce((a,b)=>a+b,0)).toBe(99);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-platen-knob-contact-facets.json',
    JSON.stringify({version:1,publicCommit:process.env.GITHUB_SHA||null,
      model:'source-unpromoted P4 rear bridge local box-face contacts',
      originalIBMRearBridgeGeometryVerified:false,
      actualProductionCollisionCertified:false,
      geometryChanged:false,
      restored:outcome.restored,totals,byCase},null,2)+'\n','utf8');
});
