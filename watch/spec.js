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
  id: 'M6d',
  label: 'closed-loop normalized movement mechanics',
  note: 'M6a–M6d close the current normalized system architecture. M6a separates barrel-arbor winding from barrel-drum release and inserts a spring-twist → torque → train-side work path upstream of M5i. M6b replaces fixed train load with smoothed reaction load derived from escapement work demand, rejected contact work, oscillator amplitude, geometry faults and stall state; insufficient torque margin can now hold the movement with reserve remaining. M6c reconciles spring-side budget, train/load loss, contact loss and balance-delivered work in one explicit normalized ledger and exposes its arithmetic residual. M6d coordinates those states into one operating mode and adds hysteretic torque-stall behavior to prevent load chatter. The architecture is now closed-loop at the normalized educational level, but torque, load, spring turns, efficiency, balance inertia, friction and work units remain reconstruction parameters rather than calibrated ETA production measurements.'
};
