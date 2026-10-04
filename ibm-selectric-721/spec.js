export const CANONICAL = Object.freeze({
  specimenId: 'specimen:ibm-selectric-721',
  model: 'IBM Selectric 721',
  profile: 'original Selectric · 7X1 · fabric ribbon · later/new-style Series 72 representative · 12 CPI',
  provenance: 'P0/P2 constraints + explicitly labeled P4 constructive reconstruction',
  envelopeMm: { width: 381.0, depth: 355.6, bodyHeight: 190.0 },
  writingLineMm: 215.9,
  pitchMm: 2.1166666667,
  nominalPositions: 102,
  platen: {
    diameterMm: 36.3728,
    radiusMm: 18.1864,
    ratchetDiameterMm: 30.1498,
    representativeRatchetTeeth: 27
  },
  typeElement: { nominalDiameterMm: 34.925, nominalRadiusMm: 17.4625 },
  printShaft: {
    partNumber: '1164736',
    axis: 'D6',
    endPlayMm: [0.127, 0.254],
    bearingPartNumber: '1164740',
    bearingOuterSphereMm: 15.875,
    bearingBoreMm: 9.5377
  },
  rack: {
    partNumber: '1124109',
    pitchClass: '12P',
    toothInclinationDeg: 14
  },
  bracketClearanceMm: [0.254, 0.3048]
});

export const P4 = Object.freeze({
  note: 'These placement values are constructive reconstruction, not IBM production CAD.',
  axes: 'x = writing-line left/right, y = up, z = front(+)/rear(-)',
  sideframeX: 156,
  baseY: 8,
  platen: { y: 126, z: -92, length: 296 },
  printShaft: { y: 79, z: -47, visibleRadius: 4.55, length: 304 },
  cycleShaft: { y: 47, z: 7, radius: 5.5, length: 286 },
  operationalShaft: { y: 61, z: 24, radius: 4.5, length: 276 },
  rack: { y: 78, z: -69, length: 245, bodyY: 5.5, bodyZ: 7.5 },
  carrier: { y: 91, z: -54, width: 61, height: 22, depth: 42 },
  typeball: { y: 116, zRest: -53.5, zImpact: -56.2 },
  ribbon: { yRest: 101, yLift: 113, z: -73 },
  keyboard: { y: 43, z: 78 },
  motor: { x: -116, y: 39, z: 42 },
  shell: { baseY: 12, keyboardDeckY: 44, rearDeckY: 88 }
});

export const COMPONENTS = Object.freeze({
  shell: {
    name: 'Outer case / shell',
    category: 'product',
    provenance: 'P4 surface reconstruction constrained by product envelope',
    description: 'Recognizable 7X1 Selectric exterior blockout. Exact industrial-design surfaces remain reconstruction.'
  },
  keyboard: {
    name: 'Keyboard',
    category: 'human input',
    provenance: 'P4 repeated key geometry',
    description: 'Repeated key field representing the Selectric keyboard as a product-level input surface.'
  },
  platen: {
    name: 'Platen',
    category: 'paper / print',
    provenance: 'P0/P2 metric anchor',
    description: '36.3728 mm platen diameter anchor. Axis placement remains P4 pending complete D6→D7→D8→D4 solve.'
  },
  printShaft: {
    name: 'Print shaft · IBM 1164736',
    category: 'primary frame',
    provenance: 'exact active part identity + P4 visible section',
    description: 'D6 axis. Bearing identity and service constraints are sourced; visible shaft section is reconstructive until journal/keyway dimensions close.'
  },
  rack: {
    name: 'Escapement rack · IBM 1124109',
    category: 'escapement / carrier support',
    provenance: 'exact active part identity + P4 section',
    description: '12P rack with 14° tooth inclination. Functional section is reconstructed while exact R_front/R_top/R_bottom offsets remain unresolved.'
  },
  carrier: {
    name: 'Carrier',
    category: 'print transport',
    provenance: 'P4 constructive geometry',
    description: 'Carrier rides the D6/front support and rack/shoe rear support and translates across the 8.5-inch writing line.'
  },
  typeball: {
    name: 'Selectric type element',
    category: 'selection / print',
    provenance: 'nominal element diameter + P4 glyph surface',
    description: 'Nominal 34.925 mm element envelope. Tilt/rotate motion is represented independently of carrier translation.'
  },
  selection: {
    name: 'Selection transmission',
    category: 'mechanical information processing',
    provenance: 'source-grounded topology + P4 path geometry',
    description: 'Representative tape/pulley paths preserve the carrier-relative selection concept without claiming factory path coordinates.'
  },
  ribbon: {
    name: 'Fabric ribbon system',
    category: 'inking',
    provenance: 'active fabric-ribbon branch + P4 path',
    description: 'Twin-spool fabric ribbon presentation with a lift state coupled to the print cycle.'
  },
  drive: {
    name: 'Drive / operational shafts',
    category: 'power',
    provenance: 'source-grounded shaft topology + P4 placement',
    description: 'Representative motor, cycle shaft and operational shaft establish the powerframe reading before finer cam geometry is added.'
  }
});
