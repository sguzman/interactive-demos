import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// P5 diagnostic visualization only. No factory tooth geometry or snap.
test.setTimeout(180_000);
test('Selectric provisional clutch risk overlay tracks actual teeth and restores source materials',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/?platenKnobCandidate=1&platenInternals=1&platenContact=1',
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const states=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setExplosion(0);d.setServiceCover(0);d.setCopyControl(0);
    if(d.state.platenVariableEngaged)throw new Error('Already pressed');
    const read=()=>({collision:d.platenVariableClutchSeatingProbeP5(),
      view:d.platenClutchContactInspectionProbeP5()});
    const aligned=read();
    let angle=0;
    try{
      d.togglePlatenVariable();
      const pressed=read();
      if(!d.rotatePlatenManually(Math.PI/12))throw new Error('No free platen turn');
      angle=Math.PI/12;
      const movedPressed=read();
      d.togglePlatenVariable();
      const risky=read();
      d.setPlatenClutchContactInspectionP5(false);
      const hidden=read();
      d.setPlatenClutchContactInspectionP5(true);
      const reactivated=read();
      return {aligned,pressed,movedPressed,risky,hidden,reactivated,
        modelCountChanged:false};
    }finally{
      if(!d.state.platenVariableEngaged)d.togglePlatenVariable();
      if(angle)d.rotatePlatenManually(-angle);
      if(d.state.platenVariableEngaged)d.togglePlatenVariable();
      d.setPlatenClutchContactInspectionP5(false);
      d.setPlatenKnobCandidateP4(false);
      d.setPlatenVariableInternalsInspectionP5(false);
    }
  });
  for(const name of ['aligned','pressed','movedPressed','risky','reactivated']){
    const {collision,view}=states[name];
    expect(collision.active).toBe(true);
    expect(view.enabled).toBe(true);
    expect(view.toothCount).toBe(24);
    expect(view.coloredTeeth).toBe(2);
    expect(view.originalMaterialsUntouched).toBe(true);
    expect(view.decorated.filter(x=>x.highlight!=='none')).toHaveLength(2);
    expect(view.decorated.filter(x=>x.activeMaterialIsOverlay)).toHaveLength(2);
    expect(view.angularSnapPhysicsImplemented).toBe(false);
    expect(view.actualContactVerified).toBe(false);
    expect(view.actualFactorySerrationCountKnown).toBe(false);
  }
  expect(states.aligned.collision.potentialProxyToothBlockingOnRelease).toBe(false);
  expect(states.pressed.collision.toothAxialSeparated).toBe(true);
  expect(states.movedPressed.collision.toothAxialSeparated).toBe(true);
  expect(states.risky.collision.potentialProxyToothBlockingOnRelease).toBe(true);
  expect(states.risky.view.decorated.filter(x=>x.highlight==='possible-block')).toHaveLength(2);
  expect(states.hidden.view.enabled).toBe(false);
  expect(states.hidden.view.coloredTeeth).toBe(0);
  expect(states.hidden.view.decorated.filter(x=>x.activeMaterialIsOverlay)).toHaveLength(0);
  expect(states.modelCountChanged).toBe(false);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-clutch-visual-risk-overlay.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      factoryGeometryVerified:false,visualOnly:true,...states},null,2)+'\n','utf8');
});