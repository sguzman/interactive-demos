import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.setTimeout(180_000);
test('Selectric Figure 141 standard-style P5 internal clutch parts move and restore',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/?platenKnobCandidate=1&platenInternals=1',
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const r=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setExplosion(0);d.setServiceCover(0);d.setCopyControl(0);
    const atRest=d.platenVariableInternalsProbeP5();
    if(!atRest.allocated||!atRest.visible||!atRest.inspectionEnabled)
      throw new Error('Internal geometry or ghost inspection missing');
    d.togglePlatenVariable();
    const pressed=d.platenVariableInternalsProbeP5();
    const phaseBefore=d.state.geometry.paperFeed.platenPhysicalAngleRad;
    const ratchetBefore=d.state.platenIndex;
    if(!d.rotatePlatenManually(Math.PI/12))throw new Error('Ratchet separation failed');
    const rotated=d.platenVariableInternalsProbeP5();
    const phaseAfter=d.state.geometry.paperFeed.platenPhysicalAngleRad;
    d.togglePlatenVariable();
    const released=d.platenVariableInternalsProbeP5();
    d.setPlatenVariableInternalsInspectionP5(false);
    const inspectorOff=d.platenVariableInternalsProbeP5();
    d.togglePlatenVariable();
    d.rotatePlatenManually(-Math.PI/12);
    d.togglePlatenVariable();
    d.setPlatenKnobCandidateP4(false);
    const baseline=d.platenVariableInternalsProbeP5();
    d.setPlatenKnobCandidateP4(true);
    const restored=d.platenVariableInternalsProbeP5();
    d.setPlatenKnobCandidateP4(false);
    return {atRest,pressed,rotated,released,inspectorOff,baseline,restored,
      phaseBefore,phaseAfter,ratchetBefore,ratchetAfter:d.state.platenIndex};
  });
  for(const a of [r.atRest,r.pressed,r.rotated,r.released,r.inspectorOff,r.restored]){
    expect(a.allocated).toBe(true);
    expect(a.ratchetChannelLugs).toBe(2);
    expect(a.twoActuatorPins).toBe(2);
    expect(a.platenSerrationCountP5).toBe(12);
    expect(a.driverSerrationCountP5).toBe(12);
    expect(a.variableDriverRatchetParented).toBe(true);
    expect(a.platenPlugCarriageParented).toBe(true);
    expect(a.rodCarriageParented).toBe(true);
    expect(a.productionKnobStrokeKnown).toBe(false);
    expect(a.productionSerrationCountKnown).toBe(false);
    expect(a.geometricallyCertifiedSerrationEngagement).toBe(false);
    expect(a.publicDefaultModified).toBe(false);
    expect(a.springWorldEndXmmP5).toBeCloseTo(145.5,6);
    expect(a.pinTipsToDriverAxialGapMmP5).toBeCloseTo(0,5);
    expect(a.driverToSpringAxialGapMmP5).toBeCloseTo(0,5);
    expect(a.transversePinBoreRadialClearanceMmP5).toBeCloseTo(0.2,6);
    expect(a.centralShaftBoreRadialClearanceMmP5).toBeCloseTo(0.2,6);
  }
  expect(r.atRest.leftPressMmP5).toBe(0);
  expect(r.atRest.springLengthMmP5).toBeCloseTo(6.1,6);
  expect(r.pressed.leftPressMmP5).toBe(2);
  expect(r.pressed.driverLocalXmmP5-r.atRest.driverLocalXmmP5).toBeCloseTo(2,6);
  expect(r.pressed.pushRodWorldPosition[0]-r.atRest.pushRodWorldPosition[0]).toBeCloseTo(2,6);
  expect(r.pressed.springLengthMmP5).toBeCloseTo(4.1,6);
  expect(r.pressed.compressionSpringWorldStart[0]-r.atRest.compressionSpringWorldStart[0]).toBeCloseTo(2,6);
  expect(r.rotated.ratchetRotationRadP5).toBeCloseTo(r.pressed.ratchetRotationRadP5,6);
  expect(r.rotated.platenRotationRadP5-r.pressed.platenRotationRadP5).toBeCloseTo(Math.PI/12,6);
  expect(r.rotated.pushRodRotationRadP5-r.pressed.pushRodRotationRadP5).toBeCloseTo(Math.PI/12,6);
  expect(r.released.leftPressMmP5).toBe(0);
  expect(r.released.springLengthMmP5).toBeCloseTo(5.5,6);
  expect(r.inspectorOff.inspectionEnabled).toBe(false);
  expect(r.baseline.visible).toBe(false);
  expect(r.baseline.inspectionEnabled).toBe(false);
  expect(r.restored.visible).toBe(true);
  expect(r.restored.inspectionEnabled).toBe(false);
  expect(r.ratchetAfter).toBe(r.ratchetBefore);
  expect(r.phaseAfter-r.phaseBefore).toBeCloseTo(Math.PI/12,6);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-figure141-internal-clutch.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      source:'IBM 241-5032-2 p59 Fig141 standard style',
      dimensionsOriginalIBM:false,
      fullSerrationContactCertified:false,...r},null,2)+'\n','utf8');
});
