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
    await new Promise(resolve => requestAnimationFrame(resolve));
    world = new LakeWorld($('world'), errorState);
    world.onNotice = announce;
    world.onFrame = () => {
      if (!started) return;
      for (const action of actions) {
        const p = world!.project(locations[action.id]); const marker = $('marker-' + action.id);
        marker.hidden = !p.visible || completed.includes(action.id);
        marker.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      }
      updateGameHUD();
    };
    await world.ready;
    $('loading').hidden = true; $<HTMLButtonElement>('start').disabled = false; $<HTMLButtonElement>('intro-tour').disabled = false;
    updateMotion();
  } catch (error) { console.error('Lake renderer failed:', error); errorState(); }
}
void initialize();
$('reload').onclick = () => location.reload();

function enter() {
  if (!world) return; started = true; world.playing = true; $('experience').classList.add('is-playing'); document.body.classList.add('in-game');
  $('intro').hidden = true;
  for (const id of ['actions', 'markers', 'touch-pad', 'game-hud']) $(id).hidden = false;
  if (innerWidth <= 760) { $('actions').hidden = true; $('journal-toggle').setAttribute('aria-expanded', 'false'); }
  requestAnimationFrame(() => world?.resize());
  world.renderer.domElement.focus({ preventScroll: true });
}
$('start').onclick = enter;
function announce(message: string) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 6500); }
function renderHealth() {
  const health = healthFor(completed);
  for (const key of ['clarity', 'habitat'] as const) { $(key + '-value').innerHTML = `${health[key]}<span>/100</span>`; $<HTMLMeterElement>(key + '-meter').value = health[key]; $(key + '-meter').textContent = `${health[key]} of 100`; }
  $('wildlife-value').innerHTML = `${health.wildlife} <span>/10</span>`;
  $('action-count').textContent = `${completed.length} / 3`;
  $('mini-count').textContent = `${completed.length} / 3`;
  $('mini-health').textContent = `Clarity ${health.clarity} · Habitat ${health.habitat} · Wildlife ${health.wildlife}`;
  document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
    const done = completed.includes(button.dataset.action as ActionId); button.disabled = done; button.classList.toggle('complete', done);
    button.querySelector('.action-key')!.innerHTML = done ? icon('check') : String(actions.findIndex(a => a.id === button.dataset.action) + 1);
    button.querySelector('small')!.textContent = done ? 'A little care, given.' : actions.find(a => a.id === button.dataset.action)!.description;
  });
  actions.forEach(a => { $('marker-' + a.id).classList.toggle('complete', completed.includes(a.id)); });
  refreshIcons();
}
function takeAction(id: ActionId) {
  if (!world || !started || completed.includes(id) || dialog.open) return;
  if (world.distanceTo(id) > 2.1) { world.visit(id); announce('Walking to the site. Use WASD to take over, then press E when nearby.'); return; }
  world.startAction(id, () => {
    completed.push(id); world!.apply(completed, id); renderHealth();
    announce(actions.find(a => a.id === id)!.response + (completed.length === 3 ? ' All three places cared for. Keep wandering, or reset for a fresh start.' : ''));
    if (tourStep >= 1 && tourStep <= 3) renderTour();
  });
}
function contextPrompt() {
  if (!world) return null;
  if (world.working) {
    const item = actions.find(a => a.id === world!.working) ?? activities.find(a => a.id === world!.working)!;
    const labels: Record<string, string> = { cleanup: 'Collecting litter...', reeds: 'Planting seeds...', drain: 'Clearing the inlet...', nursery: 'Watering seedlings...', sapling: 'Planting a shade tree...', watch: 'Watching quietly...' };
    return { id: world.working, title: labels[world.working], location: item.location, detail: 'A little care in progress' };
  }
  if (world.mode === 'sitting') return { id: 'stand', title: 'Stand up', location: 'A moment in the grove', detail: 'Press E or move when you are ready' };
  if (world.mode === 'boating') return { id: 'boat-return', title: canLeaveBoat(world.playerPosition) ? 'Moor and step ashore' : 'Return to the jetty', location: 'Out on the water', detail: 'W/S row, A/D steer. E returns you to shore.' };
  if (world.mode === 'swimming') return { id: 'swim-return', title: 'Swim back to shore', location: 'The swimming cove', detail: 'WASD to swim. E guides you back.' };
  if (world.nearbyNpc) { const npc = npcs.find(n => n.id === world!.nearbyNpc)!; return { id: `npc-${npc.id}`, title: `Talk to ${npc.name}`, location: npc.role, detail: 'Press E to say hello' }; }
  if (world.nearbyActivity) {
    const activity = activityById(world.nearbyActivity);
    const detail = activity.id === 'watch' ? world.mode !== 'sneaking' ? 'Press C to sneak, then E to observe' : world.park.startled ? 'Stay quiet while the birds settle' : 'The birds are settled. E to observe.' : 'Press E or tap to begin';
    return { id: activity.id, title: activity.title, location: activity.location, detail };
  }
  if (world.nearby) { const action = actions.find(a => a.id === world!.nearby)!; return { id: action.id, title: action.title, location: action.location, detail: 'Press E or tap to help' }; }
  return null;
}
function updateGameHUD() {
  if (!world) return;
  const prompt = contextPrompt();
  const state = `${prompt?.id}|${prompt?.detail}|${world.working}|${world.navigating}|${completed.length}|${world.mode}|${[...world.activityCompleted].join(',')}`;
  if (state !== hudState) {
    hudState = state; $('interaction').hidden = !prompt; $('interaction').dataset.nearby = prompt?.id ?? '';
    if (prompt) { $('interaction-location').textContent = prompt.location; $('interaction-title').textContent = prompt.title; $('interaction-detail').textContent = prompt.detail; $('location-name').textContent = prompt.location; }
    else $('location-name').textContent = 'A whole park to discover';
    $<HTMLButtonElement>('interact').disabled = !!world.working;
    $('work-progress').hidden = !world.working;
    $('navigation-status').hidden = !world.navigating;
    if (world.navigating) {
      const place = actions.find(a => a.id === world!.navigating)?.location ?? activities.find(a => a.id === world!.navigating)?.location ?? npcs.find(n => n.id === world!.navigating)?.name ?? 'the shore';
      $('navigation-status').textContent = `On the way to ${place} · WASD to take over`;
    }
    $('walk-hint').hidden = !!prompt || !!world.navigating;
    $('mode-label').textContent = modeLabels[world.mode];
    $('sneak-toggle').setAttribute('aria-pressed', String(world.mode === 'sneaking'));
    $<HTMLButtonElement>('sneak-toggle').disabled = !!world.working || !['walking', 'sneaking'].includes(world.mode);
    $<HTMLButtonElement>('run-toggle').disabled = world.mode !== 'walking' || !!world.working;
    $('explore-count').textContent = `${world.activityCompleted.size}/6`;
    document.querySelectorAll<HTMLButtonElement>('[data-activity]').forEach(button => {
      const id = button.dataset.activity as ActivityId, done = world!.activityCompleted.has(id);
      button.classList.toggle('visited', done); button.disabled = done && activityById(id).once;
      button.querySelector('.activity-check')!.textContent = done ? '✓' : '';
    });
  }
  $('run-toggle').setAttribute('aria-pressed', String(world.keys.has('shift')));
  $<HTMLProgressElement>('work-progress').value = world.workProgress;
}
function interactNearby() {
  if (!world || dialog.open || world.working) return;
  if (['sitting', 'boating', 'swimming'].includes(world.mode)) { world.returnToShore(); return; }
  if (world.nearbyNpc) { showNpc(world.nearbyNpc); return; }
  if (world.nearbyActivity) { world.interactActivity(world.nearbyActivity); return; }
  if (world.nearby) takeAction(world.nearby);
}
function closeJournalOnPhone() { if (innerWidth <= 760) { $('actions').hidden = true; $('journal-toggle').setAttribute('aria-expanded', 'false'); } }
function selectDestination(id: ActionId) {
  if (world?.working) return;
  world?.visit(id);
  if (innerWidth <= 760) { $('actions').hidden = true; $('journal-toggle').setAttribute('aria-expanded', 'false'); }
}
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => { button.onclick = () => selectDestination(button.dataset.action as ActionId); });
$('interact').onclick = interactNearby;
$('journal-toggle').onclick = () => { if (innerWidth <= 760) { $('health').hidden = true; $('health-toggle').setAttribute('aria-expanded', 'false'); } $('actions').hidden = !$('actions').hidden; $('journal-toggle').setAttribute('aria-expanded', String(!$('actions').hidden)); };
$('health-toggle').onclick = () => { if (innerWidth <= 760) { $('actions').hidden = true; $('journal-toggle').setAttribute('aria-expanded', 'false'); } $('health').hidden = !$('health').hidden; $('health-toggle').setAttribute('aria-expanded', String(!$('health').hidden)); };
document.querySelectorAll<HTMLButtonElement>('[data-visit]').forEach(button => { button.onclick = () => {
  selectDestination(button.dataset.visit as ActionId);
}; });
function reset() {
  completed = []; world?.reset(); hudState = ''; renderHealth(); tourStep = -1; $('tour').hidden = true; announce('A fresh beginning. The lake is ready for your care.');
}
$('reset').onclick = reset;
function showPanel(title: string, body: string) {
  dialog.classList.remove('dialog-wide'); $('dialog-content').innerHTML = `<h2>${title}</h2>${body}`; if (!dialog.open) dialog.showModal(); if (world) { world.paused = true; world.keys.clear(); } refreshIcons();
}

