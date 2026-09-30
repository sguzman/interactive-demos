# Polaroid SX-70 interactive engineering specimen

Public projection of:

`specimen:polaroid-sx-70`

Canonical scope:

**original/manual-focus folding Polaroid SX-70 SLR system**

Later Sonar autofocus cameras, Time-Zero lineage, later family variants, and modern Polaroid film
must be explicitly labeled if introduced.

## Current implementation state

The public implementation is being built in causal layers.

Currently implemented:

- gallery entry;
- public specimen shell;
- folded default state;
- Open camera / Fold camera;
- constructive chassis/base geometry;
- erecting-link visualization;
- bellows envelope;
- lens/shutter housing;
- presentation focus travel;
- front-cover / processing-roll envelope;
- component inspection;
- P0/P3/P4/P5 provenance language;
- Overview and Folding view presets;
- deterministic Chromium smoke proof for fold/open/focus/explode.

Not yet implemented:

- full viewing-optics ray model;
- exposure-optics ray model;
- reflex/Fresnel carrier transition;
- shutter / photocell / ECM cycle;
- motor/cam/switch state machine;
- film-pack consumable state;
- dark-slide initialization;
- film pick and roller transport;
- integral-film chemistry;
- complete Advanced inspection;
- public rich-guide rendition and deep links.

The UI deliberately marks those surfaces as queued rather than making decorative controls that do
not execute a real model.

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

Early folding-shell runtime proof:

`tests/sx70-runtime.spec.mjs`

Final end-to-end regression will later extend this into the full exposure, transport and chemistry
sequence rather than replacing the early proof.
