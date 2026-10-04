# IBM Selectric 721 — interactive engineering specimen

Public constructive projection of `specimen:ibm-selectric-721`.

This is a source-aware mechanical reconstruction of an original IBM Selectric Model 721 representative profile:

- 7X1 width class;
- 8.5-inch writing line;
- 12 CPI representative pitch;
- fabric ribbon;
- later/new-style Series 72 representative print mechanism;
- gearless tilt;
- NRB/S backspace branch;
- local Level-2 carrier-support geometry.

## Current public tranche

The browser model currently includes:

- product shell / keyboard / platen / 27-tooth representative ratchet / four-front-plus-four-rear feed rollers / two-roller paper bail / paper;
- D6 print shaft, current IBM 1164740 bearing family, IBM 1164739 gear envelope and market-unfrozen item-51 C-clip presentation;
- IBM 1124109 fixed 12P rack with repeated pitch geometry;
- carrier translating over the 215.9 mm writing line;
- Level-2 upper/lower rear shoe topology;
- carrier-parented escapement bracket and pawl cue;
- IBM 1141628 print sleeve;
- ribbon-lift -> IBM 1164240 -> IBM 1124174 cam-stack order;
- 88-position structural type-element model;
- 7X1 gearless tilt and rotate tape presentation;
- cycle and operational shafts, cams, motor and belt cues;
- fabric-ribbon lift;
- paper output that records typed characters;
- deterministic character-cycle ordering through code setup, selection, fine align, impact, escapement and clutch check;
- fixed escapement/margin/tab rack families and opposed carrier-cord presentation;
- space, backspace, mainspring-style tab destination, carrier return + index, shift hemisphere and paper index;
- assembled / exploded inspection and click-to-inspect provenance;
- a centered P5 startup carrier pose for immediate type-element visibility; carrier return still terminates at the left writing margin.

## Provenance boundary

Exact source-backed dimensions are retained where available.

Unresolved hidden coordinates and sections use explicit P4 constructive reconstruction. The visible browser model is not IBM production CAD.

The temporary browser key-to-typeball-slot map is P5 presentation. It exercises the canonical selection coordinate ranges—4 tilt bands, signed rotate units -5..+5, and the independent 180-degree shift hemisphere—without claiming one specific physical typeball character layout.

## Deterministic QA

The page exposes `window.__selectricDebug`.

The Playwright smoke test checks:

- gallery registration;
- finite geometry;
- current carrier-support and print-sleeve topology metadata;
- one character = one 12-CPI carrier pitch;
- impact before escapement advance;
- explosion independence;
- space / backspace;
- shift hemisphere;
- one-tooth 27T paper index;
- tab capture on the writing lattice;
- carrier return to left margin plus one index;
- browser error absence.

This remains an active build. Visual/mechanical refinement continues before Taria can close the public-projection milestone.