function showNpc(id: NpcId, line = 0) {
  const npc = npcs.find(n => n.id === id)!;
  showPanel(npc.name, `<div class="npc-identity"><span class="npc-avatar">${npc.name[0]}</span><div><strong>${npc.role}</strong><small>A neighbour in this fictional park</small></div></div><p class="npc-speech">${npc.lines[line]}</p><div class="dialog-choices"><button class="primary" data-npc-next="${id}" data-line="${(line + 1) % npc.lines.length}">${line === 0 ? 'Tell me more' : 'What else should I know?'} ${icon('arrow-right')}</button><button class="secondary" data-map-kind="activity" data-map-id="${npc.destination}">Show me ${activityById(npc.destination).location.toLowerCase()}</button><button class="secondary" data-goodbye>See you around</button></div>`);
}
function showMap() {
  if (!world) return;
  const project = (x: number, z: number) => `${300 + x * 5.5},${200 + z * 5.5}`;
  const outline = Array.from({ length: 97 }, (_, i) => { const angle = i / 96 * Math.PI * 2; const radius = shoreRadius(angle); return `${i ? 'L' : 'M'}${project(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.66)}`; }).join(' ') + 'Z';
  const player = world.playerPosition;
  const mapRows = (kind: string, items: { id: string; title: string; description: string }[]) => items.map(item => `<button data-map-kind="${kind}" data-map-id="${item.id}"><span><strong>${item.title}</strong><small>${item.description}</small></span>${icon('arrow-right')}</button>`).join('');
  showPanel('Find your own little adventure.', `<p class="map-intro">Choose a place for an assisted walk. WASD takes over whenever you like.</p><div class="park-map"><svg viewBox="0 0 600 400" role="img" aria-label="Park map. The lake is central, with a picnic grove to the west, nursery to the east, bird hide to the north, and jetty to the south."><rect width="600" height="400" rx="12" fill="#e3e7ce"/><ellipse cx="300" cy="200" rx="250" ry="164" fill="#d2dcb8"/><ellipse cx="300" cy="200" rx="153" ry="111" fill="none" stroke="#b9ab7f" stroke-width="7"/><path d="${outline}" fill="#8cb2a0" stroke="#f1d99d" stroke-width="6"/>${activities.map((a, i) => `<g transform="translate(${project(a.point.x, a.point.z)})"><circle r="12" fill="#365c46" stroke="#fff9e1" stroke-width="2"/><text y="4" text-anchor="middle" fill="#fff9e1" font-size="11" font-family="sans-serif">${i + 1}</text></g>`).join('')}${npcs.map(n => `<g transform="translate(${project(n.point.x, n.point.z)})"><circle r="5" fill="#bf8c52" stroke="#fff9e1" stroke-width="2"/></g>`).join('')}<g transform="translate(${project(player.x, player.z)})"><circle r="9" fill="#fff" stroke="#294833" stroke-width="3"/><circle r="3" fill="#294833"/></g><text x="24" y="32" fill="#476443" font-size="12" font-family="sans-serif">N ↑</text><text x="24" y="378" fill="#476443" font-size="11" font-family="sans-serif">White dot: you · Gold dots: neighbours</text></svg></div><div class="map-destinations"><section><h3>Explore the park</h3>${mapRows('activity', activities.map((a, i) => ({ id: a.id, title: `${i + 1}. ${a.title}`, description: a.location })))}</section><section><h3>Meet the neighbours</h3>${mapRows('npc', npcs.map(n => ({ id: n.id, title: n.name, description: n.role })))}<h3>Care for the lake</h3>${mapRows('care', actions.map(a => ({ id: a.id, title: a.title, description: a.location })))}</section></div>`);
  dialog.classList.add('dialog-wide');
}
$('map-toggle').onclick = showMap;
$('sneak-toggle').onclick = () => world?.toggleSneak();
$('run-toggle').onclick = () => { if (!world) return; if (world.keys.has('shift')) world.keys.delete('shift'); else world.keys.add('shift'); };
document.querySelectorAll<HTMLButtonElement>('[data-journal-tab]').forEach(button => { button.onclick = () => {
  const explore = button.dataset.journalTab === 'explore'; $('care-tasks').hidden = explore; $('explore-tasks').hidden = !explore;
  document.querySelectorAll('[data-journal-tab]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
}; });
document.querySelectorAll<HTMLButtonElement>('[data-activity]').forEach(button => { button.onclick = () => { world?.visitActivity(button.dataset.activity as ActivityId); closeJournalOnPhone(); }; });
dialog.addEventListener('click', event => {
  const target = event.target as Element;
  const destination = target.closest<HTMLElement>('[data-map-kind]');
  if (destination) {
    dialog.close();
    const id = destination.dataset.mapId!, kind = destination.dataset.mapKind;
    if (kind === 'activity') world?.visitActivity(id as ActivityId); else if (kind === 'npc') world?.visitNpc(id as NpcId); else selectDestination(id as ActionId);
    closeJournalOnPhone();
  }
  const next = target.closest<HTMLElement>('[data-npc-next]'); if (next) showNpc(next.dataset.npcNext as NpcId, Number(next.dataset.line));
  if (target.closest('[data-goodbye]')) dialog.close();
});
dialog.addEventListener('close', () => { if (world) world.paused = false; });
$('dialog-close').onclick = () => dialog.close();
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
const how = () => showPanel('Connections, not predictions.', `
  <p>This is an <strong>illustrative simulation</strong> of a fictional, Bengaluru-inspired lake. No scores are measured lake data. Sitting, swimming, boating, nursery care, and birdwatching are game activities, not evidence of real-world ecological or water-safety outcomes. The scene compresses ecological change into seconds to make connections visible.</p>
  <div class="note-box">The same choices always give the same results. Actions can be taken once each, in any order. There is no timer and no wrong first step.</div>
