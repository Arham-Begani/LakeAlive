# LakeAlive

A third-person 3D lakeside game at golden hour. Explore as a sun-hatted character, collect litter, plant native seeds, and care for an inlet. The expanded park includes a boating jetty, swimming cove, picnic grove, nursery, bird hide, and four fictional neighbours. A perspective camera follows you through a procedural Bengaluru-inspired landscape. Built for a student hackathon with TypeScript, Vite, Three.js, and Lucide icons. The initial repository was empty, so there was no existing application stack to preserve.

**All scores and ecosystem changes are an illustrative simulation, not measured Bengaluru lake data or scientific predictions.** The lake is fictional. No real-world impact, users, affiliations, or partnerships are claimed.

## Setup and run

Use Node.js 22.13+ (recommended) and npm. A modern browser with WebGL and hardware acceleration is required. No accounts, API keys, backend, paid APIs, or downloaded image assets are needed.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173). For a phone on the same network, use the computer's LAN address and port 5173. Vite listens on all interfaces for this purpose.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The static production site is written to `dist/`. Serve that directory from any static web host. There are no runtime network requests for scenery or fonts. The external reference link is optional and opens only when clicked.

Browser integration tests:

```sh
