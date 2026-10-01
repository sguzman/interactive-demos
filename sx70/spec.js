export const SX70 = {
  name: 'Polaroid SX-70',
  canonicalScope: 'original/manual-focus folding SX-70 SLR system',
  introductionYear: 1972,
  maximumApertureApprox: 'f/8',
  closeFocusApproxInches: 10.4,
  originalPackExposures: 10,
  originalPackVoltage: 6,
  mirrorSettleDelayMs: 40,
  mirrorSettleToleranceMs: 5
};

export const CANONICAL = {
  specimenId: 'specimen:polaroid-sx-70',
  worksExpressionId: 'expression:polaroid-sx-70-public-engineering-guide:en:v1',
  engineeringSyncDate: '2026-09-30',
  projectionState: 'published integrated specimen; true internal exploded model active',
  provenanceScheme: 'P0 primary · P1 measurement · P2 derived · P3 audited secondary · P4 reconstruction · P5 presentation',
  publicationBoundary: 'Public projection only. Geometry and animation tuned here do not become canonical Engineering facts.'
};

// Publication-level product-envelope anchors and visual reconstruction values are deliberately
// separate. The model below is P4/P5 constructive geometry, not factory CAD.
//
// Coordinate convention:
// x = camera left/right
// y = vertical
// z = rear/front, with negative z toward the photographer in the default view.
export const RECONSTRUCTION = {
  provenance: 'P4 reconstruction',
  envelopeMm: {
    width: 105,
    foldedDepth: 180,
    foldedHeightPresentation: 38
  },
  base: {
    width: 105,
    depth: 178,
    height: 21
  },
  body: {
    rearPanelWidth: 99,
    rearPanelHeight: 91,
    rearPanelThickness: 8,
    forwardPanelWidth: 96,
    forwardPanelHeight: 77,
    forwardPanelThickness: 7,
    lensHousingWidth: 79,
    lensHousingHeight: 49,
    lensHousingDepth: 26
  },
  openPose: {
    rearAngleDeg: 58,
    forwardAngleDeg: -18,
    lensAngleDeg: -23,
    viewfinderLiftMm: 20
  },
  foldedPose: {
    rearAngleDeg: 4,
    forwardAngleDeg: -3,
    lensAngleDeg: 3,
    viewfinderLiftMm: 0
  },
  articulation: {
    revision: 'articulated-v3',
    provenance: 'P4/P5 visual reconstruction; not measured production pivot geometry',
    rearBasePivotZ: -67,
    frontStandardPivotZ: 58,
    rearWallLength: 84,
    lensStandardHeight: 48,
    rearFoldedAngleDeg: 86,
    rearOpenAngleDeg: 32,
    lensFoldedAngleDeg: -88,
    lensOpenAngleDeg: -8,
    topCapFoldedAngleDeg: 0,
    topCapOpenAngleDeg: -7,
    bellowsHalfWidth: 42,
    sideRailX: 46,
    clearanceMmPresentation: 2.2
  },
  inspection: {
    provenance: 'P5 explosion spacing over P4 component placement',
    shellSpreadMm: 62,
    mechanismSpreadMm: 48,
    transportSpreadMm: 44
  },
  focus: {
    normalizedDefault: 0.55,
    frontElementTravelMmPresentation: 5.5
  }
};

