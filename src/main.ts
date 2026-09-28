import './style.css';
import { createIcons, Waves, ArrowUpRight, ArrowRight, Sprout, HandHeart, Droplets, Sun, Navigation, Leaf, Bird, Info, Footprints, Keyboard, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, VolumeX, Volume2, Wind, RotateCcw, RotateCw, CirclePlay, Check } from 'lucide';
import { actions, healthFor, seededRandom, type ActionId } from './simulation';
import { LakeWorld, locations } from './world';
import { activities, activityById, npcs, modeLabels, canLeaveBoat, type ActivityId, type NpcId } from './activities';
import { shoreRadius } from './movement';

const icon = (name: string, cls = '') => `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="header">
    <a class="brand" href="./" aria-label="LakeAlive home"><span class="brand-mark">${icon('waves')}</span>Lake<span>Alive</span><span class="brand-dot"></span></a>
    <div class="header-note">A SMALL WORLD. A SHARED FUTURE.</div>
    <button class="text-button" id="about">The project ${icon('arrow-up-right')}</button>
  </header>
  <main id="experience" class="experience">
    <div class="scene-wash"></div>
    <div id="world" class="world"></div>
    <div id="loading" class="loading" role="status"><span class="loading-leaf">${icon('sprout')}</span>Growing a little world…</div>
    <div id="world-error" class="world-error" hidden><h2>The lake couldn’t load</h2><p>This experience needs WebGL. Try reloading or opening it in a browser with hardware acceleration enabled.</p><button class="primary" id="reload">Try again ${icon('rotate-cw')}</button></div>
    <section class="intro" id="intro" aria-labelledby="hero-title">
      <div class="eyebrow"><span></span> BENGALURU, REIMAGINED</div>
      <h1 id="hero-title">A little care.<br>A lake <em>alive.</em></h1>
      <p class="intro-copy">Your own little lakeside adventure.<br class="desktop-br"> Wander, plant, and bring life back.</p>
      <p class="intro-detail">Meet the neighbours. Row into the sunset.<br>Find your own way to care for the lake.</p>
      <button class="primary start" id="start" disabled>Enter the lake ${icon('arrow-right')}</button>
      <button class="tour-link" id="intro-tour" disabled>${icon('circle-play')} Take the 90-second tour</button>
      <div class="intro-footnote">No sign-up. Just a little curiosity.</div>
    </section>
    <div class="scene-heading" id="scene-heading"><span class="eyebrow">YOUR LITTLE PATCH OF NATURE</span><h1>A lake worth caring for.</h1><p>Explore the shore. Choose an action. Watch life return.</p></div>
    <div class="time-chip">${icon('sun')}<div><strong>Golden hour</strong><span>A Bengaluru-inspired lakeside</span></div></div>
    <div class="world-caption"><span class="caption-line"></span><span>A living world, made entirely with code.</span></div>
    <div class="north" aria-hidden="true"><span>N</span>${icon('navigation')}</div>
    <div id="markers" class="markers" hidden>${actions.map((a, i) => `<button class="marker" id="marker-${a.id}" data-visit="${a.id}" aria-label="Visit ${a.location}"><span>${icon(a.icon)}</span><small>${i + 1}</small></button>`).join('')}</div>
    <aside class="health panel" id="health" hidden aria-labelledby="health-title">
      <div class="panel-heading"><div><span class="eyebrow">A LITTLE CHECK-IN</span><h2 id="health-title">The lake, today</h2></div><span class="health-symbol">${icon('leaf')}</span></div>
      <div class="metric"><div><span>${icon('droplets')} Water clarity</span><strong id="clarity-value">32<span>/100</span></strong></div><meter id="clarity-meter" aria-label="Illustrative water clarity" min="0" max="100" value="32">32 of 100</meter></div>
      <div class="metric"><div><span>${icon('sprout')} Habitat</span><strong id="habitat-value">24<span>/100</span></strong></div><meter id="habitat-meter" aria-label="Illustrative habitat" min="0" max="100" value="24">24 of 100</meter></div>
      <div class="metric wildlife"><div><span>${icon('bird')} Wildlife index</span><strong id="wildlife-value">2 <span>/10</span></strong></div></div>
      <p class="simulation-label">${icon('info')} Illustrative simulation</p>
      <button id="how" class="panel-link">How does this work? ${icon('arrow-up-right')}</button>
    </aside>
    <section class="actions panel" id="actions" hidden aria-label="Restoration actions">
      <div class="actions-top"><div><span class="eyebrow">YOUR FIELD JOURNAL</span><h2>Leave it a little better.</h2></div><span class="action-count" id="action-count">0 / 3</span></div>
      <div class="journal-tabs"><button data-journal-tab="care" aria-pressed="true">Care for the lake</button><button data-journal-tab="explore" aria-pressed="false">Explore <span id="explore-count">0/6</span></button></div>
      <div class="action-grid" id="care-tasks">${actions.map((a, i) => `<button class="action-card" data-action="${a.id}"><span class="action-icon">${icon(a.icon)}</span><span class="action-text"><strong>${a.title}</strong><small>${a.description}</small></span><span class="action-key">${i + 1}</span></button>`).join('')}</div>
      <div class="action-grid" id="explore-tasks" hidden>${activities.map(a => `<button class="action-card" data-activity="${a.id}"><span class="action-icon">${icon(a.icon)}</span><span class="action-text"><strong>${a.title}</strong><small>${a.location}</small></span><span class="activity-check" aria-hidden="true"></span></button>`).join('')}</div>
      <div class="actions-bottom"><span>Choose a task to walk there</span><button id="help">Controls ${icon('keyboard')}</button></div>
    </section>
    <div class="game-hud" id="game-hud" hidden>
      <div class="location-hud"><span class="eyebrow">BENGALURU · GOLDEN HOUR</span><span id="location-name">The community shore</span></div>
      <button id="journal-toggle" class="hud-button" aria-expanded="true" aria-controls="actions">${icon('leaf')} Field journal <span id="mini-count">0 / 3</span></button>
      <button id="map-toggle" class="hud-button">${icon('navigation')} Park map <kbd>M</kbd></button>
      <button id="health-toggle" class="hud-button health-toggle" aria-expanded="false" aria-controls="health">${icon('droplets')} <span id="mini-health">Clarity 32 · Habitat 24 · Wildlife 2</span></button>
      <div class="interaction" id="interaction" hidden><span class="eyebrow" id="interaction-location"></span><button id="interact"><kbd>E</kbd><span><strong id="interaction-title">Collect shoreline litter</strong><small id="interaction-detail">Lend a hand</small></span>${icon('arrow-right')}</button><progress id="work-progress" max="1" value="0" hidden aria-label="Restoration action progress"></progress></div>
      <div class="walk-hint" id="walk-hint"><kbd>W A S D</kbd> move <span>·</span> drag to look <span>·</span> <kbd>E</kbd> interact <span>·</span> <kbd>Shift</kbd> run</div>
      <div class="navigation-status" id="navigation-status" role="status" hidden></div>
      <span class="game-disclaimer">ILLUSTRATIVE SIMULATION · A FICTIONAL LAKE</span>
      <div class="movement-controls"><span id="mode-label">Walking</span><button id="sneak-toggle" class="hud-button" aria-pressed="false">${icon('footprints')} Sneak <kbd>C</kbd></button><button id="run-toggle" class="hud-button" aria-pressed="false">Run <kbd>Shift</kbd></button></div>
    </div>
    <div class="toast" id="toast" role="status" hidden></div>
    <aside class="tour panel" id="tour" hidden aria-label="Guided tour"><div class="tour-top"><span id="tour-label" class="eyebrow"></span><button id="tour-close" class="icon-button" aria-label="Close tour">${icon('x')}</button></div><h2 id="tour-title"></h2><p id="tour-copy"></p><button class="primary" id="tour-next">Next ${icon('arrow-right')}</button></aside>
    <div class="touch-pad" id="touch-pad" hidden aria-label="Walk controls"><button data-key="arrowup" aria-label="Walk forward">${icon('chevron-up')}</button><div><button data-key="arrowleft" aria-label="Walk left">${icon('chevron-left')}</button><button data-key="arrowdown" aria-label="Walk backward">${icon('chevron-down')}</button><button data-key="arrowright" aria-label="Walk right">${icon('chevron-right')}</button></div></div>
    <div class="scene-toolbar"><button id="sound" class="icon-button" aria-label="Enable ambient sound" aria-pressed="false" title="Ambient sound">${icon('volume-x')}</button><button id="motion" class="icon-button" aria-label="Reduce motion" aria-pressed="false" title="Reduce motion">${icon('wind')}</button><span class="toolbar-divider"></span><button id="reset" class="icon-button" aria-label="Reset the lake" title="Reset the lake">${icon('rotate-ccw')}</button></div>
  </main>
  <footer class="footer"><span>${icon('leaf')} Made for a more curious, caring world.</span><div><span class="footer-simulation">ILLUSTRATIVE SIMULATION</span><span class="footer-dot">·</span><button id="footer-how">Behind the ecosystem ${icon('arrow-up-right')}</button></div></footer>
  <dialog id="info-dialog"><div class="dialog-header"><span class="eyebrow">LAKEALIVE FIELD NOTES</span><button id="dialog-close" class="icon-button" aria-label="Close panel">${icon('x')}</button></div><div id="dialog-content"></div></dialog>
`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const refreshIcons = () => createIcons({ icons: { Waves, ArrowUpRight, ArrowRight, Sprout, HandHeart, Droplets, Sun, Navigation, Leaf, Bird, Info, Footprints, Keyboard, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, VolumeX, Volume2, Wind, RotateCcw, RotateCw, CirclePlay, Check }, attrs: { 'stroke-width': 1.6 } });
refreshIcons();
let world: LakeWorld | undefined;
let completed: ActionId[] = [];
let started = false;
let tourStep = -1;
let toastTimer: ReturnType<typeof setTimeout>;
let muted = true;
let audio: AudioContext | undefined;
let gain: GainNode | undefined;
let hudState = '';
const dialog = $<HTMLDialogElement>('info-dialog');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');

function errorState() { $('loading').hidden = true; $('world-error').hidden = false; $<HTMLButtonElement>('start').disabled = true; $<HTMLButtonElement>('intro-tour').disabled = true; if (world) { world.paused = true; world.keys.clear(); } }
async function initialize() {
  try {
