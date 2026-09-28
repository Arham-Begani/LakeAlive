import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom, healthFor, type ActionId } from './simulation';
import { cameraRelativeMovement, constrainToShore, constrainToPark, constrainToWater, isWater, cameraBoomFraction, type SphereObstacle } from './movement';
import { MAP_SCALE, PARK_RADIUS, activities, activityById, npcs, boatMooring, boatExit, canLeaveBoat, type ActivityId, type NpcId, type PlayerMode } from './activities';
import { ParkLife } from './park';

const palette = { grass: 0x83966b, bank: 0xbdb48a, soil: 0x9e8160, trunk: 0x796247, leaf: 0x567854, leafLight: 0x82925c };
export const locations: Record<ActionId, THREE.Vector3> = {
  cleanup: new THREE.Vector3(-6.3 * MAP_SCALE, 1.1, 5.7 * MAP_SCALE), reeds: new THREE.Vector3(7.5 * MAP_SCALE, 1.1, 2.6 * MAP_SCALE), drain: new THREE.Vector3(-6.4 * MAP_SCALE, 1.1, -4.9 * MAP_SCALE),
};
export class LakeWorld {
  private resolveReady!: () => void;
  readonly ready = new Promise<void>(resolve => { this.resolveReady = resolve; });
  private firstFrame = true;
  private playerShadow = new THREE.Mesh(new THREE.CircleGeometry(0.38, 24), new THREE.MeshBasicMaterial({ color: 0x293c2c, transparent: true, opacity: 0.18, depthWrite: false }));
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  private overviewCamera = new THREE.OrthographicCamera();
  private followCamera = new THREE.PerspectiveCamera(58, 1, 0.08, 180);
  get camera() { return this.playing ? this.followCamera : this.overviewCamera; }
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  playing = false;
  paused = false;
  keys = new Set<string>();
  nearby: ActionId | null = null;
  navigating: string | null = null;
  working: ActionId | ActivityId | null = null;
  mode: PlayerMode = 'walking';
  nearbyActivity: ActivityId | null = null;
  nearbyNpc: NpcId | null = null;
  activityCompleted = new Set<string>();
  park: ParkLife;
  onNotice?: (message: string) => void;
  private cameraObstacles: SphereObstacle[] = [];
  private boatHeading = Math.PI;
  private boatMoving = false;
  private gameTime = 0;
  private windUniform = { value: 0 };
  workProgress = 0;
  private actionComplete?: () => void;
  private player = new THREE.Vector3(-5, 0.3, 14);
  private heading = Math.PI;
  private walkCycle = 0;
  private limbs: THREE.Group[] = [];
  private knees: THREE.Group[] = [];
  private torso = new THREE.Group();
  private tool = new THREE.Group();
  private landscape = new THREE.Group();
  private forest = new THREE.Group();
  private trees: { group: THREE.Group; size: number }[] = [];
  private colliders: { x: number; z: number; radius: number }[] = [];
  private route: THREE.Vector3[] = [];
  private cameraYaw = 0.35;
  private cameraPitch = 0.3;
  private cameraDistance = 5.8;
  private cameraReady = false;
  private aim = new THREE.Vector3();
  private random = seededRandom();
  private waterMaterial = new THREE.MeshPhongMaterial({ color: 0x759a8e, shininess: 80, specular: 0xe4cca0, transparent: true, opacity: 0.94, flatShading: true });
  private waterTarget = new THREE.Color(0x759a8e);
  private water: THREE.Mesh;
  private reeds = new THREE.Group();
  private litter = new THREE.Group();
  private inletLitter = new THREE.Group();
  private fish: THREE.Group[] = [];
  private birds: THREE.Group[] = [];
  private ripples: THREE.Mesh[] = [];
  private avatar = new THREE.Group();
  private particles: THREE.Points;
  private burst: THREE.Points;
  private burstTime = -10;
  private time = 0;
  private last = 0;
  private softwareRendering = false;
  private frame = 0;
  private orbit = 0;
  private zoom = 1;
  private drag: { x: number; y: number; moved: boolean } | null = null;
  private completed: ActionId[] = [];
  private resizeObserver: ResizeObserver;
  private raycaster = new THREE.Raycaster();
  private sunlight: THREE.DirectionalLight;
  onFrame?: () => void;

