# Nintendo Game Boy DMG-01 — interactive engineering specimen

Public projection of `specimen:nintendo-game-boy-dmg-01`.

This is a **multi-layer causal reconstruction**, not a full commercial-game emulator.

## Base scope

- original monochrome Nintendo Game Boy / DMG-01;
- representative physical reconstruction anchored to DMG-CPU-06 + DMG-LCD-06;
- power/jack boards shown as explicit representative revision choices;
- later Game Boy models are not silently merged into the base specimen.

## Public layers

- physical product / exploded assembly;
- electrical buses, rails, and board boundaries;
- CPU-visible memory/register ownership;
- temporal PPU/DMA access state;
- cartridge mapper state;
- human-input/JOYP state;
- PPU/LCD path;
- APU/audio path;
- service diagnostic graph.

## Deterministic demo

The browser runtime uses a purpose-built deterministic state model rather than a commercial ROM.

Pressing A deliberately:

~~~text
physical button
-> active-low JOYP state
-> deterministic demo state
-> visible LCD change
-> short CH1 presentation tone
~~~

The tone is synthesized browser presentation, not a captured Game Boy waveform.

## Provenance boundary

The specimen keeps several evidence classes distinct:

- Nintendo OEM service/electrical material;
- Nintendo developer documentation;
- community technical references;
- empirical hardware databases;
- board reverse engineering;
- die reverse engineering;
- community repair;
- Engineering derivation;
- P4/P5 reconstruction/presentation.

A high-precision reverse-engineered fact is not relabeled as Nintendo OEM documentation.

## Debug / browser QA

The page exposes `window.__dmgDebug` for deterministic browser tests.

The runtime smoke test checks power, JOYP, cartridge mapping, PPU access permissions, OAM DMA,
volume-state independence, service diagnosis, layer/explosion state independence, and guide
deep-links.


## Reference-grounded geometry

The visible DMG product geometry no longer uses the original hand-built primitive blockout.

The runtime loads a pinned GLB from the documented `tiansongyu/open-console-cad` reconstruction:

- upstream commit: `55081da3b4864aba36082644f9a3c5cedf1061c8`;
- Game Boy GLB SHA-256: `9aed0c26e836442ffce065f3607316df7f6d55742b708b9db2394e09e8d99beb`;
- 410 documented components;
- 660,428 triangles;
- 90 × 148 × 32 mm nominal product envelope;
- embedded part IDs, part numbers, assembly groups, material roles, and explosion offsets.

The upstream project explicitly describes the model as unofficial and locally approximate. It is
therefore treated as a strong P4 reconstruction source, **not** Nintendo factory CAD.

Engineering closure additionally compares the rendered public specimen against Nintendo envelope
data, teardown photography, revision-specific board references, and a frozen landmark ledger.

The deterministic causal runtime remains separate from geometry provenance.
