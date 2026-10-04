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
  typeElement: {
    overallNominalDiameterMm: 34.925,
    structuralRadiusP4Mm: 16.8,
    structuralDiameterP4Mm: 33.6,
    topAboveCenterP4Mm: 11.4,
    skirtHeightP4Mm: 4.6,
    bossOuterRadiusP4Mm: 5.7,
    bossHeightP4Mm: 8.2,
    detentPeakOffsetP4Mm: 6.1,
    positionsPerBand: 22,
    bands: 4,
    characterCount: 88
  },
  printShaft: {
    partNumber: '1164736',
    axis: 'D6',
    endPlayMm: [0.127, 0.254],
    bearingPartNumber: '1164740',
    bearingOuterSphereMm: 15.875,
    bearingBoreMm: 9.5377,
    bearingLengthMm: 9.398
  },
  rack: {
    partNumber: '1124109',
    pitchClass: '12P',
    toothInclinationDeg: 14
  },
  sleeve: {
    partNumber: '1141628',
    keyPartNumber: '1141151',
    combinedFeedDetentCamPartNumber: '1164240',
    printRestoringCamPartNumber: '1124174',
    level2EndPlayMm: [0.0254, 0.1016]
  },
  carrierRearSupport: {
    upperShoePartNumber: '1141770',
    eccentricStudPartNumber: '1141772',
    springPartNumber: '1141985',
    lowerShoeAssemblyPartNumber: '1147260',
    springSuppressedPlayMm: [0.0508, 0.1524]
  },
  bracketClearanceMm: [0.254, 0.3048],
  margin: {
    rackPartNumber: '1164743'
  },
  tab: {
    rackPartNumbers: ['1164102', '6519354'],
    stopBarPartNumber: '1124073'
  },
  drive: {
    motorPulleyTeeth: 8,
    cycleClutchPulleyTeethDerived: 29,
    positiveBeltReduction: 3.625
  },
  timing: {
    cycleShaftDegPerCharacter: 180,
    printShaftDegPerCharacter: 360
  }
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
  typeball: { y: 116, zRest: -50.4 },
  printRocker: {
    pivotY: 94.0,
    pivotZ: -41.9,
    poweredEndpointAngleDeg: -17.0,
    impactAngleDeg: -18.7,
    derivedRestClearanceMm: 6.6136,
    derivedPoweredEndpointClearanceMm: 0.5528,
    class: 'P4 pivot selected to satisfy OEM service clearance envelopes'
  },
  ribbon: {
    yRest: 103,
    yLift: 114,
    z: -68,
    widthMm: 14.2875,
    spoolCenterX: 42,
    spoolRadiusP4: 20
  },
  keyboard: { y: 43, z: 78 },
  motor: { x: -116, y: 39, z: 42 },
  writingLineRacks: { marginY: 68, marginZ: -80, tabY: 61, tabZ: -86, length: 245 },
  cordSystem: { shaftY: 55, shaftZ: -8, drumRadius: 10, leftPulleyX: -142, rightPulleyX: 142 },
  shell: { baseY: 12, keyboardDeckY: 44, rearDeckY: 88 },
  carrierLocal: {
    sleeveLength: 57,
    sleeveRadius: 7.2,
    bearingX: 25,
    escapementBracketY: 89,
    escapementBracketZ: -67,
    supportPlateY: 84,
    supportPlateZ: -70
  }
});

