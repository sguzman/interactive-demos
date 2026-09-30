# Watch audio sources

The interactive ETA / Unitas 6497-2 specimen uses real-watch recordings as a **presentation layer**.

These recordings are **not** acoustic measurements of an ETA 6497-2 and are not used as engineering evidence.

## Running tick

- file: `Watch tick.ogg`
- description: actual ticking watch, single click
- author: Marble Toast
- date: 2024-07-07
- license: CC0 1.0
- source: https://commons.wikimedia.org/wiki/File:Watch_tick.ogg
- media: https://upload.wikimedia.org/wikipedia/commons/a/a3/Watch_tick.ogg

The public demo schedules this real recorded click at the movement model's 3 Hz / six-alternations-per-second cadence during normal-speed running.

## Winding texture

- file: `Rewinding an automatic.ogg`
- description: actual mechanical watch being handled and rewound
- author: ezwa
- date: 2008-11-13
- license: public domain
- source: https://commons.wikimedia.org/wiki/File:Rewinding_an_automatic.ogg
- media: https://upload.wikimedia.org/wikipedia/commons/9/91/Rewinding_an_automatic.ogg

This is **generic actual-watch winding audio**, not a recording of this calibre and not a manual-wind 6497-2 acoustic reference.

## Better future source

A 2026 Freesound recording titled `Antique Pocket Watch Ticking and Winding` by `apintofmild` is CC0 and explicitly contains two antique pocket watches ticking and winding:

https://freesound.org/people/apintofmild/sounds/847217/

Freesound requires login for the downloadable original, so it is not bundled automatically here. It is a good candidate for a future locally vendored replacement.


## Acoustic fidelity boundary

The 6497-2 manufacturer frequency is 3 Hz / 21,600 alternations per hour, so the model schedules six lever beat events per second.

The bundled running source is a **single real-watch click**, not a continuous 6497-2 recording. Replaying that identical click unchanged sounded artificially metronomic.

The public implementation therefore applies a P5 acoustic reconstruction:

- exact six-beat-per-second timing at 1×;
- alternating darker/heavier and brighter/lighter tick/tock playback profiles;
- small deterministic gain variation;
- no timing jitter that would imply beat error;
- no claim that the resulting timbre is a measured ETA 6497-2 acoustic signature.

This is intended to be mechanically more plausible than an identical repeated click while keeping the provenance boundary explicit.

A truly calibre-specific rendition requires a cleanly licensed recording of a known ETA 6497-2 under documented case/microphone conditions. Until then, the site must not label the timbre itself as calibre-exact.

## Family-character references

Independent owner/reviewer descriptions consistently characterize the 6497 family as unusually audible, with deliberate winding clicks and an obvious tick/tock character. Those descriptions inform presentation character only; they are not acoustic calibration data.
