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

**You must reach an action site before working.** Selecting a task only starts walking; it never changes the ecosystem remotely. Within 2.1 world units, a contextual E prompt appears. Press E or tap it to begin a 1.4-second working animation; the restoration then completes exactly once. Planting uses a trowel, and the reeds grow to represent compressed time.

Manual movement interrupts assisted walking. Tree trunks block the player. Entering the lake switches to swimming; boats stay inside the shoreline and the player stays within the park boundary. Trees stay visible: the camera shortens its boom and seeks a clearer angle around obstructions. The game fills the viewport on desktop and phones, with an optional field journal and health panel. There are no accounts, enemies, fail states, or stored progress.

## Explore the expanded park

The park has a 48-unit traversable radius and a lake scaled to 2.2 times its original width. Open **Park map** to travel to a destination, or explore freely.

- **Boating jetty:** board a canoe wearing a life jacket. W/S rows forward/backward; A/D steers. E guides the boat back; press E again beside the jetty to moor and disembark. You cannot leave a boat in open water.
- **Swimming cove:** enter the water with an animated swimming pose. WASD moves relative to the camera. E starts an assisted return to shore.
- **Picnic grove:** sit on the bench. E or movement stands you up.
- **Nursery and young grove:** water seedlings and plant a shade tree. Each activity has its own tool animation and a visible plant response.
- **Quiet bird hide:** walking close startles the marsh birds. Toggle Sneak, wait for them to settle, and use binoculars. Observation requires a quiet approach.
- **Neighbours:** talk to Arun the boatkeeper, Kavya the nursery volunteer, Meera the birdwatcher, and Ravi the walking neighbour. Each has a short conversation and directions to an activity. Ravi patrols; nearby characters turn and greet you.

Wind moves tree canopies; fish swim and flick their tails, birds flap, butterflies drift, and the canoe rocks, rows, and leaves a wake. Six exploration activities have a separate journal tally. They do not add unlabelled effects to the three restoration scores. Sitting, swimming, and boating can be repeated; planting, watering, and observation are recorded once until reset.

Swimming and boating are fictional game activities, not an indication that any real Bengaluru lake is safe or open for recreation.

## A 90-second demo

1. **0-15 seconds:** Select **Take the 90-second tour**. Introduce the sun-hatted explorer and the fictional, Bengaluru-inspired setting. Drag to look and use WASD to walk.
2. **15-30 seconds:** Select **Next**. Follow the assisted walk to the community shore. Press **E** or tap **Collect shoreline litter** when the nearby prompt appears. Watch the character work and litter disappear.
3. **30-50 seconds:** Select **Next** to walk to the seed bed. Press **E** to **Plant native seeds**. Watch the trowel animation, growing reeds, and new wildlife. Explain that ecological time is compressed.
4. **50-70 seconds:** Select **Next** to walk to the inlet. Press **E** to **Clear inlet litter**. Explain that real wastewater also requires treatment.
5. **70-90 seconds:** Finish the tour and open **Lake health**. Show the illustrative scores and **How does this work?** assumptions. Close the panel and select **Reset** to demonstrate reproducibility.

The tour is self-paced. Ninety seconds is a presentation script, not an enforced timer. Assisted walks can be interrupted with WASD; reselect the task from the journal to resume.

## How the illustrative simulation works

The model is an additive teaching device. Scores, timing, and magnitudes are deliberately designed, not calibrated to lake measurements. Procedural scenery uses a fixed pseudorandom seed. No action results depend on timing or random outcomes, and all six action orders have the same final result.

| State or action | Clarity (out of 100) | Habitat (out of 100) | Wildlife index (out of 10) |
| --- | ---: | ---: | ---: |
| Starting state | 32 | 24 | 2 |
| Collect shoreline litter | +18 | +8 | +1 |
| Plant native seeds | +8 | +30 | +3 |
| Clear inlet litter | +22 | +12 | +2 |
| All three completed | 80 | 74 | 8 |

