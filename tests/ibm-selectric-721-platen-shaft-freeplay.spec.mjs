import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// IBM 241-5032-2 p.59 distinguishes light +X shaft bias and heavier
// leftward ratchet driver spring. ALL numbers here are P5 illustrations.
test.setTimeout(180_000);
test('Selectric Figure 141 light shaft free-play spring is distinct and preloaded', async ({page}) => {
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/?platenKnobCandidate=1&platenInternals=1',
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const result=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setExplosion(0);d.setServiceCover(0);d.setCopyControl(0);
    if(d.state.platenVariableEngaged)throw new Error('Started with variable pressed');
    const rest=d.platenVariableInternalsProbeP5();
    d.togglePlatenVariable();
    const held=d.platenVariableInternalsProbeP5();
    if(!d.rotatePlatenManually(Math.PI/15)) throw new Error('No manual rotation under press');
    const rotated=d.platenVariableInternalsProbeP5();
    d.togglePlatenVariable();
    const released=d.platenVariableInternalsProbeP5();
    d.setPlatenVariableInternalsInspectionP5(false);
    d.togglePlatenVariable();
    d.rotatePlatenManually(-Math.PI/15);
    d.togglePlatenVariable();
    d.setPlatenKnobCandidateP4(false);
    const baseline=d.platenVariableInternalsProbeP5();
    d.setPlatenKnobCandidateP4(true);
    const revisited=d.platenVariableInternalsProbeP5();
    d.setPlatenKnobCandidateP4(false);
    return {rest,held,rotated,released,baseline,revisited,
      originalStrokeEstablished:false,actualSpringForceCalculated:false};
  });
  for(const state of [result.rest,result.held,result.rotated,result.released,result.revisited]){
    expect(state.lightFreePlaySpringPresentP5).toBe(true);
    expect(state.lightFreePlaySpringVisibleP5).toBe(true);
    expect(state.lightShaftSpringDistinctFromVariableDriverSpringP5).toBe(true);
    expect(state.freePlaySpringParentedToPlatenP5).toBe(true);
    expect(state.fixedSeatParentedToPlatenP5).toBe(true);
    expect(state.slidingCollarParentedToRodP5).toBe(true);
    expect(state.freePlayBiasDirectionP5).toBe('right / +X');
    expect(state.freePlayFixedSeatToCoilGapMmP5).toBeCloseTo(0,5);
    expect(state.freePlayCoilToMovingCollarGapMmP5).toBeCloseTo(0,5);
    expect(state.freePlaySpringHypotheticalFreeLengthMmP5).toBe(8);
    expect(state.freePlaySpringRemainingCompressionMmP5).toBeGreaterThan(0);
    expect(state.factoryLightFreePlaySpringLengthMeasured).toBe(false);
    expect(state.factoryLightFreePlaySpringForceMeasured).toBe(false);
    expect(state.lightFreePlaySpringForcesSimulated).toBe(false);
  }
  expect(result.rest.freePlaySpringLoadedLengthMmP5).toBeCloseTo(4,5);
  expect(result.held.freePlaySpringLoadedLengthMmP5).toBeCloseTo(6,5);
  expect(result.rest.freePlaySpringRemainingCompressionMmP5).toBeCloseTo(4,5);
  expect(result.held.freePlaySpringRemainingCompressionMmP5).toBeCloseTo(2,5);
  expect(result.rest.springLengthMmP5).toBeCloseTo(6.1,5);
  expect(result.held.springLengthMmP5).toBeCloseTo(4.1,5);
  expect(result.rotated.freePlaySpringLoadedLengthMmP5).toBeCloseTo(6,5);
  expect(result.rotated.platenRotationRadP5-result.held.platenRotationRadP5)
    .toBeCloseTo(Math.PI/15,5);
  expect(result.rotated.ratchetRotationRadP5-result.held.ratchetRotationRadP5)
    .toBeCloseTo(0,5);
  expect(result.released.freePlaySpringLoadedLengthMmP5).toBeCloseTo(4,5);
  expect(result.baseline.visible).toBe(false);
  expect(result.baseline.lightFreePlaySpringVisibleP5).toBe(false);
  expect(result.revisited.freePlaySpringLoadedLengthMmP5).toBeCloseTo(4,5);
  expect(result.originalStrokeEstablished).toBe(false);
  expect(result.actualSpringForceCalculated).toBe(false);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-shaft-free-play-spring.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      source:'IBM form 241-5032-2 p59 paragraph Platen Variable',
      P5Hypothetical:true,...result},null,2)+'\n','utf8');
});