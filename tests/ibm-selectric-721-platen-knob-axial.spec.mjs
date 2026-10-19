import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// 1966 IBM form 241-5032-2 Fig.141 supplies TOPOLOGY ONLY.
// The 2-mm inward stroke and 8-mm grip offset are hypothetical P5.
test.setTimeout(420_000);
test('Selectric opt-in left knob axial push, return, and 650 endpoint poses',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/?platenKnobCandidate=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);

  const out=await page.evaluate(()=>{
    const d=window.__selectricDebug, rows=[];
    d.setExplosion(0);d.setCheekSmoothingPreview(false);
    d.setServiceCover(0);d.setCopyControl(0);
    if(d.state.platenVariableEngaged||!d.state.geometry.paperFeed.platenKnobCandidateP4Enabled)
      throw new Error('Candidate not at rest');
    const origin=d.platenKnobCandidateEnvelopeProbeP4();
    const leftGrip=state=>state.segments.find(s=>s.role==='outboard-grip'&&s.side==='left');
    const rightGrip=state=>state.segments.find(s=>s.role==='outboard-grip'&&s.side==='right');
    const originLeft=leftGrip(origin),originRight=rightGrip(origin);
    const ratchet=d.state.platenIndex;
    const phase=d.state.geometry.paperFeed.platenPhysicalAngleRad;
    try{
      for(const pressed of [false,true]){
        if(d.state.platenVariableEngaged!==pressed)d.togglePlatenVariable();
        for(let copy=0;copy<5;copy++){
          d.setCopyControl(copy);
          for(let i=0;i<=64;i++){
            const opening=i/64;
            d.setServiceCover(opening);
            const e=d.platenKnobCandidateEnvelopeProbeP4();
            const left=leftGrip(e),right=rightGrip(e);
            const pairs=d.hoodPlatenKnobSurfaceContactProbe().pairs;
            const expected=pressed?2:0;
            if(e.leftAxialPressP5Mm!==expected||e.rightAxialPressP5Mm!==0||
               e.minimumVisibleOutboardBridgeXGapMmP4<0.999999 ||
               Math.abs(left.meshWorldXmmP4[1]-originLeft.meshWorldXmmP4[1]-expected)>1e-7||
               Math.abs(right.meshWorldXmmP4[0]-originRight.meshWorldXmmP4[0])>1e-7||
               pairs.length!==4||pairs.some(p=>p.surfaceWitnessPairs!==0||
                 p.satWithoutWitness!==0||p.degeneratePairs!==0))
              throw new Error('P5 knob axial/hood contact: '+JSON.stringify({pressed,copy,opening,e,pairs}));
            rows.push({pressed,copy,opening,gap:e.minimumVisibleOutboardBridgeXGapMmP4,
                       contacts:pairs.map(p=>p.surfaceWitnessPairs)});
          }
        }
      }
      d.setServiceCover(0);d.setCopyControl(0);
      if(!d.rotatePlatenManually(Math.PI/24)||
         d.state.platenIndex!==ratchet||
         Math.abs(d.state.geometry.paperFeed.platenPhysicalAngleRad-phase-Math.PI/24)>1e-7)
        throw new Error('Platen/ratchet failed to decouple under left press');
      d.togglePlatenVariable();
      if(d.platenKnobCandidateEnvelopeProbeP4().leftAxialPressP5Mm!==0||
         d.rotatePlatenManually(Math.PI/24)||d.state.platenIndex!==ratchet)
        throw new Error('Release failed to restore coupling');
      d.togglePlatenVariable();
      if(!d.rotatePlatenManually(-Math.PI/24))throw new Error('Failed to restore rotation');
      d.togglePlatenVariable();
      const restored=d.platenKnobCandidateEnvelopeProbeP4();
      return {rows,restored,ratchet,initialPhase:phase,OEMStrokeKnown:false};
    } finally {
      d.setServiceCover(0);d.setCopyControl(0);
      if(d.state.platenVariableEngaged)d.togglePlatenVariable();
      d.setPlatenKnobCandidateP4(false);
      d.setExplosion(0);d.setCheekSmoothingPreview(false);
    }
  });
  expect(out.rows).toHaveLength(650);
  expect(out.rows.filter(s=>s.pressed)).toHaveLength(325);
  expect(out.restored.leftAxialPressP5Mm).toBe(0);
  expect(out.restored.minimumVisibleOutboardBridgeXGapMmP4).toBeGreaterThanOrEqual(2.999999);
  expect(out.OEMStrokeKnown).toBe(false);
  expect(await page.evaluate(()=>window.__selectricDebug.state.platenVariableEngaged)).toBe(false);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-knob-axial-endpoints.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      applicability:'P5 hypothetical 2-mm push; original IBM stroke unknown',...out},null,2)+'\n');
});
