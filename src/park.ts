import * as THREE from 'three';
import { activities, boatMooring, npcs, type PlayerMode, type NpcId } from './activities';
import { seededRandom } from './simulation';

export class ParkLife {
  root = new THREE.Group();
  static = new THREE.Group();
  boat = new THREE.Group();
  seedlings = new THREE.Group();
  sapling = new THREE.Group();
  binoculars = new THREE.Group();
  wateringCan = new THREE.Group();
  npcActors: { id: NpcId; group: THREE.Group; limbs: THREE.Object3D[]; home: THREE.Vector3 }[] = [];
  startled = false;
  private alertRemaining = 0;
  private oars: THREE.Group[] = [];
  private birds: THREE.Group[] = [];
  private butterflies: THREE.Group[] = [];
  private wakes: THREE.Mesh[] = [];
  private petals: THREE.Mesh[] = [];
  private waterDrops: THREE.Mesh[] = [];
  private materials = new Map<number, THREE.MeshStandardMaterial>();
  constructor(character: THREE.Group) {
    this.root.add(this.static, this.boat, this.seedlings, this.sapling);
    this.makeTrails(); this.makeGrove(); this.makeNursery(); this.makeBoat(); this.makeWildlife(); this.makeProps();
    for (const [index, npc] of npcs.entries()) {
      const group = character.clone(true); group.position.set(npc.point.x, Math.hypot(npc.point.x, npc.point.z / 0.66) < 27.3 ? 0.3 : 0.015, npc.point.z); group.rotation.y = index * 1.7; group.scale.setScalar(0.94 + index * 0.03);
      group.traverse(object => {
        if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) return;
        object.material = object.material.clone();
        object.castShadow = false;
        if ([0xe3a24c, 0xd39343].includes(object.material.color.getHex())) object.material.color.set(npc.color);
      });
      const limbs = [0, 1, 2, 3].map(i => group.getObjectByName(`limb-${i}`)!);
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), new THREE.MeshBasicMaterial({ color: 0x263c2a, transparent: true, opacity: 0.16, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; group.add(shadow);
      this.root.add(group); this.npcActors.push({ id: npc.id, group, limbs, home: group.position.clone() });
    }
  }
  private mesh(geometry: THREE.BufferGeometry, color: number, parent = this.static) {
    if (!this.materials.has(color)) this.materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.88, flatShading: true }));
    const mesh = new THREE.Mesh(geometry, this.materials.get(color)!); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  private box(w: number, h: number, d: number, color: number, x: number, y: number, z: number, parent = this.static) {
    const m = this.mesh(new THREE.BoxGeometry(w, h, d), color, parent); m.position.set(x, y, z); return m;
  }
  private makeTrails() {
    const trail = this.mesh(new THREE.RingGeometry(27, 28.4, 100), 0xc4b88d); trail.rotation.x = -Math.PI / 2; trail.scale.y = 0.72; trail.position.y = 0.015;
    for (const a of activities) {
      const pole = this.box(0.09, 1.6, 0.09, 0x806440, a.point.x + 1.5, 0.8, a.point.z + 0.8);
      const sign = this.box(0.75, 0.32, 0.09, 0x486a53, pole.position.x, 1.5, pole.position.z); sign.rotation.y = -0.2;
      // Carved stripe glyphs avoid fonts or downloaded textures in the world.
      for (let i = 0; i < 3; i++) this.box(0.38 - i * 0.07, 0.025, 0.02, 0xe6dba6, pole.position.x, 1.58 - i * 0.075, pole.position.z + 0.06);
    }
    const random = seededRandom(778);
    for (let i = 0; i < 130; i++) {
      const a = random() * Math.PI * 2, r = 25 + random() * 16;
      const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.66;
      const grass = this.mesh(new THREE.ConeGeometry(0.16, 0.3 + random() * 0.3, 4), i % 2 ? 0x879a65 : 0x708b56); grass.position.set(x, 0.2, z);
      if (i % 4 === 0) { const flower = this.mesh(new THREE.IcosahedronGeometry(0.1, 0), 0xe9c870); flower.position.set(x, 0.5, z); }
    }
  }
  private makeGrove() {
    const bench = new THREE.Group(); bench.position.set(-26, 0, 9); bench.rotation.y = Math.PI / 2; this.static.add(bench);
    for (let i = 0; i < 4; i++) this.box(1.65, 0.09, 0.13, 0xb48c5d, 0, 0.46, i * 0.15 - 0.2, bench);
    for (const x of [-0.63, 0.63]) { this.box(0.1, 0.46, 0.5, 0x526b53, x, 0.23, 0, bench); this.box(0.08, 0.6, 0.08, 0x526b53, x, 0.72, -0.3, bench); }
    for (let i = 0; i < 2; i++) this.box(1.7, 0.15, 0.07, 0xb48c5d, 0, 0.79 + i * 0.2, -0.3, bench);
    const shelter = new THREE.Group(); shelter.position.set(-32, 0, 8); this.static.add(shelter);
    for (const x of [-1.5, 1.5]) for (const z of [-1.5, 1.5]) this.box(0.14, 2.7, 0.14, 0x947450, x, 1.35, z, shelter);
    const roof = this.mesh(new THREE.ConeGeometry(2.8, 1, 4), 0x6b8562, shelter); roof.position.y = 3; roof.rotation.y = Math.PI / 4;
    this.box(1.8, 0.1, 1.1, 0xb29567, 0, 0.9, 0, shelter);
    for (const x of [-0.65, 0.65]) this.box(0.12, 0.9, 0.8, 0x7e674a, x, 0.45, 0, shelter);
    // A low boardwalk and an observation rail beside the northern reeds.
    for (let i = 0; i < 15; i++) this.box(2.6, 0.13, 0.24, i % 2 ? 0xab885e : 0xb39569, 1, 0.22, -16 - i * 0.27);
    for (const x of [-0.3, 2.3]) { this.box(0.1, 1.1, 0.1, 0x7e674a, x, 0.73, -16); this.box(0.1, 0.1, 3.9, 0x9d7c50, x, 1.2, -17.8); }
  }
  private makeNursery() {
    for (const x of [26.3, 27.6]) {
      this.box(1.1, 0.22, 2.1, 0x9b774e, x, 0.15, 10);
      this.box(0.95, 0.08, 1.95, 0x786849, x, 0.31, 10);
      for (let i = 0; i < 6; i++) {
        const z = 9.3 + i * 0.28;
        const stem = this.mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.4, 4), 0x5b804a, this.seedlings); stem.position.set(x, 0.52, z);
        for (const side of [-1, 1]) { const leaf = this.mesh(new THREE.SphereGeometry(0.1, 5, 4), 0x7ba15c, this.seedlings); leaf.scale.set(1.5, 0.4, 0.6); leaf.position.set(x + side * 0.1, 0.57, z); leaf.rotation.z = side * 0.5; }
        const bloom = this.mesh(new THREE.IcosahedronGeometry(0.085, 0), 0xedc77a, this.seedlings); bloom.position.set(x, 0.75, z); this.petals.push(bloom); bloom.visible = false;
      }
    }
    for (const x of [25.2, 29]) this.box(0.12, 2.7, 0.12, 0x9a7c50, x, 1.35, 11.7);
    this.box(4.2, 0.1, 2.8, 0xb5bc80, 27, 2.8, 10.7).rotation.x = 0.08;
    this.sapling.position.set(25, 0, -12); this.sapling.scale.setScalar(0.05);
    const trunk = this.mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.9, 5), 0x8d704d, this.sapling); trunk.position.y = 0.95;
