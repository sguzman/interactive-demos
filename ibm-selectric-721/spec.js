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
  platen: {
    y: 126,
    z: -92,
    length: 296,
    knobP4: {
      centerHalfSpanMm: 159,
      coreLengthMm: 28,
      coreRadiusMm: 12.8,
      outerCapLengthMm: 3.4,
      outerCapRadiusMm: 13.7,
      outerCapCenterOffsetMm: 14.8,
      gripRibCount: 12,
      gripRibAxialLengthMm: 22,
      gripRibThicknessMm: 1.25,
      gripRibDepthMm: 2.15,
      gripRibRadialOffsetMm: 13.35
    }
  },
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
  keyboard: {
    y: 43,
    z: 78,
    assemblyExplodeVectorP5: { x: 0, y: -46, z: 155 },
    mechanismExplodeVectorP5: { x: 0, y: -78, z: 62 },
    deckP4: {
      widthMm: 340,
      heightMm: 17,
      depthMm: 142,
      slopeDeg: 7
    },
    frontApronP4: {
      widthMm: 346,
      heightMm: 20,
      depthMm: 42,
      y: 32,
      z: 139,
      slopeDeg: 11
    },
    keycapP4: {
      ordinaryWidthMm: 18,
      heightMm: 8,
      depthMm: 17,
      faceSlopeDeg: -8
    },
    horizontalCalibrationP4: {
      sharedPitchMm: 21.2422,
      pitchSensitivityEnvelopeMm: [21.2089, 21.2695],
      pitchSensitivitySpanMm: 0.0606,
      rowOffsetsMm: [-1.8871, -13.6235, -8.6899, 1.8819],
      sourceClass:
        'direct native-pixel Q1/Q4 repeated key-top centers; shared horizontal fit stable across accepted and anchor-ablation camera scenarios; vertical row registration remains unresolved',
      promotionClass:
        'U-GEO-006 camera-robust horizontal P4 promotion only; row Y/Z, deck/service keys, spacebar and cameras remain diagnostic'
    },
    characterRowsP4: [
      { centerY: 55.0, centerZ: 47, spacingX: 21.2422, offsetX: -1.8871, count: 12 },
      { centerY: 52.2, centerZ: 69, spacingX: 21.2422, offsetX: -13.6235, count: 10 },
      { centerY: 49.4, centerZ: 92, spacingX: 21.2422, offsetX: -8.6899, count: 10 },
      { centerY: 46.6, centerZ: 116, spacingX: 21.2422, offsetX: 1.8819, count: 10 }
    ],
    serviceColumnXP4: 137.5,
    serviceColumnClearanceP4: {
      cheekInnerXP4: 156,
      cheekBevelInsetP4: 1.8,
      minimumGapP4: 0.7,
      widestServiceKeyMm: 32,
      class:
        'P4 topology repair: symmetric service-key column moved inboard until the widest nominal cap clears the fixed cheek inner bevel; not an IBM production registration'
    },
    serviceKeysP4: {
      topologyClass:
        'Q4-native topology repair: internal row-aligned service caps are distinct from outer side controls; RETURN is a two-row spanning special',
      left: [
        { label: 'TAB', centerY: 52.2, centerZ: 69, widthMm: 24, rowAssociation: 'qwerty' },
        { label: 'LOCK', centerY: 49.4, centerZ: 92, widthMm: 24, rowAssociation: 'home' },
        { label: 'SHIFT', centerY: 46.6, centerZ: 116, widthMm: 28, rowAssociation: 'lower' }
      ],
      right: [
        { label: 'BACK SPACE', centerY: 55, centerZ: 47, widthMm: 28, rowAssociation: 'number' },
        {
          label: 'RETURN',
          centerY: 50.8,
          centerZ: 80.5,
          widthMm: 32,
          depthMm: 40,
          rowAssociation: 'qwerty-home-spanning'
        },
        { label: 'SHIFT', centerY: 46.6, centerZ: 116, widthMm: 28, rowAssociation: 'lower' }
      ]
    },
    externalSideControlsP4: {
      columnAbsX: 169,
      sourceClass:
        'direct native Q4 topology; metric placement is constructive P4 inside the fixed side-cheek band, not IBM production registration',
      sideBandP4: {
        cheekInnerX: 156,
        cheekOuterX: 182,
        nominalControlWidthMm: 22,
        innerGapMm: 2,
        outerGapMm: 2
      },
      left: [
        { label: 'MAR REL', controlClass: 'single-cap', centerY: 55, centerZ: 47, widthMm: 22, depthMm: 18 },
        { label: 'CLR SET', controlClass: 'two-label-rocker', centerY: 49.4, centerZ: 104, widthMm: 22, depthMm: 52 }
      ],
      right: [
        { label: 'INDEX', controlClass: 'single-cap', centerY: 55, centerZ: 47, widthMm: 22, depthMm: 18 },
        { label: 'ON OFF', controlClass: 'two-label-rocker', centerY: 49.4, centerZ: 104, widthMm: 22, depthMm: 52 }
      ]
    },
    spacebarP4: { centerX: -2, centerY: 44, centerZ: 136, widthMm: 112, depthMm: 18 },
    photoProjectedWidthSeeds: {
      fullKeyControlOpeningFractionApprox: [0.70, 0.71],
      ordinaryAlphanumericFieldFractionApprox: [0.62, 0.63],
      sourceClass:
        'CAL-F1/CAL-Q4 normalized image-space landmarks; perspective/crop affected and not direct physical-span targets'
    },
    registrationClass:
      'U-GEO-006 horizontal character-row pitch/X registration promoted from direct native Q1/Q4 evidence; service-control topology repaired from native Q4; vertical metric row/deck/service/spacebar registration and camera closure remain unresolved'
  },
  motor: { x: -116, y: 39, z: 42 },
  writingLineRacks: { marginY: 68, marginZ: -80, tabY: 61, tabZ: -86, length: 245 },
  cordSystem: { shaftY: 55, shaftZ: -8, drumRadius: 10, leftPulleyX: -142, rightPulleyX: 142 },
  shell: {
    baseY: 12,
    keyboardDeckY: 44,
    rearDeckY: 88,
    cheekInnerXP4: 156,
    cheekOuterXP4: 182,
    cheekBevelInsetP4: 1.8,
    serviceCoverSideClearanceP4: 2.7,
    cheekProfileP4: [
      { z: 162, y: 22 },
      { z: 162, y: 42 },
      { z: 150, y: 50 },
      { z: 128, y: 56 },
      { z: 103, y: 66 },
      { z: 76, y: 78 },
      { z: 52, y: 91 },
      { z: 32, y: 106 },
      { z: 15, y: 119 },
      { z: -16, y: 135 },
      { z: -55, y: 147 },
      { z: -102, y: 148 },
      { z: -143, y: 132 },
      { z: -163, y: 102 },
      { z: -166, y: 22 }
    ],
    serviceCoverPivotP4: { x: 0, y: 122, z: -142 },
    serviceCoverGeometryOffsetP4: { x: 0, y: -122, z: 142 },
    serviceCoverStationsP4: [
      { z: 38, halfWidth: 149.0, bottomY: 70, topY: 85 },
      { z: 18, halfWidth: 150.0, bottomY: 73, topY: 92 },
      { z: -8, halfWidth: 151.0, bottomY: 78, topY: 106 },
      { z: -34, halfWidth: 151.5, bottomY: 84, topY: 129 },
      { z: -58, halfWidth: 151.5, bottomY: 93, topY: 144 },
      { z: -72, halfWidth: 151.0, bottomY: 104, topY: 149 }
    ],
    badgeP4: {
      localToCoverPivot: { x: 0, y: -18, z: 154 },
      widthMm: 30,
      heightMm: 8,
      depthMm: 2,
      rotationXDeg: -31,
      mountingClass:
        'U-GEO-020 unresolved P4 mounting seed; current box is diagnostically detached from the reconstructed cover and must not be treated as a fixed physical anchor'
    },
    writingRuleP4: {
      center: { x: 0, y: 82, z: 30 },
      widthMm: 268,
      heightMm: 6,
      depthMm: 5,
      tickY: 84,
      tickZ: 27.2
    },
    stageBClass:
      'shared P4 shell/control parameter seed for U-GEO-020; values preserve the pre-parameterization public geometry and are not production CAD'
  },
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
    provenance: 'P4 surface reconstruction constrained by product envelope + P4 hood/cheek assembly-clearance repair + P5 inspection-only cover/base separation',
    description: 'Recognizable 7X1 Selectric exterior reconstruction. The hinged service hood is now nested inside the beveled fixed side-cheek envelope with explicit positive P4 clearance, replacing the earlier intersecting surfaces that produced closed-cover z-fighting. In exploded inspection the broad base shell separates downward independently from the outer cover/cheeks lifting up and rearward. Exact industrial-design surfaces and production seam widths remain reconstruction.'
  },
  keyboard: {
    name: 'Keyboard',
    category: 'human input',
    provenance: 'P4 repeated tapered/beveled key geometry + P5 actuation travel',
    description: 'Repeated Selectric keyboard field with labeled three-stage tapered keycaps instead of cuboid blocks. The cap section is constructive P4 rather than factory tooling, while the existing key-depression behavior remains the live input presentation.'
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
    provenance: 'IBM shared Selectric diameter + OEM 7X1 representative 27T profile + asymmetric tapered P4 tooth reconstruction + pivoted/circumference-constrained P4 index-pawl reconstruction',
    description: '30.1498 mm ratchet outer diameter with 27 equal angular positions. The public teeth use an asymmetric tapered P4 ratchet silhouette rather than plain boxes. The index pawl is an explicit tapered/chamfered P4 stamped-link arm rotating about its own reconstructed pivot pin with a separate tooth-contact tip; its rest geometry is constrained to the reconstructed ratchet circumference rather than passing through the hub. One normal index advances one tooth; exact production tooth flank/profile, pawl stamping and pawl travel remain unresolved.'
  },
  paperFeed: {
    name: 'Paper feed / bail / copy-control system',
    category: 'paper transport',
    provenance: 'source-grounded topology/state coupling + P4 centers/local dimensions, pinned control links and platen-knob grip reconstruction + P5 unsourced copy-control offsets',
    description: 'Four front and four rear feed rollers couple paper to the platen through a deflector path; the bail has two laterally adjustable rollers and its two end levers now read as Y/Z-plane stamped plates instead of cuboid sticks. Paper release disengages both feed-roll banks together and its external control is a pivoted stamped lever; the single/double line-spacing selector is likewise an explicit pivoted stamped arm plus two-eye link. The platen knobs retain constructive P4 reduced cores, outer caps and repeated radial grip ribs. Five-position copy control moves the platen plus entire paper-feed carriage front/rear while leaving the carrier/typehead fixed, with a pivoted stamped external lever. Exact lever stampings, pivots, copy offsets, knob tooling/knurl geometry and remaining local dimensions remain unresolved.'
  },
  printShaft: {
    name: 'Print shaft · IBM 1164736',
    category: 'primary frame',
    provenance: 'exact active part identity + P4 visible section + P4 open primary-sideframe/lower-shaft support reconstruction',
    description: 'D6 axis. Current IBM 1164740 bearing geometry is exact-part interchange evidence. The two primary sideframes now use large-window chamfered P4 perimeter frames instead of solid slabs. D6 retains its bearing plate, while the cycle/operational shafts pass through four aligned P4 sideframe-local bearing bosses tied to the lower perimeter by explicit support webs. Exact IBM casting apertures/sections, lower-shaft bearing identities, shaft journal and installed coordinates remain reconstruction.'
  },
  d6CurrentSet: {
    name: 'Current D6 compatibility set',
    category: 'primary frame',
    provenance: 'OEM current-level identities + P4 toothed gear/hub envelope + P4 unresolved sections',
    description: 'Current 7X1 D6 package: IBM 1164736 shaft, IBM 1164740 bearings, IBM 1164739 gear and market-dependent item-51 C-clip (US 1175220 / WT 6520762). The public 1164739 envelope now uses a separate hub and a toothed P4 silhouette instead of a smooth cylinder; the displayed 24-tooth count is explicitly presentation-only, not a production tooth-count claim. Exact gear module/profile/tooth count and ring geometry remain unresolved.'
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
    provenance: 'P4 constructive geometry with windowed/chamfered side-frame refinement + corrected Y/Z-plane print bellcrank + forked print-rocker/yoke reconstruction',
    description: 'Carrier rides the D6/front support and rack/shoe rear support and translates across the 8.5-inch writing line. The public geometry uses chamfered windowed P4 side plates plus crossmembers instead of solid side walls. The 1124174 follower output now passes through a two-arm P4 bellcrank whose working arms lie in the Y/Z sweep plane around an explicit X-axis pivot, and the type-element rocker is an explicit forked yoke with pivot hub, paired Y/Z arms and cradle pin/stem. Exact carrier-frame, bellcrank and rocker-casting sections remain unresolved.'
  },
  sleeve: {
    name: 'Print sleeve · IBM 1141628',
    category: 'carrier / print',
    provenance: 'exact active part/cam identities + sourced stack order + smooth P4 radial cam envelopes + P4 follower/bellcrank geometry + P5 event envelopes',
    description: 'Later/new-style sleeve with ribbon-lift cam, IBM 1164240 combined feed/detent cam and IBM 1124174 double print/restoring cam in sourced left-to-right order. The reconstruction now gives all three smooth constructive cam silhouettes and makes their downstream outputs visible through embodied followers/linkages rather than parallel cycle animations. These radial envelopes are P4 visual/mechanical reconstructions, not exact IBM production cam sections.'
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
    provenance: 'OEM service-theory topology and ordering + IBM 1164240 cam identity + P4 local cam/follower geometry + P4 stamped-link detent-arm reconstruction + P5 event-angle envelope',
    description: 'Coarse tilt/rotate selection deliberately hands off to carrier-local detents before impact. The rotating print sleeve drives a visible P4 1164240 cam-lobe cue and one roller/yoke follower; tilt takes up first and rotate follows through explicit P5 lost motion. The two detent levers now use tapered/chamfered P4 plate geometry with explicit pivot holes and pins instead of rectangular bars. Exact lever stampings, pivots, notch dimensions, cam profile, follower throw and event angles remain unresolved.'
  },
  typeball: {
    name: 'Selectric type element',
    category: 'selection / print',
    provenance: 'IBM 1⅜-inch overall-diameter anchor + convergent P4 functional-CAD seed + P4 cap/latch and beveled slug-section reconstruction',
    description: 'Four bands × 22 positions = 88-character structural model constrained by the 34.925 mm nominal diameter, with a recognizable black interchangeable-element top cap/release-latch cue, chrome-like skirt, and repeated surface-normal type-slug cues tangent to the P4 structural ellipsoid. Each slug cue now uses a three-stage beveled pedestal/shoulder/face-land section instead of a plain block, improving the physical reading without claiming exact glyph-face or factory slug geometry. Visible tilt/rotate orientation lands on the same 4×22 structural lattice (11 base rotate coordinates plus the independent 180° shift hemisphere); exact cap sections, keyboard/glyph assignment and glyph-face sections remain unresolved.'
  },
  selection: {
    name: 'Selection transmission',
    category: 'mechanical information processing',
    provenance: 'source-grounded weighted differential topology and hole ratios + width-specific 7X1 identities + P4 stamped-link/flat-tape geometry',
    description: 'Two weighted tilt inputs, three positive rotate inputs and the physically separate five-unit negative baseline now act through visible floating differential plates rather than decorative sliding bars. The P4 plates preserve the source-fixed tilt 0/1/3, rotate 0/2/3 and 0/3/5, and signed-balance midpoint hole ratios; endpoint displacement rotates/translates each lever and the tilt output remains an explicit double vertical link. The negative-five bail rises into the opposite balance-lever side instead of numerically flipping sign. Flat 7X1 tape strips continue over separate stationary/carrier P4 guide lanes with carrier-sweep length invariance. Absolute lever spans, stampings, pivots and production sheave coordinates remain reconstructed/unresolved.'
  },
  ribbon: {
    name: 'Fabric ribbon system',
    category: 'inking',
    provenance: 'active fabric-ribbon branch + source-ordered print-sleeve lift/feed topology + IBM 1164240 feed/detent cam identity + corrected Y/Z-plane P4 follower/bellcrank/forked-guide/path/spool geometry + P5 cam envelopes and compressed wound-pack fullness',
    description: 'Twin-spool fabric ribbon presentation with two explicit print-sleeve-driven paths: the ribbon-lift cam drives an embodied follower and two-arm Y/Z-plane P4 bellcrank into forked carrier-local vibrator guides, while the IBM 1164240 feed lobe drives a second follower and two-arm Y/Z-plane P4 bellcrank into the feed plate, pawl and ratchet. Both bellcranks rotate about explicit X-axis pivot pins with working arms that actually sweep under the live rotation rather than axial arms. Each spool has fixed P4 hub/flanges and an independently scaling wound-ribbon pack with a visible phase marker; the two feed ratchets retain explicit alternating-radius P4 teeth. Threading/load remains a distinct service override above the print-lift range. Supply/take-up fullness transfers with feed direction and survives auto-reversal; exact cam profiles, lever lengths, event angles, lift heights, guide sections and physical ribbon capacity remain unresolved.'
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
    provenance: 'source-grounded energy/tension topology + solved P4 drum/spring/arm geometry + P4 pulley-tangent/wrap reconstruction',
    description: 'Escapement/tab and carrier-return cords wind in opposition on the common escapement shaft. The visible cords now meet guide/tension pulleys at solved P4 tangency points and follow sampled minor rim-wrap arcs rather than passing through pulley centers. The right-side pivoting pulley arm with two spiral springs is solved from live carrier position against the tangent-routed free span plus reconstructed drum payout. Exact IBM pivots, groove lanes, wrap direction and cord diameter remain unresolved.'
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
    provenance: 'OEM 7X1 12P rack-family identity + source-grounded linkage topology + pinned P4 stamped-link geometry',
    description: 'Backspace uses its own powered bellcrank/intermediate-lever/rack path rather than reversing ordinary escapement. The visible P4 bellcrank is now a two-arm pinned linkage rotating in its actual X/Y working plane, and the escapement pawl is a tapered stamped-link body with an explicit pivot pin instead of a rectangular block. IBM 1124568 and 6519139 remain the documented 7X1 12P rack-family identities; exact serial-level installed rack, link outlines, pivot centers and lever lengths remain unresolved.'
  },
  drive: {
    name: 'Drive / operational shafts',
    category: 'power',
    provenance: 'source-grounded shaft/service-cam topology and 8:29 positive-drive ratio + smooth P4 cycle/service-cam/motor/path geometry + pinned P4 cam-followers/contact sampling + P5 follower leverage',
    description: 'Motor, cycle shaft, operational shaft and clutched service cams establish the powerframe reading. The motor uses a constructive P4 barrel/endbell/rib/shaft/foot assembly rather than a featureless cylinder while preserving the same reconstructed working axis. The three visible cycle-shaft cam stations use smooth P4 radial envelopes in place of flattened cylinders; their station count/placement is retained, but exact IBM identities, functions and profiles are unresolved. The operational service cams likewise preserve the double-lobe space/backspace and single-lobe return/index and shift topology. Each service follower is now an explicit X-axis pivot, stamped Y/Z-plane lever and roller, with lift derived from the rotating P4 cam radius at the fixed roller contact line rather than a parallel sinusoid. Exact IBM follower stampings, pivots, profiles, roller contact geometry and leverage remain unresolved. The motor-to-cycle positive-drive belt follows an explicit P4 external-tangent solve between reconstructed pitch circles while preserving the source-backed 8:29 ratio; exact belt pitch and absolute pulley diameters remain unresolved. Character cycle rotates the cycle shaft 180° and print sleeve 360°.'
  },
  paper: {
    name: 'Paper / impression field',
    category: 'print output',
    provenance: 'P5 browser presentation on P4 paper path',
    description: 'Presentation sheet records typed characters at the current carrier/line position. The visual text field is not a claim about IBM paper-handling typography.'
  }
});
