# SX-70 geometry / folding reference stack

The browser model is a public engineering reconstruction, not Polaroid factory CAD. Folding geometry
must be constrained by published product behavior and documented linkage topology rather than by
freehand animation.

## Primary / near-primary folding evidence

### Polaroid folding-camera user guidance

Polaroid's folding SX-70 instructions describe the user action explicitly:

- grasp the rear / serrated end of the viewfinder cap;
- lift it upward;
- continue until the cover support locks;
- to close, push the cover support rearward and press the cap down until both sides latch.

Public reference:
https://support.polaroid.com/hc/en-us/articles/360015377860-How-to-use-a-folding-SX-70-camera

This constrains the visible choreography: the viewfinder-cap lift leads erection rather than every camera
member moving in perfect lockstep.

### SX-70 service / troubleshooting manual

The scanned service manual documents the folded-camera interlock and opening sequence. It states that
pulling upward on the serrated viewfinder housing releases the latches and allows the main body to rise
into operating position; the S6 interlock closes only when fully opened.

Public copy:
https://www.ifixit.com/Document/xqBtiFBffqCWwSu4/polaroid-sx70-service.pdf

### Polaroid folding-camera patent topology

US 4,016,580 describes the product-like housing chain:

- top front cover panel hinged to the lensboard / shutter housing;
- rear end of that panel hinged to a rear top cover panel;
- rear top cover hinged to the main housing;
- an erecting link holds the camera in its erected condition;
- flexible bellows complete the light-tight chamber.

Reference:
https://patents.google.com/patent/US4016580A/en

US 3,710,697 describes the folding viewing system and its coordinated erection. The camera housing and
viewfinder are not independent floating pieces: viewfinder optical members use pivots, links, guide
slots, springs, and latches, and camera erection releases the viewfinder mechanism.

Reference:
https://patents.google.com/patent/US3710697A/en

## Reconstruction consequences

The public runtime therefore treats these as hard modeling rules:

1. main shell deployment is a constrained linked mechanism, not per-part position interpolation;
2. front standard must nest inside the folded product envelope;
3. viewfinder-cap erection leads the structural four-bar during opening;
4. visible support/link parts must remain mechanically associated with their parent structures;
5. folded/open/intermediate side profiles require deterministic rendered QA;
6. inspection explosion is independent from folding and uses continuous slider displacement.

Exact production pivot coordinates and hidden link dimensions remain unresolved. Any coordinates not
directly supported by source material remain P4 reconstruction values and must not be described as
factory measurements.