  constructor(private container: HTMLElement, onError: () => void) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    const gl = this.renderer.getContext();
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    this.softwareRendering = !!debug && /swiftshader|llvmpipe|software/i.test(String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)));
    this.renderer.setPixelRatio(this.softwareRendering ? 0.75 : Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0xf1eee2, 0);
    this.renderer.domElement.setAttribute('aria-label', 'Third-person lake exploration. WASD to walk, drag to look, E to interact nearby.');
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(this.frame); onError(); });
    this.scene.add(new THREE.HemisphereLight(0xfff1d3, 0x687d67, 2.5));
    this.sunlight = new THREE.DirectionalLight(0xffdaa0, 3.3);
    this.sunlight.position.set(-25, 50, 22);
    this.sunlight.castShadow = true;
    Object.assign(this.sunlight.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 150 });
    this.sunlight.shadow.mapSize.set(1024, 1024);
    this.sunlight.shadow.normalBias = 0.035;
    this.scene.add(this.sunlight);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.13 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -1.65; ground.receiveShadow = true; this.scene.add(ground);
    this.makeIsland();
    const waterGeometry = new THREE.CircleGeometry(1, 96);
    waterGeometry.rotateX(-Math.PI / 2);
    const pos = waterGeometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const a = Math.atan2(pos.getZ(i), pos.getX(i));
      const irregular = 1 + 0.045 * Math.sin(a * 3) + 0.025 * Math.cos(a * 7);
      pos.setXYZ(i, pos.getX(i) * 8.1 * irregular, 0.1, pos.getZ(i) * 5.35 * irregular);
    }
    this.water = new THREE.Mesh(waterGeometry, this.waterMaterial); this.water.receiveShadow = true; this.scene.add(this.water);
    this.makeNature(); this.makeDock(); this.makeInlet();
    this.scene.add(this.reeds, this.litter, this.inletLitter);
    this.scaleLake(); this.makeAvatar(); this.makeLandscape(); this.makeOuterTrees();
    this.scene.add(this.avatar);
    this.avatar.traverse(object => { if (object instanceof THREE.Mesh) object.castShadow = false; });
    this.playerShadow.rotation.x = -Math.PI / 2; this.scene.add(this.playerShadow);
    this.park = new ParkLife(this.avatar); this.scene.add(this.park.root);
    this.torso.add(this.park.binoculars); this.park.binoculars.position.set(0, 0.76, 0.35); this.park.binoculars.visible = false;
    this.limbs[3].add(this.park.wateringCan); this.park.wateringCan.position.set(0, -0.5, 0.05); this.park.wateringCan.visible = false;
    const lifeJacket = new THREE.Group(); lifeJacket.name = 'life-jacket'; this.torso.add(lifeJacket);
    for (const side of [-1, 1]) { const panel = this.mesh(new THREE.BoxGeometry(0.17, 0.42, 0.1), 0xe5a247, lifeJacket); panel.position.set(side * 0.12, 0.27, 0.21); }
    lifeJacket.visible = false;
    this.colliders.push({ x: -26, z: 9, radius: 0.85 }, { x: 25.2, z: 11.7, radius: 0.32 }, { x: 29, z: 11.7, radius: 0.32 });
    this.scene.add(this.forest); this.batchScenery();
    this.prepareTreeAnimation();
    this.particles = this.makeParticles(45, 0xf6dfa3, 0.055);
    this.burst = this.makeParticles(35, 0xf4cc66, 0.12); this.burst.visible = false;
    this.bindControls();
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(container);
    this.resize(); this.frame = requestAnimationFrame(t => this.tick(t));
  }
  private mesh(geometry: THREE.BufferGeometry, color: number, parent: THREE.Object3D = this.scene) {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }));
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  private scaleLake() {
    for (const object of [...this.scene.children]) {
      if (object instanceof THREE.Light || object === this.sunlight.target || (object instanceof THREE.Mesh && object.material instanceof THREE.ShadowMaterial)) continue;
      object.position.x *= MAP_SCALE; object.position.z *= MAP_SCALE;
      if (this.trees.some(tree => tree.group === object)) { object.scale.multiplyScalar(1.4); }
      else if (!this.fish.includes(object as THREE.Group) && !this.birds.includes(object as THREE.Group)) { object.scale.x *= MAP_SCALE; object.scale.z *= MAP_SCALE; }
    }
    this.trees.forEach(tree => { tree.size *= 1.4; });
    this.colliders.forEach(c => { c.x *= MAP_SCALE; c.z *= MAP_SCALE; c.radius *= 1.4; });
  }
  private makeOuterTrees() {
    const random = seededRandom(1907);
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * Math.PI * 2, r = 31 + random() * 12;
      const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.66;
      if (activities.some(place => Math.hypot(x - place.point.x, z - place.point.z) < 4) || npcs.some(npc => Math.hypot(x - npc.point.x, z - npc.point.z) < 3)) continue;
      this.makeTree(x, z, 1.2 + random() * 0.8, random());
    }
  }
  private prepareTreeAnimation() {
    for (const tree of this.trees) {
      const p = tree.group.position, size = tree.size;
      this.cameraObstacles.push({ x: p.x, y: p.y + 0.8 * size, z: p.z, radius: 0.36 * size }, { x: p.x, y: p.y + 2.1 * size, z: p.z, radius: 1.08 * size });
    }
      this.forest.traverse(object => {
        if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) return;
        object.material.onBeforeCompile = shader => {
          shader.uniforms.uWindTime = this.windUniform;
          shader.vertexShader = 'uniform float uWindTime;\n' + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float sway = max(0.0, position.y - 1.8); transformed.x += sin(uWindTime * 1.15 + position.y * 1.3 + position.z * 0.15) * sway * 0.025; transformed.z += cos(uWindTime * 0.85 + position.x) * sway * 0.018;');
        };
        object.material.customProgramCacheKey = () => 'lakealive-wind-v1';
      });
  }
  private ring(inner: number, outer: number, y: number, color: number) {
    const vertices: number[] = []; const colors: number[] = []; const indices: number[] = [];
    const segments = 96;
    for (let r = 0; r <= 1; r++) for (let i = 0; i <= segments; i++) {
      const a = i / segments * Math.PI * 2, radius = r ? outer : inner;
      const n = 1 + 0.045 * Math.sin(a * 3) + 0.025 * Math.cos(a * 7);
      vertices.push(Math.cos(a) * radius * n, y + (r ? 0.035 * Math.sin(i * 7) : 0), Math.sin(a) * radius * n * 0.66);
      const c = new THREE.Color(color).multiplyScalar(0.94 + this.random() * 0.12); colors.push(c.r, c.g, c.b);
    }
    for (let i = 0; i < segments; i++) { const k = segments + 1; indices.push(i, i + k, i + 1, i + 1, i + k, i + k + 1); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 })); mesh.receiveShadow = true; this.scene.add(mesh);
  }
  private makeIsland() {
    const base = this.mesh(new THREE.CylinderGeometry(12.35, 11.1, 1.5, 64), palette.soil); base.scale.z = 0.66; base.position.y = -0.8;
    const rim = this.mesh(new THREE.CylinderGeometry(12.6, 12.35, 0.28, 64, 1, true), palette.grass); rim.scale.z = 0.66; rim.position.y = -0.02;
    this.ring(7.9, 8.7, 0.18, palette.bank); this.ring(8.7, 12.4, 0.22, palette.grass); this.ring(9.35, 10.25, 0.26, 0xd2c4a1);
    // A few exposed, faceted stones in the island's cutaway edge.
    for (let i = 0; i < 55; i++) {
      const a = this.random() * Math.PI * 2; const rock = this.mesh(new THREE.DodecahedronGeometry(0.12 + this.random() * 0.23, 0), 0x9e9479);
      rock.position.set(Math.cos(a) * 12.05, -0.6 - this.random() * 0.6, Math.sin(a) * 7.95); rock.scale.set(1.5, 0.7, 1);
    }
  }
  private makeTree(x: number, z: number, size: number, type: number) {
    this.colliders.push({ x, z, radius: 0.26 * size + 0.2 });
    const tree = new THREE.Group(); tree.position.set(x, 0.25, z); tree.scale.setScalar(size); this.scene.add(tree); this.trees.push({ group: tree, size });
    const trunk = this.mesh(new THREE.CylinderGeometry(0.085, 0.15, 1.5, 5), palette.trunk, tree); trunk.position.y = 0.75;
    if (type > 0.8) {
      for (let i = 0; i < 3; i++) { const top = this.mesh(new THREE.ConeGeometry(0.8 - i * 0.14, 1.6, 6), i % 2 ? 0x567459 : 0x688469, tree); top.position.y = 1.4 + i * 0.55; }
    } else {
      for (let j = 0; j < 4; j++) {
        const top = this.mesh(new THREE.IcosahedronGeometry(0.7 + this.random() * 0.25, 0), [0x668353, 0x82965d, 0x526f49, 0x9ba86d][j], tree);
        top.position.set((this.random() - 0.5) * 0.75, 1.7 + this.random() * 0.85, (this.random() - 0.5) * 0.65); top.scale.y = 0.85;
      }
    }
  }
  private makeNature() {
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * Math.PI * 2; const r = 10.8 + this.random();
      if (a > 0.25 && a < 2.6 && i % 3) continue;
      this.makeTree(Math.cos(a) * r, Math.sin(a) * r * 0.66, 0.7 + this.random() * 0.65, this.random());
    }
    for (let i = 0; i < 95; i++) {
      const a = this.random() * Math.PI * 2, r = 8.65 + this.random() * 0.5;
      const rock = this.mesh(new THREE.IcosahedronGeometry(0.10 + this.random() * 0.22, 0), i % 3 ? 0xb3ac8e : 0x929d75);
      rock.position.set(Math.cos(a) * r, 0.27, Math.sin(a) * r * 0.66); rock.scale.set(1.5, 0.65, 1);
    }
    for (let i = 0; i < 160; i++) {
      const a = this.random() * Math.PI * 2, r = 8.2 + this.random() * 0.55;
      const group = new THREE.Group(); group.position.set(Math.cos(a) * r, 0.18, Math.sin(a) * r * 0.66);
      const newReed = i > 55; if (newReed) this.reeds.add(group); else this.scene.add(group);
      for (let j = 0; j < 3; j++) {
        const h = 0.35 + this.random() * 0.65;
        const blade = this.mesh(new THREE.ConeGeometry(0.035, h, 3), j % 2 ? 0x75864d : 0x567453, group);
        blade.position.set(j * 0.075, h / 2, j * 0.02); blade.rotation.z = (this.random() - 0.5) * 0.3;
        if (j === 0) { const head = this.mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.17, 4), 0x91714b, group); head.position.y = h; }
      }
    }
    this.reeds.scale.y = 0.03;
    for (let i = 0; i < 14; i++) {
      const a = 1.65 + this.random() * 1.1;
      const rubbish = this.mesh(new THREE.BoxGeometry(0.18, 0.08, 0.26), i % 2 ? 0xe7ddc0 : 0xb29170, this.litter);
      rubbish.position.set(Math.cos(a) * 8.7, 0.28, Math.sin(a) * 5.8); rubbish.rotation.y = this.random() * 5;
    }
    for (let i = 0; i < 8; i++) {
      const fish = new THREE.Group();
      const body = this.mesh(new THREE.SphereGeometry(0.11, 6, 4), 0xe7b36c, fish); body.scale.set(2, 0.5, 0.8);
      const tail = this.mesh(new THREE.ConeGeometry(0.11, 0.17, 3), 0xd99955, fish); tail.rotation.z = -Math.PI / 2; tail.position.x = -0.24;
      this.scene.add(fish); this.fish.push(fish);
    }
    for (let i = 0; i < 5; i++) {
      const bird = new THREE.Group(); const body = this.mesh(new THREE.SphereGeometry(0.12, 6, 4), 0xfff2d4, bird); body.scale.set(1.6, 0.6, 0.7);
      for (const side of [-1, 1]) { const wing = this.mesh(new THREE.ConeGeometry(0.17, 0.55, 3), 0xefe7ce, bird); wing.rotation.x = side * Math.PI / 2; wing.position.z = side * 0.22; }
      const beak = this.mesh(new THREE.ConeGeometry(0.035, 0.17, 3), 0xc69b55, bird); beak.rotation.z = -Math.PI / 2; beak.position.x = 0.25;
      this.scene.add(bird); this.birds.push(bird);
    }
    for (let i = 0; i < 38; i++) {
      const ripple = new THREE.Mesh(new THREE.PlaneGeometry(0.3 + this.random() * 0.65, 0.025), new THREE.MeshBasicMaterial({ color: 0xf4e8be, transparent: true, opacity: 0.22, depthWrite: false }));
      ripple.rotation.x = -Math.PI / 2; const a = this.random() * Math.PI * 2, r = Math.sqrt(this.random());
      ripple.position.set(Math.cos(a) * r * 7.8, 0.13, Math.sin(a) * r * 4.9); this.scene.add(ripple); this.ripples.push(ripple);
    }
    // Lily pads are native-habitat symbols, not a species-identification model.
    for (let i = 0; i < 16; i++) {
      const pad = this.mesh(new THREE.CircleGeometry(0.14 + this.random() * 0.16, 9, 0.2, Math.PI * 1.85), 0x849759); pad.rotation.x = -Math.PI / 2;
      pad.position.set(4.8 + this.random() * 1.4, 0.14, -1 + this.random() * 2);
      if (i % 4 === 0) { const flower = this.mesh(new THREE.IcosahedronGeometry(0.09, 0), 0xe9c5ad); flower.position.copy(pad.position); flower.position.y += 0.06; }
    }
    for (const x of [-4, 4]) { const bench = new THREE.Group(); bench.position.set(x, 0.35, -6.6); this.scene.add(bench);
      for (let i = 0; i < 3; i++) { const slat = this.mesh(new THREE.BoxGeometry(1.2, 0.07, 0.12), 0x9f7951, bench); slat.position.set(0, 0.36, i * 0.14); }
      for (const s of [-1, 1]) { const leg = this.mesh(new THREE.BoxGeometry(0.07, 0.38, 0.42), 0x5c6452, bench); leg.position.set(s * 0.45, 0.18, 0.15); }
    }
  }
  private makeDock() {
    const dock = new THREE.Group(); dock.position.set(1.8, 0.38, 5.9); dock.rotation.y = -0.12; this.scene.add(dock);
    for (let i = 0; i < 13; i++) { const plank = this.mesh(new THREE.BoxGeometry(1.65, 0.1, 0.22), i % 2 ? 0xb59263 : 0xc4a477, dock); plank.position.z = -i * 0.24; }
    for (const x of [-0.7, 0.7]) for (const z of [0, -2.8]) {
      const post = this.mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.9, 6), 0x8b6e49, dock); post.position.set(x, 0, z);
      const cap = this.mesh(new THREE.SphereGeometry(0.095, 6, 4), 0xdbc49a, dock); cap.position.set(x, 0.46, z);
    }
    const sign = new THREE.Group(); sign.position.set(-1, 0.3, 6.7); sign.rotation.y = 0.3; this.scene.add(sign);
    const post = this.mesh(new THREE.BoxGeometry(0.09, 0.8, 0.09), 0x755f45, sign); post.position.y = 0.4;
    const board = this.mesh(new THREE.BoxGeometry(0.65, 0.38, 0.1), 0x4a6756, sign); board.position.y = 0.8;
  }
  private makeInlet() {
    const inlet = this.mesh(new THREE.BoxGeometry(1.2, 0.18, 1.8), 0x9a9e88); inlet.position.set(-6.4, 0.28, -4.9); inlet.rotation.y = -0.7;
    for (let i = 0; i < 7; i++) { const grate = this.mesh(new THREE.BoxGeometry(0.055, 0.08, 1), 0x667365); grate.position.set(-6.85 + i * 0.15, 0.41, -4.9); }
    for (let i = 0; i < 9; i++) { const trash = this.mesh(new THREE.BoxGeometry(0.16, 0.06, 0.19), i % 2 ? 0xd4b98a : 0xc7d1c2, this.inletLitter); trash.position.set(-6.5 + this.random(), 0.45, -4.7 + this.random()); }
  }
  private makeAvatar() {
    this.avatar.add(this.torso); this.torso.name = 'torso'; this.torso.position.y = 0.73;
    const body = this.mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.53, 8), 0xe3a24c, this.torso); body.position.y = 0.27; body.scale.z = 0.7;
    const collar = this.mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.09, 8), 0xf1c47e, this.torso); collar.position.y = 0.55;
    const head = this.mesh(new THREE.SphereGeometry(0.23, 10, 8), 0xb98057, this.torso); head.position.set(0, 0.8, 0.015); head.scale.set(0.88, 1.12, 0.88);
    const hair = this.mesh(new THREE.SphereGeometry(0.235, 10, 8), 0x3f3027, this.torso); hair.position.set(0, 0.9, -0.025); hair.scale.set(0.92, 0.7, 0.87);
    const nose = this.mesh(new THREE.BoxGeometry(0.065, 0.07, 0.09), 0xae724d, this.torso); nose.position.set(0, 0.79, 0.21);
    for (const x of [-0.075, 0.075]) { const eye = this.mesh(new THREE.SphereGeometry(0.022, 6, 4), 0x322c26, this.torso); eye.position.set(x, 0.84, 0.19); }
    const brim = this.mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.045, 12), 0xe9cf92, this.torso); brim.position.y = 1;
    const crown = this.mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.17, 10), 0xd8b879, this.torso); crown.position.y = 1.1;
    const band = this.mesh(new THREE.CylinderGeometry(0.251, 0.254, 0.055, 10), 0x6e7449, this.torso); band.position.y = 1.04;
    const pack = this.mesh(new THREE.BoxGeometry(0.33, 0.4, 0.2), 0x476859, this.torso); pack.position.set(0, 0.28, -0.24);
    const pocket = this.mesh(new THREE.BoxGeometry(0.25, 0.17, 0.06), 0x6c8465, this.torso); pocket.position.set(0, 0.18, -0.37);
    for (const x of [-0.15, 0.15]) {
      const strap = this.mesh(new THREE.BoxGeometry(0.05, 0.48, 0.035), 0x5a674c, this.torso); strap.position.set(x, 0.28, 0.175);
      const leg = new THREE.Group(); leg.name = `limb-${this.limbs.length}`; leg.position.set(x * 0.8, 0.7, 0); this.avatar.add(leg); this.limbs.push(leg);
      const trouser = this.mesh(new THREE.CylinderGeometry(0.105, 0.09, 0.29, 6), 0x45594e, leg); trouser.position.y = -0.145;
      const knee = new THREE.Group(); knee.position.y = -0.29; leg.add(knee); this.knees.push(knee);
      const shin = this.mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.26, 6), 0x45594e, knee); shin.position.y = -0.13;
      const boot = this.mesh(new THREE.BoxGeometry(0.19, 0.15, 0.3), 0x614f38, knee); boot.position.set(0, -0.32, 0.045);
    }
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.name = `limb-${this.limbs.length}`; arm.position.set(side * 0.29, 0.46, 0); this.torso.add(arm); this.limbs.push(arm);
      const sleeve = this.mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.25, 6), 0xd39343, arm); sleeve.position.y = -0.13;
      const forearm = this.mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.26, 6), 0xb98057, arm); forearm.position.y = -0.36;
      const hand = this.mesh(new THREE.SphereGeometry(0.075, 6, 5), 0xc38e63, arm); hand.position.y = -0.5;
    }
    this.limbs[3].add(this.tool); this.tool.position.set(0, -0.5, 0.12);
    const handle = this.mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.35, 6), 0x906744, this.tool); handle.rotation.x = Math.PI / 2;
    const blade = this.mesh(new THREE.ConeGeometry(0.09, 0.2, 4), 0xafb6a2, this.tool); blade.rotation.x = Math.PI / 2; blade.position.z = 0.25;
    this.tool.visible = false;
    this.avatar.position.copy(this.player);
  }
  private makeLandscape() {
    this.scene.add(this.landscape);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(160, 24, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { topColor: { value: new THREE.Color(0xa8c6c4) }, horizonColor: { value: new THREE.Color(0xf0d6aa) } },
      vertexShader: 'varying vec3 vPosition; void main() { vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 topColor; uniform vec3 horizonColor; varying vec3 vPosition; void main() { float blend = smoothstep(-0.08, 0.7, normalize(vPosition).y); gl_FragColor = vec4(mix(horizonColor, topColor, blend), 1.0);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }',
    })); this.landscape.add(sky);
    const meadow = this.mesh(new THREE.CircleGeometry(130, 96), 0x8c9b71, this.landscape); meadow.rotation.x = -Math.PI / 2; meadow.position.y = -0.04;
    const random = seededRandom(781);
    for (let i = 0; i < 58; i++) {
      const a = random() * Math.PI * 2, r = 76 + random() * 30;
      const mound = this.mesh(new THREE.IcosahedronGeometry(3 + random() * 7, 1), i % 2 ? 0x889b73 : 0x9ca681, this.landscape);
      mound.position.set(Math.cos(a) * r, -1.6, Math.sin(a) * r); mound.scale.y = 0.4 + random() * 0.25;
      if (i < 32) {
        const tree = new THREE.Group(); tree.position.set(Math.cos(a) * (32 + r * 0.3), 0, Math.sin(a) * (32 + r * 0.3)); this.landscape.add(tree);
        const trunk = this.mesh(new THREE.CylinderGeometry(0.12, 0.2, 3, 5), 0x79684e, tree); trunk.position.y = 1.5;
        const top = this.mesh(new THREE.IcosahedronGeometry(1.7, 1), i % 2 ? 0x637e5f : 0x7a8f62, tree); top.position.y = 3.4; top.scale.y = 1.3;
      }
    }
    // Distant urban silhouettes keep the setting a city lake, not wilderness.
    for (let i = 0; i < 20; i++) {
      const height = 2 + random() * 6;
      const building = this.mesh(new THREE.BoxGeometry(1.5 + random() * 2, height, 2), 0xa9aa96, this.landscape);
      building.position.set(-45 + i * 4.5, height / 2 - 0.1, -70 - random() * 10);
    }
    const sun = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 12), new THREE.MeshBasicMaterial({ color: 0xffe6aa, fog: false })); sun.position.set(-48, 24, -68); this.landscape.add(sun);
    for (let i = 0; i < 12; i++) {
      const cloud = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 1), new THREE.MeshBasicMaterial({ color: 0xf8e5c6 })); cloud.position.set(-50 + random() * 100, 22 + random() * 10, -65 + random() * 25); cloud.scale.set(2.5, 0.22, 0.6); this.landscape.add(cloud);
    }
    // A seed bed and collection sack make the interaction sites tangible.
    const bed = this.mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.08, 10), 0x8f7553); bed.position.set(7.8 * MAP_SCALE, 0.3, 2.8 * MAP_SCALE);
    for (let i = 0; i < 3; i++) { const packet = this.mesh(new THREE.BoxGeometry(0.15, 0.2, 0.04), 0xd9cf91); packet.position.set(7.8 * MAP_SCALE + i * 0.18, 0.44, 3.4 * MAP_SCALE); packet.rotation.x = -0.2; }
    const sack = this.mesh(new THREE.IcosahedronGeometry(0.35, 1), 0x5d7867); sack.position.set(-6.6 * MAP_SCALE, 0.56, 5.8 * MAP_SCALE); sack.scale.y = 1.3;
    this.landscape.visible = false;
  }
  private makeParticles(count: number, color: number, size: number) {
    const positions = Array.from({ length: count * 3 }, (_, i) => i % 3 === 1 ? this.random() * 5 + 0.5 : (this.random() - 0.5) * 22);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.7 })); this.scene.add(points); return points;
  }
  private batchScenery() {
    // Merge stationary geometry by color: hundreds of blades and tree crowns
    // become a few draw calls, while interactive groups remain independent.
    this.scene.updateMatrixWorld(true);
    const dynamicRoots = new Set<THREE.Object3D>([this.avatar, this.park.root, this.landscape, this.reeds, this.litter, this.inletLitter, ...this.fish, ...this.birds, ...this.trees.map(tree => tree.group)]);
    const batch = (root: THREE.Object3D, skipDynamic: boolean) => {
      const buckets = new Map<string, { material: THREE.MeshStandardMaterial; meshes: THREE.Mesh[]; geometry: THREE.BufferGeometry[] }>();
      const inverse = root.matrixWorld.clone().invert();
      root.traverse(object => {
        if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial) || object.material.vertexColors) return;
        if (skipDynamic) { let parent: THREE.Object3D | null = object; while (parent && parent !== root) { if (dynamicRoots.has(parent)) return; parent = parent.parent; } }
        const key = object.material.color.getHexString();
        if (!buckets.has(key)) buckets.set(key, { material: object.material, meshes: [], geometry: [] });
        const bucket = buckets.get(key)!;
        const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
        geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
        bucket.geometry.push(geometry); bucket.meshes.push(object);
      });
      for (const bucket of buckets.values()) {
        const geometry = mergeGeometries(bucket.geometry); if (!geometry) continue;
        for (const mesh of bucket.meshes) mesh.removeFromParent();
        for (const part of bucket.geometry) part.dispose();
        const merged = new THREE.Mesh(geometry, bucket.material); merged.castShadow = true; merged.receiveShadow = true; root.add(merged);
      }
    };
    batch(this.scene, true);
    for (const root of [this.reeds, this.litter, this.inletLitter, this.landscape, this.park.static]) batch(root, false);
    for (const { group } of this.trees) this.forest.attach(group);
    batch(this.forest, false);
  }
  private bindControls() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', e => { this.drag = { x: e.clientX, y: e.clientY, moved: false }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (!this.drag || this.paused) return;
      const delta = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      if (Math.abs(delta) + Math.abs(dy) > 3 || this.drag.moved) {