export const COMPONENTS = {
  base: {
    id: 'sx70-base',
    name: 'Base / film-pack body',
    category: 'structure',
    provenance: 'P4 reconstruction',
    description: 'Thin lower body containing the film-pack well and much of the drive architecture. Exact public geometry is reconstructed.'
  },
  rearPanel: {
    id: 'sx70-rear-panel',
    name: 'Rear structural panel',
    category: 'folding structure',
    provenance: 'P4 reconstruction',
    description: 'Hinged structural member participating in erection and optical registration.'
  },
  forwardPanel: {
    id: 'sx70-forward-panel',
    name: 'Forward structural panel',
    category: 'folding structure',
    provenance: 'P4 reconstruction',
    description: 'Linked forward member supporting the front optical/shutter housing.'
  },
  lensHousing: {
    id: 'sx70-lens-shutter-housing',
    name: 'Lens / shutter housing',
    category: 'optics + control',
    provenance: 'mixed P0/P4',
    description: 'Contains the taking lens and shutter/exposure-control assembly. Functional identity is sourced; visible dimensions are reconstructed.'
  },
  takingLens: {
    id: 'sx70-taking-lens',
    name: 'Four-element taking lens',
    category: 'optics',
    provenance: 'P0 function / P4 geometry',
    description: 'Four-element glass objective with front-element focusing and approximately f/8 maximum aperture.'
  },
  bellows: {
    id: 'sx70-bellows',
    name: 'Bellows',
    category: 'light enclosure',
    provenance: 'P0 function / P4 geometry',
    description: 'Flexible opaque enclosure. It follows the rigid linkage and is not treated as the primary geometric locator.'
  },
  erectingLinks: {
    id: 'sx70-erecting-links',
    name: 'Erecting linkage',
    category: 'folding structure',
    provenance: 'P0 architecture / P4 geometry',
    description: 'Coupled linkage that establishes the erected camera geometry. Exact production link lengths and pivots remain unresolved.'
  },
  viewfinder: {
    id: 'sx70-viewfinder',
    name: 'Viewfinder / optical relay housing',
    category: 'optics',
    provenance: 'P0 function / P4 geometry',
    description: 'Housing for the off-axis viewing relay. Its public pose and envelope are reconstructive; the relay components are separately inspectable in the internal model.'
  },
  shutterBlades: {
    id: 'sx70-shutter-blades',
    name: 'Shutter blade pair',
    category: 'exposure mechanism',
    provenance: 'P0 function / P4 geometry',
    description: 'Coupled shutter blades controlling the taking aperture and a related photocell aperture. Exact production blade profile is not claimed.'
  },
  solenoid1: {
    id: 'sx70-solenoid-1',
    name: 'Solenoid #1',
    category: 'electromechanical control',
    provenance: 'P0 function / P4 geometry',
    description: 'Primary shutter-control electromagnet in the service sequence. Public dimensions and placement are reconstructive.'
  },
  motor: {
    id: 'sx70-motor',
    name: 'Cycle motor',
    category: 'electromechanical drive',
    provenance: 'P0 function / P4 geometry',
    description: 'DC motor driving the camera cycle through reduction gearing. Exact motor dimensions and speed remain unresolved.'
  },
  driveGearTrain: {
    id: 'sx70-drive-gear-train',
    name: 'Reduction / sequencing gear train',
    category: 'power transmission',
    provenance: 'P0 architecture / P4-P5 geometry',
    description: 'Presentation reconstruction of the reduction and sequencing train coupling the motor to the reflex, transport and recocking functions. Tooth counts are not production claims.'
  },
  sequencingCam: {
    id: 'sx70-sequencing-cam',
    name: 'Sequencing cam / timing member',
    category: 'mechanical control',
    provenance: 'P0 function / P4-P5 geometry',
    description: 'Cam-like sequencing member representing the mechanically timed handoffs documented in the service sequence. Exact production cam profile is unresolved.'
  },
  reflexCarrier: {
    id: 'sx70-reflex-carrier',
    name: 'Reflex / Fresnel carrier',
    category: 'optics + mechanism',
    provenance: 'P0 function / P4 geometry',
    description: 'Moving carrier that changes the camera between viewing and exposure optical states. Public pose geometry is reconstructive.'
  },
  fixedViewingMirror: {
    id: 'sx70-fixed-viewing-mirror',
    name: 'Fixed viewing mirror',
    category: 'optics',
    provenance: 'P0 function / P4 pose',
    description: 'Fixed mirror participating in the folded SLR viewing path. Exact production angle and coordinates remain reconstructive.'
  },
  relayOptics: {
    id: 'sx70-relay-optics',
    name: 'Viewfinder relay optics',
    category: 'optics',
    provenance: 'P0 function / P4 pose',
    description: 'Physical presentation of the unusual off-axis relay elements described in Polaroid optical literature.'
  },
  filmPack: {
    id: 'sx70-film-pack',
    name: 'Integral-film pack',
    category: 'film + power module',
    provenance: 'P0 function / P4 geometry',
    description: 'Ten-sheet pack serving simultaneously as media magazine, spring-loaded positioning system, battery carrier and processing-material input.'
  },
  packBattery: {
    id: 'sx70-pack-battery',
    name: 'Film-pack battery',
    category: 'electrical power',
    provenance: 'P0 function / P4 geometry',
    description: 'Flat nominal 6 V disposable battery carried by the original film pack and used to power the camera cycle.'
  },
  platen: {
    id: 'sx70-spring-platen',
    name: 'Spring platen',
    category: 'film positioning',
    provenance: 'P0 function / P4 geometry',
    description: 'Spring-loaded member biasing the film stack into the required presentation position.'
  },
  filmPick: {
    id: 'sx70-film-pick',
    name: 'Film pick',
    category: 'film transport',
    provenance: 'P0 function / P4 geometry',
    description: 'Mechanical pick that advances the top film unit toward the processing rollers.'
  },
  processingRollers: {
    id: 'sx70-processing-rollers',
    name: 'Processing roller pair',
    category: 'film transport + chemistry',
    provenance: 'P0 function / P4 geometry',
    description: 'Driven roller pair that captures and ejects the sheet while rupturing the reagent pod and metering the processing layer.'
  },
  movingFilm: {
    id: 'sx70-moving-film-unit',
    name: 'Film unit in transport',
    category: 'film transport',
    provenance: 'P0 function / P5 presentation geometry',
    description: 'Presentation of a film unit moving from pack to roller nip and out of the camera.'
  },
  frontDoor: {
    id: 'sx70-front-cover',
    name: 'Front cover / roller carrier',
    category: 'film transport',
    provenance: 'P0 function / P4 geometry',
    description: 'Front cover region associated with the processing-roll assembly and film exit.'
  }
};

export const PUBLIC_VIEWS = {
  overview: {
    label: 'Overview',
    ready: true
  },
  folding: {
    label: 'Folding',
    ready: true
  },
  internals: {
    label: 'Internals',
    ready: true
  },
  viewing: {
    label: 'Viewing optics',
    ready: true
  },
  exposure: {
    label: 'Exposure optics',
    ready: true
  },
  sequence: {
    label: 'Exposure sequence',
    ready: true
  },
  transport: {
    label: 'Film transport',
    ready: true
  },
  chemistry: {
    label: 'Film chemistry',
    ready: true
  }
};