Wildlife is an illustrative index, not an animal census. Restoration reveals additional fish and birds; ambient marsh birds and butterflies exist independently of that index. The native-seed action represents locally appropriate wetland vegetation, without claiming botanical identification. Growth from seeds to mature reeds in seconds is an explicit time-compression device. Water appearance tracks completed actions; it is an artistic cue, not a water-quality measurement. Animated positions depend on elapsed time, while the scene layout, action outcomes, and final scores are deterministic.

Real restoration depends on wastewater treatment, hydrology, catchment conditions, species selection, monitoring, and long-term maintenance. Wildlife return is neither immediate nor guaranteed. The simulation compresses time and omits these complex processes. It is not a recommendation to plant or release organisms in a real lake.

## Learning goal and references

The classroom goal is to connect catchment inputs, shoreline habitat, and wildlife, then ask what the simplified model leaves out. This project is not affiliated with the institutions cited below.

References verified on 27 September 2026:

- Ramachandra T. V. et al. (2016), *Devarabisanahalli Lake: Path towards Ecological Restoration*, ENVIS Technical Report 104, Energy & Wetlands Research Group, Centre for Ecological Sciences, IISc. [Executive summary](https://wgbis.ces.iisc.ac.in/energy/water/paper/ETR104/summary.html). Discusses urban lake pressures, native vegetation, and educational monitoring.
- The same report's [restoration recommendations](https://wgbis.ces.iisc.ac.in/biodiversity/pubs/ETR/ETR104/recommendation.html) discuss integrated wastewater treatment and wetlands, location-specific macrophytes, and shoreline vegetation as habitat. These support the broad learning themes, **not** this application's numerical effects. The report is historical and site-specific, not a current universal restoration prescription.

## Accessibility, performance, and limitations

- Semantic buttons, native modal focus handling, visible keyboard focus, labeled controls, touch targets, and screen-reader action announcements.
- Text and indicators remain HTML over the WebGL scene. The visual 3D world itself does not have a complete nonvisual equivalent.
- Reduced motion freezes decorative animation and skips the particle burst and growth transition; intentional walking and camera controls remain available.
- Procedural ambient sound is opt-in, with no audio downloads. Audio mutes while the tab is hidden.
- Pixel ratio is capped at 1.5; cached static shadows, merged static geometry, low-poly meshes, and a single 1024px shadow-casting light limit rendering cost. CPU-only WebGL automatically uses 0.75 pixel ratio and a 30 FPS ceiling. Hidden tabs stop rendering, and modal panels reduce rendering frequency. Hardware performance still varies; the browser tests use software WebGL and are not a laptop FPS benchmark.
- Loading and renderer-error states include a reload option. A WebGL-capable browser is required; there is no 2D fallback.
- The responsive game HUD fits the phone viewport. The journal and health panel can be opened individually; the touch pad and nearby interaction button remain available. No data is sent or saved.

## Files

- `src/world.ts`: procedural world, animated character, perspective follow camera, collision, assisted navigation, and nearby interactions.
- `src/park.ts`: procedural activity areas, canoe, NPCs, birds, butterflies, and activity animations.
- `src/activities.ts`: activity and NPC definitions, dialogue, boat mooring rules, and map constants.
- `src/movement.ts`: pure camera-relative movement and traversable-boundary rules.
- `src/simulation.ts`: seeded randomness and pure deterministic score model.
- `src/main.ts`: interface, guided tour, keyboard/touch input, panels, and audio.
- `src/style.css`: design tokens and responsive interface.
- `tests/`: model and browser integration coverage.

Design direction: Apple-inspired restrained controls, warm light surfaces, a moss-green accent, and editorial serif display type. All scenery is generated locally; Lucide provides interface icons.

## Validation performed

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — 8 score, reproducibility, movement, boat-boundary, and camera-obstruction tests passed.
- `npm run build` — passed without bundle-size warnings; output in `dist/`.
- `npx playwright test` — five browser scenarios covering third-person desktop playthrough, mobile guided walks, WebGL failure, park activities, and NPC conversations. Includes proximity-gated actions, reset, panel dismissal, sound toggling, keyboard and touch movement, and reduced motion.
- Desktop and 390px mobile screenshots reviewed; local development server returned HTTP 200.

Browser checks use Chromium software rendering. They verify functionality and layout, not scientific validity or hardware frame-rate guarantees.
