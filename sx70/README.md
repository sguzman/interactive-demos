# Polaroid SX-70 interactive engineering specimen

Public projection of:

`specimen:polaroid-sx-70`

Canonical scope:

**original/manual-focus folding Polaroid SX-70 SLR system**

Later Sonar autofocus cameras, Time-Zero lineage, later family variants, and modern Polaroid film
must be explicitly labeled if introduced.

## Current implementation state

The public implementation is integrated through the film-chemistry boundary.

Currently implemented:

- gallery entry and projection registry;
- Works-derived public engineering guide;
- folded default state and product-intimate Open / Fold / Focus / Take photo path;
- primary draggable fold/unfold scrubber for continuous deployment inspection;
- constructive chassis/base geometry with a source-topology four-bar deployment reconstruction;
- ordinary fold/unfold continuity without threshold pop-in of product parts;
- bellows and lens/shutter housing;
- viewing and exposure optical graphs;
- integrated live internal mechanism with shutter blades, solenoid, motor, reduction gears, sequencing cam, reflex/Fresnel carrier, fixed viewing mirror and relay optics;
- true hierarchical cutaway/exploded inspection independent of folding deployment;
- shell-cutaway visibility gate that keeps large internal mirror/Fresnel/transport geometry hidden
  until the exterior has opened enough to expose it, preventing low-explode "floating glass" leaks;
- decomposed front-standard frame / faceplate / lens / shutter-chamber / metering / control presentation;
- dedicated deep front-standard inspection view with component-level explosion;
- clickable internal parts with provenance-aware inspector;
- live mechanism motion preserved while the shell is exploded;
- canonical exposure-cycle transition engine;
- persistent cycle event history;
- sourced 40 ± 5 ms Y-delay anchor;
- P5-normalized unresolved motor / shutter / cam timing;
- original ten-sheet pack state;
- flat 6 V pack-battery state;
- fresh-pack dark-slide cycle;
- pick-to-roller handoff;
- exact-once sheet consumption;
- ejected-print state;
- normalized integral-film chemistry;
- exposure-dependent CMY transfer sign;
- high-pH opacification;
- delayed neutralization and pH fall;
- separate mechanical and chemical clocks;
- chemistry fast-forward as explicit P5 presentation behavior;
- component inspection across shell, mechanism, optics, film pack, battery, platen, pick and rollers;
- collapsed Advanced inspection;
- provenance / lineage diagnostics;
- deterministic Chromium end-to-end regression and rendered screenshots.

The public model remains a causal educational reconstruction. Exact production folding coordinates,
hidden-part placement, gear tooth counts, mirror angles, cam profiles, transport forces/speeds,
and proprietary film kinetics remain explicitly unresolved or reconstructive. The internal explode
uses P4 placement and P5 separation spacing where factory coordinates are unavailable.

### Exterior geometry acceptance

The articulated-v6 exterior was visually accepted for the current project scope on 2026-10-02 after
open/folded user review. Known residual defects are deliberately retained rather than hidden:

- minor interpenetration/clipping remains at some folding angles;
- constructive P4 shell surfaces are somewhat boxier than factory industrial-design surfaces;
- exact production pivots and hidden linkage dimensions remain unresolved;
- the previously detached-looking rear eyepiece presentation was corrected by seating it into the
  viewfinder-cap rear face before closure.

These residuals do not reopen the current specimen unless a later fidelity tranche explicitly does so.

## Authority contract

This repository is authoritative for public browser behavior and presentation.

internal engineering corpus is authoritative for technical claims and their provenance.

Works owns the reader-facing expression:

`expression:polaroid-sx-70-public-engineering-guide:en:v1`

A value adjusted here for visual usefulness does not become an SX-70 engineering fact.

## Geometry doctrine

The current visible chassis is **P4 reconstructive constructive geometry**.

The surviving source corpus strongly grounds:

- folding architecture;
- thin base / upper linked structure;
- top front cover panel hinged between the lensboard/shutter housing and rear top cover;
- rear top cover hinged to the main housing;
- erecting-link concept;
- bellows role;
- lens/shutter housing identity;
- viewfinder relation;
- deployment-to-electrical-enable relation.

It does not currently ground exact production:

- four-bar link lengths;
- pivot coordinates;
- deployment spring constants;
- latch forces;
- every housing wall thickness;
- exact mirror placement;
- exact camera-body curves.

The public model may therefore be recognizable and mechanically legible without claiming to be
factory CAD.

## Product-intimate design rule

The basic experience should remain:

~~~text
open
-> focus
-> take photograph
-> receive print
-> watch it develop
~~~

The engineering-inspection experience is equally first-class:

~~~text
open
-> Internals
-> cut away / explode shell
-> inspect named internal subassemblies
-> run the same live exposure / reflex / transport cycle
-> watch the mechanism operate while separated
~~~

Folding deployment and engineering explosion are independent state axes.

Ordinary product geometry follows a continuity rule: persistent physical parts remain persistent
through deployment. Occlusion and continuous articulation, rather than deployment-threshold
visibility toggles, explain what the user can see.

Internal switch labels, motor/cam phase, chemical fields and provenance diagnostics belong behind
progressive disclosure.

## State-model rule

As implementation deepens:

~~~text
state transition
-> physical consequence
-> rendered motion
~~~

Animation frame number must not become the canonical state machine.

Mechanical process time and chemical process time remain separate clocks.

## Validation

Integrated browser regression:

`tests/sx70-runtime.spec.mjs`

The test exercises folded start, a multi-sample deployment-continuity sweep, persistent-part
visibility, deep front-standard decomposition, focus, dual optical modes, the canonical exposure
transition order, live mechanism motion while exploded, exact-once film consumption, fresh-pack
dark-slide ejection, transport and chemistry views, camera refolding, and continued chemical time
after the camera is folded.

The CI workflow is:

`.github/workflows/sx70-runtime-smoke.yml`


## v6 folding-shell contract

The current shell no longer interpolates the rear and front structures independently.

It treats the source-described rear cover → top front cover → lensboard chain as a closed four-bar
reconstruction. One deployment coordinate drives the rear link; the front-standard upper joint is
solved from fixed reconstructed link lengths.

Those link lengths are P4 presentation geometry, not production measurements.

This removes several previous failure modes:

- rigid-looking members silently changing length;
- folded/open endpoints looking plausible while intermediate geometry is mechanically impossible;
- the viewfinder cap almost completing its motion while the structural body was still folded;
- a cap pitch with the opposite sign from real side-reference photographs;
- translucent ordinary-fold bellows that let unrelated parts visually bleed through;
- a bellows envelope wider than the front standard/top cover, causing side-rail overlap.
