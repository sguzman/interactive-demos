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

- product shell / keyboard / platen / 27-tooth representative ratchet / visibly embodied single-vs-double line-spacing selector (one or two ratchet teeth per index; selector travel P5 while mode/function is source-backed) / P2 paper advance derived from platen arc length while feed rolls are engaged / four-front-plus-four-rear feed rollers with visible P4 phase cues driven from the same paper-advance state / common-shaft coupled paper release with manual sheet alignment available only while the feed rolls are released (public +/- uses a P5 2 mm inspection increment and leaves platen/ratchet plus disengaged feed-roll phase unchanged) / five-position copy-control carriage motion with a visible P5 five-detent marker arc and shaft-parented eccentric collars that rotate with the selector shaft / two-stable-state paper bail with independently adjustable P5 roller positions and passive P4-radius roller rotation only while the bail contacts the moving sheet / platen-variable decoupling with manual rotation, persistent re-coupled phase offset, and visible P5 platen-knob phase cues that continue with the physical platen while the ratchet is free / paper;
- D6 print shaft, current IBM 1164740 bearing family, IBM 1164739 gear envelope and market-unfrozen item-51 C-clip presentation;
- IBM 1124109 fixed 12P rack with repeated pitch geometry;
- carrier translating over the 215.9 mm writing line, with the writing-position pointer parented to the carrier so it tracks the fixed 12-CPI rule;
- Level-2 upper/lower rear shoe topology;
- carrier-parented escapement bracket and pawl cue;
- IBM 1141628 print sleeve;
- ribbon-lift -> IBM 1164240 -> IBM 1124174 cam-stack order;
- 88-position structural type-element model constrained by the 34.925 mm nominal element diameter, with four × 22 repeated surface-normal slug cues, a recognizable P4 black interchangeable-element top cap/release latch, and chrome-like slug/skirt finish continuous with the element shell instead of the earlier black checkerboard blocks; visible tilt/rotate remains aligned to the same structural lattice (11 base rotate coordinates plus the independent 180° shift hemisphere) and anchored to the reconstruction's platen-facing -Z print side; diagnostics solve the selected slug normal and verify that it lands on that print-facing direction, while exact keyboard/glyph mapping and glyph-face sections remain unresolved;
- distinct coarse selection and carrier-local tilt/rotate fine-alignment detents, with source-order-preserving P5 engagement/release phasing;
- 7X1 gearless tilt and rotate tape presentation driven by the source-backed normalized 1:2 tilt weighting, staged 1:2:2 rotate weighting and signed five-unit balance, with carrier-sweep constant-length paths now embodied as flat P4 tape strips over separate stationary and carrier-local guide lanes rather than round cords through decorative pulley centers; exact production sheave coordinates remain unresolved;
- cycle and operational shafts, cams, motor and a P4 motor-to-cycle positive-drive belt solved onto the external tangents of the reconstructed 8T/29T pitch circles rather than routed through arbitrary top/bottom points; four explicitly P5 motion markers are advected along that solved loop from motor pitch-circle travel so the continuously moving belt is inspectable, while exact belt pitch and absolute pulley diameters remain unresolved;
- new-style fabric-ribbon lift with stencil / low / middle / high print states, a distinct threading/load pose, carrier-local lift guides and bridge that physically follow the live ribbon path, stencil feed lockout/centering plus no-ink paper-output behavior while mechanical impact remains live, source-ordered bidirectional feed, compressed P5 supply/take-up roll fullness transfer, and automatic reversal; unresolved heights/capacity remain explicitly P5 while the OEM trigger -> feed/reverse-plate pivot -> pawl/check transfer sequence is preserved;
- paper output that records typed characters, with paper-local vertical stamp placement now driven by the live sheet advance instead of a fixed logical-line pixel step, plus an explicit P4 paper-wrap surface registered to the platen so the visible sheet reaches the print region without claiming an exact hidden contact arc;
- deterministic character-cycle ordering through code setup, selection, fine align, impact, escapement and clutch check, with live geometry diagnostics measuring the selected slug face against the platen front surface so the print swing is checked for plausible approach instead of relying only on animation phase metadata;
- fixed escapement/margin/tab rack families, runtime-adjustable left/right margin stops settable at the live carrier column on the 12-CPI pitch, live right-margin line lock, programmable tab stops with set/clear behavior, opposed carrier cords, common escapement-shaft drums, mainspring cue, and a spring-loaded right tension arm now solved from carrier position so the visible escapement-cord free span plus reconstructed drum payout stays effectively constant across the writing line; sustained carrier-return clutch/pinion drive and non-propulsive tab governor;
- dedicated 7X1 12P backspace rack/bellcrank presentation rather than reverse-escapement shorthand;
- clutched 180° space/backspace service-cam actions, including filter-shaft-style storage of a space request made during an active character cycle and release immediately after character escapement; mainspring-style tab destination, carrier return + index, animated 180° shift-cam transition with character-cycle interlock, and animated 360° index-cam/pawl action;
- assembled / exploded inspection plus dedicated carrier/typeball, selection, ribbon/print, paper/platen, rack/support and powerframe inspection views, with click-to-inspect provenance; runtime artifacts capture every dedicated mechanism view; rack/support uses an open-machine camera, while powerframe now applies an inspection-only P5 cutaway that removes shell/keyboard occluders without moving the mechanical assemblies and restores them on exit;
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
- type-element 4×22 structure, 34.925 mm nominal diameter anchor, P4 top-cap/latch presentation, chrome-like slug finish and platen-facing selected-slug alignment;
- flat tilt/rotate selection-tape cross-sections, explicit stationary/carrier guide counts and carrier-sweep length invariants;
- powerframe inspection cutaway hides only shell/keyboard occluders and restores both when returning to the product view;
- current carrier-support and print-sleeve topology metadata;
- one character = one 12-CPI carrier pitch, with the writing-position pointer following the same carrier coordinate;
- impact before escapement advance, with the impact screenshot now captured after the actual PRINT_IMPACT threshold and a live selected-slug/platen clearance sanity bound;
- ribbon selector modes, stencil feed lockout/centering, stencil impact without an ink record on ordinary paper output, distinct load pose, supply/take-up roll fullness transfer, and automatic fabric-ribbon reversal through the animated reverse sequence;
- explosion independence;
- space / backspace, including stored-space interlock release after an active character cycle;
- adjustable margin-stop positions, including public set-left / set-right-at-carrier / reset controls, right-margin line lock and carrier return to the live left stop;
- programmable tab-stop set/clear plus capture at the next active stop;
- shift hemisphere;
- one-tooth single and two-tooth double 27T paper indexing, including the visibly embodied selector state and P2 physical sheet advance from platen radius × rotation;
- paper-path topology: textured output sheet plus a platen-registered P4 wrap surface with its exact hidden contact arc explicitly unresolved; typed marks use live sheet advance for paper-local vertical spacing while the browser texture scale remains explicitly P5;
- paper-release decoupling: platen rotation leaves sheet position and feed-roll phase unchanged while both feed-roll banks are released; released-sheet manual alignment can move the paper independently, freezes disengaged feed-roll phase, leaves platen/ratchet phase unchanged, and uses explicitly P5 public increments;
- paper-bail roller adjustment: two rollers remain independently movable laterally, with exact travel explicitly P5; while engaged, their visible phase follows sheet travel using the reconstructed P4 roller radius and freezes when the bail is released;
- platen-variable manual rotation: public +/- controls leave ratchet phase fixed while free, advance paper only when feed is engaged, and preserve the new platen phase offset after re-coupling;
- tab capture on the writing lattice;
- carrier-cord tension compensation: carrier travel changes the solved spring-arm angle while the P4 free-span + drum-payout length residual stays near zero;
- carrier return to left margin plus one index;
- browser error absence.

This remains an active build. Visual/mechanical refinement continues before Taria can close the public-projection milestone.
