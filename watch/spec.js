export const ETA6497_2 = {
  caliber: 'ETA / Unitas 6497-2',
  diameterMm: 36.6,
  heightMm: 4.5,
  frequencyHz: 3,
  alternationsPerHour: 21600,
  jewels: 17,
  liftAngleDeg: 44,
  powerReserveMinHours: 53,
  powerReserveTypicalHours: 60,
  winding: 'manual',
  display: 'hours, minutes, small seconds',
  regulator: 'ETACHRON'
};

// Part numbers follow ETA's current 6497-2 spare-parts list where available.
// Geometry positions are reference-derived presentation coordinates in millimetres,
// not manufacturing coordinates.
export const PARTS = {
  mainplate: { etaPos: '1', name: 'Main plate, assembled' },
  escapeWheel: { etaPos: '12', name: 'Escape wheel' },
  thirdWheel: { etaPos: '13', name: 'Third wheel' },
  secondWheel: { etaPos: '14', name: 'Second / fourth wheel' },
  centerWheel: { etaPos: '15', name: 'Centre wheel' },
  trainBridge: { etaPos: '16', name: 'Train wheel bridge, jewelled', screws: 2 },
  barrel: { etaPos: '17', name: 'Movement barrel, complete' },
  barrelBridge: { etaPos: '18', name: 'Barrel bridge, jewelled', screws: 3 },
  crownWheelRing: { etaPos: '19', name: 'Crown wheel ring' },
  crownWheel: { etaPos: '20', name: 'Crown wheel' },
  clickSpring: { etaPos: '21', name: 'Click spring' },
  click: { etaPos: '22', name: 'Click' },
  ratchetWheel: { etaPos: '23', name: 'Ratchet wheel' },
  cannonPinion: { etaPos: '24', name: 'Driver cannon pinion' },
  palletFork: { etaPos: '25', name: 'Pallet fork' },
  palletBridge: { etaPos: '26', name: 'Pallet bridge, jewelled', screws: 2 },
  balance: { etaPos: '27', name: 'Timed balance regulated, with stud' },
  balanceBridge: { etaPos: '28', name: 'Balance bridge, assembled', screws: 1 },
  hourWheel: { etaPos: '29', name: 'Hour wheel' }
};

export const LAYOUT = {
  barrel: [6.7, 6.4],
  crownWheel: [12.2, 4.0],
  centerWheel: [0.1, 2.2],
  thirdWheel: [-5.4, -1.2],
  secondWheel: [-11.25, 0.0],
  escapeWheel: [-5.4, -7.2],
  pallet: [-7.2, -10.0],
  balance: [-10.1, -9.4]
};

export const MILESTONE = {
  id: 'M5i',
  label: 'normalized escapement impulse work transfer',
  note: 'M5i retains the M5h finite polygon contact solver and M5f integrated balance, then replaces the remaining fixed-size admitted Δω packet with normalized work transfer. Remaining spring drive defines an available work budget for each center-crossing opportunity. The polygon solver measures how far the escape tooth can follow the active pallet impulse surface and the quality of that finite-surface contact; those quantities produce an educational transfer efficiency, delivered-work value, and rejected/lost-work value. M5f now accepts a continuous impulse scale from the geometry layer, and the balance kick is scaled by the square root of transferred work fraction rather than being identical for every admitted contact. Work units, path normalization, contact efficiency, impulse gain and all dynamic coefficients remain educational reconstruction parameters, not joules, measured pallet efficiency, or ETA torque data.'
};
