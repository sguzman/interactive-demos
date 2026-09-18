# interactive-demos

A permanent public playground for small interactive browser demos made during ChatGPT sessions.

The repository is intentionally **one gallery, many experiments**. It exists to keep iteration cheap: a new visualization should normally become a folder and a `demos.json` entry, not a new repository or deployment stack.

## Live site

GitHub Pages publishes the `main` branch directly:

- Gallery: `https://sguzman.github.io/interactive-demos/`
- Watch demo: `https://sguzman.github.io/interactive-demos/watch/`

## Repository contract

- One repository, many demos.
- Each demo lives in a top-level folder, e.g. `watch/`, `rocket/`, `turbine/`.
- `demos.json` is the canonical gallery manifest.
- Root `index.html` + `gallery.js` render the catalog from that manifest.
- Prefer static HTML/CSS/JavaScript and procedural assets when practical.
- Prefer inspectable constructive geometry over opaque baked meshes for educational demos.
- Keep external dependencies browser-loadable unless a build step has a clear payoff.
- Do **not** create a new repository for every experiment.

## Promotion rule

A demo graduates to its own repository only when at least one of these becomes true:

1. it develops substantial independent architecture;
2. it needs its own release/versioning lifecycle;
3. its assets or build pipeline materially burden the gallery;
4. it becomes a product rather than an experiment;
5. continued co-location actively makes either project harder to maintain.

Interest or visual polish alone is not a reason to split a demo out.

## Current demos

### `watch/`

Movement-first exploded mechanical wristwatch visualization targeting the **ETA/Unitas 6497-2 family** and the Panerai OP XI / PAM111 reference lineage. The current implementation is an educational reconstruction rather than manufacturing-grade CAD.

Planned/active capabilities include:

- constructive/procedural geometry in millimetres;
- explicit functional assemblies;
- exploded and isolated views;
- hard movable inspection lighting;
- component metadata and provenance;
- progressively more faithful wheel train, escapement, winding works, bridges, and case architecture.

See `docs/watch-eta-6497-2.md`.


## Taria Engineering projection contract

For engineering showcases, this repository is a **public projection surface**, not the canonical technical knowledge base.

```text
private Taria Engineering
    facts
    provenance
    mechanism ontology
    source ledger
    model definitions
    open questions
    reconstruction assumptions
            ↓
projection / implementation
            ↓
interactive-demos
    Three.js scenes
    animations
    exploded views
    controls
    public explanatory UI
    showcase-specific simplification
```

A value invented or tuned for a visual reconstruction does not become an engineering fact merely because the demo works.

Likewise, a canonical Engineering update does not need to appear publicly until it is useful to the showcase.

`engineering-projections.json` records which public demos are explicitly bound to canonical Engineering specimens.

The first binding is:

```text
watch
-> specimen:eta-unitas-6497-2
```

Engineering-linked demos should preserve distinctions among manufacturer specification, measured observation, derived quantity, audited secondary claim, reconstruction parameter, visual simplification, and hypothesis.

The current watch documentation already follows this direction by distinguishing official ETA values from normalized educational reconstruction parameters.

This repository remains authoritative for **public implementation state**. Taria Engineering is authoritative for technical claims after explicit ingestion and provenance classification.
