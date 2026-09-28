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
