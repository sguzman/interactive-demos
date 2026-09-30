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
- constructive chassis/base geometry and linked deployment;
- bellows and lens/shutter housing;
- viewing and exposure optical graphs;
- paired shutter / reflex-carrier / motor-cam presentation geometry;
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
- component inspection;
- collapsed Advanced inspection;
- provenance / lineage diagnostics;
- deterministic Chromium end-to-end regression and rendered screenshots.

The public model remains a causal educational reconstruction. Exact production folding coordinates,
mirror angles, cam profiles, transport forces/speeds, and proprietary film kinetics remain
explicitly unresolved or reconstructive.

## Authority contract

This repository is authoritative for public browser behavior and presentation.

Taria Engineering is authoritative for technical claims and their provenance.

Works owns the reader-facing expression:

`expression:polaroid-sx-70-public-engineering-guide:en:v1`

A value adjusted here for visual usefulness does not become an SX-70 engineering fact.

## Geometry doctrine

The current visible chassis is **P4 reconstructive constructive geometry**.

The surviving source corpus strongly grounds:

- folding architecture;
- thin base / upper linked structure;
- bellows role;
- erecting linkage concept;
- lens/shutter housing identity;
- viewfinder relation;
- deployment-to-electrical-enable relation.

It does not currently ground exact production:

- linkage lengths;
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

The test exercises folded start, deployment, focus, dual optical modes, the canonical exposure
transition order, exact-once film consumption, fresh-pack dark-slide ejection, transport and
chemistry views, camera refolding, and continued chemical time after the camera is folded.

The CI workflow is:

`.github/workflows/sx70-runtime-smoke.yml`