export const COMPONENTS = Object.freeze({
  shell: {
    name: 'Outer case / shell',
    category: 'product',
    provenance: 'P4 surface reconstruction constrained by product envelope',
    description: 'Recognizable 7X1 Selectric exterior reconstruction. Exact industrial-design surfaces remain reconstruction.'
  },
  keyboard: {
    name: 'Keyboard',
    category: 'human input',
    provenance: 'P4 repeated key geometry',
    description: 'Repeated key field representing the Selectric keyboard as a product-level input surface.'
  },
  keyboardMechanism: {
    name: 'Keyboard code mechanism',
    category: 'mechanical information processing',
    provenance: 'source-grounded six-channel topology + P4 repeated geometry',
    description: 'Character interposers feed six standard selector-bail channels before latch-bail sampling. The public key-to-code assignment is P5 until one exact keyboard/typeball layout is frozen.'
  },
  platen: {
    name: 'Platen',
    category: 'paper / print',
    provenance: 'P0/P2 metric anchor',
    description: '36.3728 mm platen diameter anchor. Axis placement remains P4 pending complete D6→D7→D8→D4 solve.'
  },
  platenRatchet: {
    name: '27-tooth platen ratchet',
    category: 'paper / line index',
    provenance: 'IBM shared Selectric diameter + OEM 7X1 representative 27T profile + P4 tooth shape',
    description: '30.1498 mm ratchet outer diameter with 27 equal angular positions. The public tooth shape is reconstructive; one normal index advances one tooth.'
  },
  paperFeed: {
    name: 'Paper feed / bail / copy-control system',
    category: 'paper transport',
    provenance: 'source-grounded topology/state coupling + P4 centers and local dimensions + P5 unsourced copy-control offsets',
    description: 'Four front and four rear feed rollers couple paper to the platen through a deflector path; the bail has two laterally adjustable rollers. Paper release disengages both feed-roll banks together. Five-position copy control moves the platen plus entire paper-feed carriage front/rear while leaving the carrier/typehead fixed. Exact copy offsets and local dimensions remain unresolved.'
  },
  printShaft: {
    name: 'Print shaft · IBM 1164736',
    category: 'primary frame',
    provenance: 'exact active part identity + P4 visible section',
    description: 'D6 axis. Current IBM 1164740 bearing geometry is exact-part interchange evidence; shaft journal and installed coordinates remain reconstruction.'
  },
  d6CurrentSet: {
    name: 'Current D6 compatibility set',
    category: 'primary frame',
    provenance: 'OEM current-level identities + P4 unresolved sections',
    description: 'Current 7X1 D6 package: IBM 1164736 shaft, IBM 1164740 bearings, IBM 1164739 gear and market-dependent item-51 C-clip (US 1175220 / WT 6520762). Exact gear and ring geometry remain unresolved.'
  },
  bearing: {
    name: 'D6 bearing · IBM 1164740',
    category: 'primary frame',
    provenance: 'exact-part federal interchange geometry',
    description: '15.875 mm spherical outer diameter, 9.5377 mm bore, 9.398 mm length. Bearing bore is not treated as a shaft-journal claim.'
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
    description: 'Carrier rides the D6/front support and rack/shoe rear support and translates across the 8.5-inch writing line. The public geometry uses an open P4 frame so sleeve, rocker, ribbon and rear-support interfaces remain inspectable.'
  },
  sleeve: {
    name: 'Print sleeve · IBM 1141628',
    category: 'carrier / print',
    provenance: 'exact active part identity + topology-grounded P4 dimensions',
    description: 'Later/new-style sleeve with ribbon-lift cam, IBM 1164240 combined feed/detent cam and IBM 1124174 double print/restoring cam in sourced left-to-right order.'
  },
  rearSupport: {
    name: 'Level-2 rear carrier support',
    category: 'carrier support',
    provenance: 'source-grounded topology + P4 local sections',
    description: 'Upper shoe, shared eccentric/support plate, lower shoe and leaf spring preserve the documented Level-2 force path against the fixed rack.'
  },
  escapementBracket: {
    name: 'Escapement bracket',
    category: 'escapement',
    provenance: 'source-grounded parentage + P4 section',
    description: 'Carrier-parented bracket above the fixed rack. The active Level-2 bracket/tab clearance constraint remains 0.254–0.3048 mm.'
  },
  fineAlignment: {
    name: 'Tilt / rotate fine-alignment detents',
    category: 'selection / print alignment',
    provenance: 'OEM service-theory topology and ordering + P4 local geometry + P5 animation phasing',
    description: 'Coarse tilt/rotate selection deliberately hands off to carrier-local detents before impact. Tilt detenting seats first in the modeled causal sequence; rotate detenting follows. Exact pivots, notch dimensions and event angles remain unresolved.'
  },
  typeball: {
    name: 'Selectric type element',
    category: 'selection / print',
    provenance: 'IBM overall scale + convergent P4 functional-CAD seed',
    description: 'Four bands × 22 positions = 88-character structural model with boss, skirt and repeated surface-normal type-slug cues tangent to the P4 structural ellipsoid; glyph-face sections remain unresolved and this is not factory CAD.'
  },
  selection: {
    name: 'Selection transmission',
    category: 'mechanical information processing',
    provenance: 'source-grounded weighted differential topology + width-specific 7X1 identities + P4 linkage/path geometry',
    description: 'Two weighted tilt inputs, three positive rotate inputs plus the five-unit negative baseline drive gearless-tilt and rotate tape paths. Tape geometry updates with carrier travel while type-element selection remains invariant under carrier x.'
  },
  ribbon: {
    name: 'Fabric ribbon system',
    category: 'inking',
    provenance: 'active fabric-ribbon branch + P4 path',
    description: 'Twin-spool fabric ribbon presentation with lift coupled to the fine-align/print portion of the character cycle.'
  },
  horizontalMotion: {
    name: 'Writing-line racks / cords',
    category: 'horizontal transport',
    provenance: 'exact rack identities + source-grounded cord topology + P4 path geometry',
    description: 'Fixed margin/tab racks and opposed carrier cords share the writing coordinate. Rightward motion is mainspring-powered; carrier return winds the return cord and tightens the mainspring.'
  },
  mainspringCordSystem: {
    name: 'Mainspring / opposed cord system',
    category: 'horizontal transport energy',
    provenance: 'source-grounded energy and tension topology + P4 drum/spring/arm geometry',
    description: 'Escapement/tab and carrier-return cords wind in opposition on the common escapement shaft. A right-side pivoting pulley arm with two spiral springs maintains tension while the mainspring supplies ordinary rightward carrier energy.'
  },
  returnTabDrive: {
    name: 'Carrier-return drive / tab governor',
    category: 'horizontal transport control',
    provenance: 'source-grounded sustained-return and governor topology + P4 gear/clutch geometry',
    description: 'Carrier return receives a finite operational-cam trigger then persists through a spring clutch/pinion/escapement-shaft drive. Tab is mainspring-propelled; its operational-shaft coupling is a speed governor only.'
  },
  backspaceLinkage: {
    name: 'Dedicated 12P backspace linkage',
    category: 'horizontal transport',
    provenance: 'OEM 7X1 12P rack-family identity + source-grounded linkage topology + P4 local geometry',
    description: 'Backspace uses its own powered bellcrank/intermediate-lever/rack path rather than reversing ordinary escapement. IBM 1124568 and 6519139 are documented 7X1 12P rack-family identities; exact serial-level installed part remains unresolved.'
  },
  drive: {
    name: 'Drive / operational shafts',
    category: 'power',
    provenance: 'source-grounded shaft topology + P4 placement',
    description: 'Motor, cycle shaft, operational shaft and visible cams establish the powerframe reading. Character cycle rotates the cycle shaft 180° and print sleeve 360°.'
  },
  paper: {
    name: 'Paper / impression field',
    category: 'print output',
    provenance: 'P5 browser presentation on P4 paper path',
    description: 'Presentation sheet records typed characters at the current carrier/line position. The visual text field is not a claim about IBM paper-handling typography.'
  }
});
