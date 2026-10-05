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

- product shell / keyboard with tapered three-stage P4 keycaps replacing cuboid caps while preserving labels and live key travel / platen / 27-tooth representative ratchet with asymmetric tapered P4 teeth instead of repeated cuboids / visibly embodied single-vs-double line-spacing selector (one or two ratchet teeth per index; selector travel P5 while mode/function is source-backed) / P2 paper advance derived from platen arc length while feed rolls are engaged / four-front-plus-four-rear feed rollers with visible P4 phase cues driven from the same paper-advance state / common-shaft coupled paper release with manual sheet alignment available only while the feed rolls are released (public +/- uses a P5 2 mm inspection increment and leaves platen/ratchet plus disengaged feed-roll phase unchanged) / five-position copy-control carriage motion with a visible P5 five-detent marker arc and shaft-parented eccentric collars that rotate with the selector shaft / two-stable-state paper bail with independently adjustable P5 roller positions and passive P4-radius roller rotation only while the bail contacts the moving sheet / platen-variable decoupling with manual rotation, persistent re-coupled phase offset, and visible P5 platen-knob phase cues that continue with the physical platen while the ratchet is free / paper;
- D6 print shaft, current IBM 1164740 bearing family, IBM 1164739 gear envelope and market-unfrozen item-51 C-clip presentation;
- IBM 1124109 fixed 12P rack with repeated pitch geometry;
- carrier translating over the 215.9 mm writing line, with the writing-position pointer parented to the carrier so it tracks the fixed 12-CPI rule; the carrier frame now uses chamfered windowed P4 side plates instead of solid rectangular walls, exposing the sleeve/ribbon/type-element mechanisms while keeping the same constructive envelope;
- Level-2 upper/lower rear shoe topology;
- carrier-parented escapement bracket and pawl cue;
- IBM 1141628 print sleeve;
- ribbon-lift -> IBM 1164240 -> IBM 1124174 cam-stack order;
- 88-position structural type-element model constrained by the 34.925 mm nominal element diameter, with four × 22 repeated surface-normal slug cues, a recognizable P4 black interchangeable-element top cap/release latch, and chrome-like slug/skirt finish continuous with the element shell instead of the earlier black checkerboard blocks; each slug cue now uses a beveled three-stage P4 pedestal/shoulder/face-land section rather than a plain cuboid. Visible tilt/rotate remains aligned to the same structural lattice (11 base rotate coordinates plus the independent 180° shift hemisphere) and anchored to the reconstruction's platen-facing -Z print side; diagnostics solve the selected slug normal and verify that it lands on that print-facing direction, while exact keyboard/glyph mapping and glyph-face sections remain unresolved;
- distinct coarse selection and carrier-local tilt/rotate fine-alignment detents, now downstream of the rotating IBM 1164240 combined ribbon-feed/detent cam instead of being scripted independently in the browser cycle; one visible P4 roller/yoke follower is the shared driver, tilt takes up first, and rotate follows through explicit P5 lost motion before both detents seat. Exact cam profile, follower throw and engagement/release event angles remain unresolved;
- 7X1 gearless tilt and rotate tape presentation driven by the source-backed normalized 1:2 tilt weighting, staged 1:2:2 rotate weighting and signed five-unit balance, with carrier-sweep constant-length paths now embodied as flat P4 tape strips over separate stationary and carrier-local guide lanes rather than round cords through decorative pulley centers; exact production sheave coordinates remain unresolved;
- cycle and operational shafts, cams, motor and a P4 motor-to-cycle positive-drive belt solved onto the external tangents of the reconstructed 8T/29T pitch circles rather than routed through arbitrary top/bottom points; four explicitly P5 motion markers are advected along that solved loop from motor pitch-circle travel so the continuously moving belt is inspectable, while exact belt pitch and absolute pulley diameters remain unresolved;
- new-style fabric-ribbon system with stencil / low / middle / high print states. Lift is downstream of the print-sleeve ribbon-lift cam through an embodied P4 roller follower and bellcrank into carrier-local forked vibrator guides with slim stems and explicit ribbon-slot prongs, replacing the earlier solid rectangular guide posts; feed is separately downstream of the IBM 1164240 feed lobe through its own embodied follower/bellcrank into the feed plate, pawl and ratchet instead of appearing only as a discrete browser-side step. Each spool is a fixed P4 hub/flange assembly with an independently changing wound-ribbon pack and a visible phase marker, so supply/take-up fullness no longer shrinks the whole spool; the two feed ratchets now have explicit P4 toothed-wheel silhouettes rather than faceted cylinders, with the display tooth count/profile kept explicitly unresolved as production geometry. The threading/load pose remains a service override above the highest print lift. Stencil feed lockout/centering plus no-ink paper-output behavior, source-ordered bidirectional feed, compressed P5 supply/take-up fullness transfer, and automatic reversal remain intact; exact cam profiles, lever lengths, event angles, lift heights, guide sections and physical ribbon capacity remain explicitly unresolved;
- paper output that records typed characters, with paper-local vertical stamp placement now driven by the live sheet advance instead of a fixed logical-line pixel step, plus an explicit P4 paper-wrap surface registered to the platen so the visible sheet reaches the print region without claiming an exact hidden contact arc;
- deterministic character-cycle ordering through code setup, selection, fine align, impact, escapement and clutch check; the type-element print swing is downstream of the rotating IBM 1124174 double print/restoring cam through an embodied P4 roller follower and bellcrank rather than a parallel browser animation. The three print-sleeve cams now use smooth constructive radial profiles instead of round collars with box-shaped lobe cues, so their silhouette reads as cam geometry while remaining explicitly P4 reconstruction. Live geometry diagnostics still measure the selected slug face against the platen front surface, and exact production cam sections, follower throw, lever lengths and OEM event angles stay unresolved;
- fixed escapement/margin/tab rack families, runtime-adjustable left/right margin stops settable at the live carrier column on the 12-CPI pitch, live right-margin line lock, programmable tab stops with set/clear behavior, opposed carrier cords, common escapement-shaft drums, mainspring cue, and a spring-loaded right tension arm now solved from carrier position so the visible escapement-cord free span plus reconstructed drum payout stays effectively constant across the writing line; sustained carrier-return clutch/pinion drive and non-propulsive tab governor;
- dedicated 7X1 12P backspace rack/bellcrank presentation rather than reverse-escapement shorthand;
- clutched 180° space/backspace service-cam actions, including visible cam-follower levers driven from the live selected-cam phase; the backspace rack and index pawl now take their motion from those follower phases instead of parallel animation tracks. Filter-shaft-style storage of a space request made during an active character cycle still releases immediately after character escapement; mainspring-style tab destination, carrier return + index, animated 180° shift-cam transition with character-cycle interlock, and animated 360° index-cam/pawl action remain intact. Exact IBM cam profiles/follower throws remain explicitly unresolved;
- assembled / exploded inspection plus dedicated carrier/typeball, selection, ribbon/print, paper/platen, rack/support and powerframe inspection views, with click-to-inspect provenance; runtime artifacts capture every dedicated mechanism view. The explosion now separates the broad base shell downward from the outer cover assembly lifting up/rear, instead of carrying the base behind the cover where it visually swallowed the carrier/platen layers; rack/support uses an open-machine camera, while powerframe applies an inspection-only P5 cutaway that removes shell/keyboard occluders without moving the mechanical assemblies and restores them on exit;
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
- windowed P4 carrier side frames remain a two-plate carrier structure rather than hiding the mechanism behind solid walls;
- tapered P4 keyboard keycaps remain compatible with the live key-depression path;
- the 27-position platen ratchet uses an asymmetric tapered P4 tooth silhouette while retaining the source-backed diameter/count and one-vs-two-tooth indexing behavior;
- type-element 4×22 structure, 34.925 mm nominal diameter anchor, P4 top-cap/latch presentation, beveled pedestal/shoulder/face-land slug sections, chrome-like finish and platen-facing selected-slug alignment;
- flat tilt/rotate selection-tape cross-sections, explicit stationary/carrier guide counts and carrier-sweep length invariants;
- powerframe inspection cutaway hides only shell/keyboard occluders and restores both when returning to the product view;
- current carrier-support and print-sleeve topology metadata, including smooth P4 radial cam envelopes for ribbon lift, IBM 1164240 feed/detent and IBM 1124174 print/restoring functions;
- fine-alignment causality: the rotating print sleeve / IBM 1164240 cam drives one embodied roller/yoke follower, tilt takes up immediately, rotate follows after the modeled lost-motion threshold, and the follower returns to rest with sleeve phase zero;
- one character = one 12-CPI carrier pitch, with the writing-position pointer following the same carrier coordinate;
- 1124174 print-drive causality from print-sleeve cam -> embodied follower -> bellcrank -> print rocker/type element, including follower return at rest; impact remains before escapement advance, with the screenshot captured after the actual PRINT_IMPACT threshold and a live selected-slug/platen clearance sanity bound;
- ribbon causality for both print-sleeve lift cam -> embodied follower -> bellcrank -> forked vibrator guides and IBM 1164240 feed lobe -> embodied follower -> bellcrank -> feed plate/pawl -> ratchet, including return-to-rest after the feed stroke; each guide exposes two slot prongs, fixed spool hubs/flanges remain geometrically stable while only the wound-ribbon pack radius changes, the two feed ratchets expose toothed P4 wheel geometry rather than cylinders, and selector modes, stencil feed lockout/centering, stencil impact without an ink record on ordinary paper output, distinct service load pose, supply/take-up fullness transfer, and automatic fabric-ribbon reversal remain covered;
- explosion independence plus opposed outer-cover/base-shell separation so the inspection explosion does not stack the broad base behind the lifted cover;
- operational service-cam embodiment: space/backspace, carrier-return/index and shift each drive only their own visible follower at mid-stroke and all followers restore at rest; the runtime artifact set also captures the powerframe with the carrier-return/index follower held at peak lift for visual inspection;
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
