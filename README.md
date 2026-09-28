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
npx playwright install chromium
npx playwright test
```

Playwright starts a local Vite server automatically. It tests the three actions, duplicate prevention, reset, dialogs, reduced motion, the mobile guided tour, overflow, a simulated WebGL failure, NPC conversations, sitting, swimming, boat entry/movement/mooring, nursery work, and quiet birdwatching. Screenshots are saved to `test-results/`.

## Controls

| Input | Result |
| --- | --- |
| WASD / arrow keys | Walk freely relative to the camera |
| Shift | Hold to run |
| Drag mouse / finger | Look around the character, horizontally and vertically |
| Mouse wheel | Adjust the follow-camera distance |
| Q / R | Turn the camera using the keyboard |
| E / on-screen interaction prompt | Work, talk, sit, stand up, or return to shore |
| C / Sneak button | Toggle a slower crouched walk; approach birds quietly |
| M / Park map | Open destinations and NPC locations; select one for an assisted walk |
| 1 / 2 / 3 | Start an assisted walk to cleanup / seed bed / inlet |
| Field journal / J | Toggle the journal; Care and Explore tabs offer tasks and activities |
| Lake health / H | Toggle detailed illustrative indicators |
| Click / tap the ground | Start a walk there, following the shoreline around deep water |
| Location pin | Walk to that restoration site |
| Touch arrow pad | Move on a touchscreen |
| Tab / Enter | Navigate and activate interface buttons |
| Escape | Close a panel or guided tour |
| Speaker | Toggle synthesized ambient sound (off by default) |
| Wind | Toggle reduced motion; initially follows the OS preference |
| Reset arrow | Restore the world, player position, and camera |
| LakeAlive wordmark | Return to the start screen (reloads and resets progress) |
