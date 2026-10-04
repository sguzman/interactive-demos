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

- product shell / keyboard / platen / 27-tooth representative ratchet / four-front-plus-four-rear feed rollers / common-shaft coupled paper release / five-position copy-control carriage motion / two-stable-state two-roller paper bail / platen-variable decoupling / paper;
- D6 print shaft, current IBM 1164740 bearing family, IBM 1164739 gear envelope and market-unfrozen item-51 C-clip presentation;
- IBM 1124109 fixed 12P rack with repeated pitch geometry;
- carrier translating over the 215.9 mm writing line;
- Level-2 upper/lower rear shoe topology;
- carrier-parented escapement bracket and pawl cue;
- IBM 1141628 print sleeve;
- ribbon-lift -> IBM 1164240 -> IBM 1124174 cam-stack order;
- 88-position structural type-element model;
- distinct coarse selection and carrier-local tilt/rotate fine-alignment detents, with source-order-preserving P5 engagement/release phasing;
- 7X1 gearless tilt and rotate tape presentation driven by the source-backed normalized 1:2 tilt weighting, staged 1:2:2 rotate weighting and signed five-unit balance, with a carrier-sweep constant-length presentation path;
- cycle and operational shafts, cams, motor and belt cues;
- new-style fabric-ribbon lift with stencil / low / middle / high print states, a distinct threading/load pose, stencil feed lockout/centering, source-ordered bidirectional feed, and automatic reversal; unresolved heights/capacity remain explicitly P5 while the OEM trigger -> feed/reverse-plate pivot -> pawl/check transfer sequence is preserved;
- paper output that records typed characters;
- deterministic character-cycle ordering through code setup, selection, fine align, impact, escapement and clutch check;
- fixed escapement/margin/tab rack families, physical left/right margin stops, opposed carrier cords, common escapement-shaft drums, mainspring cue, spring-loaded right tension arm, sustained carrier-return clutch/pinion drive and non-propulsive tab governor;
- dedicated 7X1 12P backspace rack/bellcrank presentation rather than reverse-escapement shorthand;
- clutched 180° space/backspace service-cam actions, mainspring-style tab destination, carrier return + index, animated 180° shift-cam transition with character-cycle interlock, and animated 360° index-cam/pawl action;
- assembled / exploded inspection and click-to-inspect provenance;
- a centered P5 startup carrier pose for immediate type-element visibility; carrier return still terminates at the left writing margin.

## Provenance boundary

Exact source-backed dimensions are retained where available.

Unresolved hidden coordinates and sections use explicit P4 constructive reconstruction. The visible browser model is not IBM production CAD.

The temporary browser key-to-typeball-slot map is P5 presentation. It now assigns 44 base tilt/rotate positions and pairs them across the two hemispheres, so lower/upper letter pairs preserve the same tilt/rotate coordinates and request the independent 180-degree shift mechanism when needed. The six public code bits are coherent with the modeled T1/T2/R1/R2/R2A/five-unit inputs. This still does not claim one specific factory typeball character layout.

## Deterministic QA

The page exposes `window.__selectricDebug`.

The Playwright smoke test checks:

- gallery registration;
- finite geometry;
- current carrier-support and print-sleeve topology metadata;
- one character = one 12-CPI carrier pitch;
- impact before escapement advance;
- ribbon selector modes, stencil feed lockout/centering, distinct load pose, and automatic fabric-ribbon reversal through the animated reverse sequence;
- explosion independence;
- space / backspace;
- shift hemisphere;
- one-tooth 27T paper index;
- tab capture on the writing lattice;
- carrier return to left margin plus one index;
- browser error absence.

This remains an active build. Visual/mechanical refinement continues before Taria can close the public-projection milestone.
