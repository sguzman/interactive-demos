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
  regulator: 'ETACHRON',
  fullWindStemTurns2020: 25,
  fullWindStemTurns2020Source: 'ETA IH 6497-2 FDE 482414 11 · 2020-08-12 · P0 dated'
};

export const CANONICAL = {
  specimenId: 'specimen:eta-unitas-6497-2',
  projectionMilestone: 'M6e',
  engineeringSyncDate: '2026-09-19',
  engineeringFrontier: 'ENG-6497-008 complete · ENG-6497-009 physical validation blocked on identified specimen',
  provenanceScheme: 'P0 manufacturer · P1 measurement · P2 derived · P3 audited secondary · P4 reconstruction · P5 presentation',
  publicationBoundary: 'Public projection only; private canonical corpus is not linked.'
};

// Part numbers follow ETA's current 6497-2 spare-parts list where available.
// Geometry positions are reference-derived presentation coordinates in millimetres,
// not manufacturing coordinates.
export const PARTS = {
  mainplate: { etaPos: '1', canonicalId: 'eta6497-pos-1-main-plate-assembled', name: 'Main plate, assembled' },
  escapeWheel: { etaPos: '12', canonicalId: 'eta6497-pos-12-escape-wheel', name: 'Escape wheel' },
  thirdWheel: { etaPos: '13', canonicalId: 'eta6497-pos-13-third-wheel', name: 'Third wheel' },
  secondWheel: { etaPos: '14', canonicalId: 'eta6497-pos-14-second-wheel', name: 'Second / fourth wheel' },
  centerWheel: { etaPos: '15', canonicalId: 'eta6497-pos-15-centre-wheel', name: 'Centre wheel' },
  trainBridge: { etaPos: '16', canonicalId: 'eta6497-pos-16-train-wheel-bridge', name: 'Train wheel bridge, jewelled', screws: 2 },
  barrel: { etaPos: '17', canonicalId: 'eta6497-pos-17-movement-barrel-complete', name: 'Movement barrel, complete' },
  barrelBridge: { etaPos: '18', canonicalId: 'eta6497-pos-18-barrel-bridge', name: 'Barrel bridge, jewelled', screws: 3 },
  crownWheelRing: { etaPos: '19', canonicalId: 'eta6497-pos-19-crown-wheel-ring', name: 'Crown wheel ring' },
  crownWheel: { etaPos: '20', canonicalId: 'eta6497-pos-20-crown-wheel', name: 'Crown wheel' },
  clickSpring: { etaPos: '21', canonicalId: 'eta6497-pos-21-click-spring', name: 'Click spring' },
  click: { etaPos: '22', canonicalId: 'eta6497-pos-22-click', name: 'Click' },
  ratchetWheel: { etaPos: '23', canonicalId: 'eta6497-pos-23-ratchet-wheel', name: 'Ratchet wheel' },
  cannonPinion: { etaPos: '24', canonicalId: 'eta6497-pos-24-driver-cannon-pinion', name: 'Driver cannon pinion' },
  palletFork: { etaPos: '25', canonicalId: 'eta6497-pos-25-pallet-fork', name: 'Pallet fork' },
  palletBridge: { etaPos: '26', canonicalId: 'eta6497-pos-26-pallet-bridge', name: 'Pallet bridge, jewelled', screws: 2 },
  balance: { etaPos: '27', canonicalId: 'eta6497-pos-27-timed-balance-with-stud', name: 'Timed balance regulated, with stud' },
  balanceBridge: { etaPos: '28', canonicalId: 'eta6497-pos-28-balance-bridge-assembled', name: 'Balance bridge, assembled', screws: 1 },
  hourWheel: { etaPos: '29', canonicalId: 'eta6497-pos-29-hour-wheel', name: 'Hour wheel' }
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
  id: 'M6e',
  label: 'stage-resolved closed-loop movement mechanics',
  note: 'M6a–M6e close the current normalized system architecture. M6a separates barrel-arbor winding from barrel-drum release and inserts spring twist → torque → train-side work upstream of M5i. M6b adds downstream reaction-load feedback and torque-margin stalls. M6c reconciles spring-side budget, train/load loss, contact loss and balance-delivered work in one ledger. M6d coordinates the movement into explicit operating/fault states with hysteretic torque-stall behavior. M6e then decomposes the formerly anonymous train reaction load into the reconstructed centre 80→third pinion 10, third 60→fourth pinion 8, and fourth 120→escape pinion 10 stages plus pivot/jewel, display and escapement contributions; their normalized stage efficiencies compound into the transmission ceiling that feeds the same M6 feedback loop. All M6 torque, load, stage-efficiency, spring-turn and work values remain educational reconstruction parameters rather than calibrated ETA production measurements.'
};
