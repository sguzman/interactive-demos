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
  projectionState: 'public implementation tranche in progress',
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
    lensHousingWidth: 82,
    lensHousingHeight: 57,
    lensHousingDepth: 30
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
    description: 'Presentation envelope for the off-axis viewing relay; internal optical visualization is a later implementation task.'
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
  viewing: {
    label: 'Viewing optics',
    ready: false
  },
  exposure: {
    label: 'Exposure optics',
    ready: false
  },
  sequence: {
    label: 'Exposure sequence',
    ready: false
  },
  transport: {
    label: 'Film transport',
    ready: false
  },
  chemistry: {
    label: 'Film chemistry',
    ready: false
  }
};
