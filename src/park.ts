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
    for (let i = 0; i < 3; i++) { const leaf = this.mesh(new THREE.IcosahedronGeometry(0.6, 0), [0x6d9258, 0x8da464, 0x759b5c][i], this.sapling); leaf.position.set((i - 1) * 0.28, 1.5 + i * 0.2, 0); }
    const soil = this.mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.08, 10), 0x8f7851); soil.position.set(25, 0.03, -12);
  }
  private makeBoat() {
    this.boat.position.set(boatMooring.x, 0.18, boatMooring.z);
    const outline = [[0, 1.9], [0.6, 1.1], [0.7, -1.1], [0, -1.9], [-0.7, -1.1], [-0.6, 1.1]];
    const vertices: number[] = [], indices: number[] = [];
    outline.forEach(([x, z]) => { vertices.push(x, 0.42, z, x * 0.7, -0.04, z * 0.87); });
    for (let i = 0; i < 6; i++) { const a = i * 2, b = ((i + 1) % 6) * 2; indices.push(a, b, a + 1, b, b + 1, a + 1); }
    const hullGeo = new THREE.BufferGeometry(); hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); hullGeo.setIndex(indices); hullGeo.computeVertexNormals();
    const hull = this.mesh(hullGeo, 0xb67f46, this.boat); (hull.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    this.box(1.05, 0.09, 2.5, 0xab7946, 0, 0, 0, this.boat);
    for (const z of [-0.6, 0.7]) this.box(1.25, 0.1, 0.36, 0xd0a369, 0, 0.3, z, this.boat);
    for (const side of [-1, 1]) {
      const oar = new THREE.Group(); oar.position.set(side * 0.66, 0.42, 0.25); this.boat.add(oar); this.oars.push(oar);
      const shaft = this.mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.8, 6), 0xe0b77b, oar); shaft.rotation.z = Math.PI / 2; shaft.position.x = side * 0.6;
      this.box(0.5, 0.06, 0.2, 0xa97741, side * 1.4, 0, 0, oar);
    }
    for (let i = 0; i < 5; i++) {
      const wake = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.68, 28), new THREE.MeshBasicMaterial({ color: 0xf0e8c5, transparent: true, opacity: 0.3, depthWrite: false }));
      wake.rotation.x = -Math.PI / 2; this.root.add(wake); this.wakes.push(wake);
    }
  }
  private makeWildlife() {
    for (let i = 0; i < 3; i++) {
      const bird = new THREE.Group(); this.root.add(bird); this.birds.push(bird);
      const body = this.mesh(new THREE.SphereGeometry(0.18, 8, 6), 0xf4ebcc, bird); body.scale.set(0.7, 0.8, 1.5); body.position.y = 0.3;
      const neck = this.mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.4, 5), 0xe9e0bd, bird); neck.position.set(0, 0.57, 0.15);
      const head = this.mesh(new THREE.SphereGeometry(0.09, 6, 5), 0xf4ebcc, bird); head.position.set(0, 0.8, 0.15);
      const beak = this.mesh(new THREE.ConeGeometry(0.035, 0.2, 4), 0xb49c51, bird); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.78, 0.29);
      for (const side of [-1, 1]) { const wing = this.box(0.32, 0.035, 0.3, 0xd9dcc4, side * 0.15, 0.38, 0, bird); wing.name = `wing-${side}`; }
    }
    for (let i = 0; i < 9; i++) {
      const butterfly = new THREE.Group(); this.root.add(butterfly); this.butterflies.push(butterfly);
      for (const side of [-1, 1]) { const wing = this.mesh(new THREE.CircleGeometry(0.09, 5), i % 2 ? 0xe8bb67 : 0xe0d6a7, butterfly); wing.rotation.x = -Math.PI / 2; wing.position.x = side * 0.07; (wing.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide; }
    }
  }
  private makeProps() {
    for (const x of [-0.09, 0.09]) { const lens = this.mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.18, 8), 0x41574b, this.binoculars); lens.rotation.x = Math.PI / 2; lens.position.x = x; }
    const can = this.mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.25, 8), 0x86a092, this.wateringCan); can.position.y = -0.04;
    const spout = this.mesh(new THREE.CylinderGeometry(0.025, 0.045, 0.35, 6), 0x86a092, this.wateringCan); spout.rotation.x = 0.85; spout.position.set(0, 0, 0.2);
    for (let i = 0; i < 12; i++) { const drop = this.mesh(new THREE.SphereGeometry(0.018, 4, 3), 0xc4e0cf, this.wateringCan); this.waterDrops.push(drop); }
  }
  npcPosition(id: NpcId) { return this.npcActors.find(npc => npc.id === id)!.group.position; }
  reset() { this.alertRemaining = 0; this.startled = false; this.sapling.scale.setScalar(0.05); this.boat.position.set(boatMooring.x, 0.18, boatMooring.z); this.boat.rotation.set(0, 0, 0); }
  animate(time: number, delta: number, player: THREE.Vector3, mode: PlayerMode, reduced: boolean, completed: Set<string>, boatMoving: boolean) {
    const t = reduced ? 0 : time;
    this.npcActors.forEach((npc, i) => {
      if (npc.id === 'ravi') { npc.group.position.set(npc.home.x + Math.cos(t * 0.15) * 2.4, 0.3, npc.home.z + Math.sin(t * 0.15) * 2.4); npc.group.rotation.y = -t * 0.15; }
      const near = npc.group.position.distanceTo(player) < 4;
      if (near) npc.group.rotation.y = Math.atan2(player.x - npc.group.position.x, player.z - npc.group.position.z);
      npc.limbs.forEach((limb, j) => { limb.rotation.x = npc.id === 'ravi' && !near ? Math.sin(t * 3) * 0.35 * (j % 2 ? -1 : 1) : Math.sin(t + i) * 0.035; });
      if (near && !reduced) npc.limbs[3].rotation.z = -0.55 + Math.sin(t * 2) * 0.2; else npc.limbs[3].rotation.z = 0;
    });
    const quiet = mode === 'sneaking' || mode === 'watching' || mode === 'sitting';
    if (Math.hypot(player.x - 1, player.z + 15.3) < 5 && !quiet) this.alertRemaining = 4;
    else this.alertRemaining = Math.max(0, this.alertRemaining - delta);
    this.startled = this.alertRemaining > 0;
    this.birds.forEach((bird, i) => {
      const y = this.startled ? 2 + Math.sin(t * 2 + i) * 0.15 : 0.2;
      bird.position.set(-0.2 + i * 0.9 + (this.startled ? Math.sin(t + i) * 1.3 : 0), y, -14.7 + (this.startled ? Math.cos(t + i) * 1.3 : 0));
      bird.rotation.y = this.startled ? -t : Math.sin(t * 0.3 + i) * 0.4;
      for (const side of [-1, 1]) bird.getObjectByName(`wing-${side}`)!.rotation.z = this.startled ? side * Math.sin(t * 10) * 0.8 : side * 0.25;
    });
    this.butterflies.forEach((b, i) => { b.position.set(26.5 + Math.sin(t * 0.5 + i) * 2, 0.7 + Math.sin(t + i) * 0.2, 10 + Math.cos(t * 0.7 + i) * 2); b.children.forEach((wing, j) => { wing.rotation.y = Math.sin(t * 14 + i) * 0.7 * (j ? -1 : 1); }); });
    this.petals.forEach(p => { p.visible = completed.has('nursery'); });
    this.sapling.scale.lerp(new THREE.Vector3().setScalar(completed.has('sapling') ? 1 : 0.05), reduced ? 1 : 1 - Math.exp(-delta * 2));
    this.boat.position.y = 0.18 + Math.sin(t * 1.4) * 0.035; this.boat.rotation.z = Math.sin(t * 1.1) * 0.02;
    this.oars.forEach((oar, i) => { oar.rotation.y = boatMoving ? Math.sin(t * 3.7) * 0.5 : 0.15; oar.rotation.z = (i ? 1 : -1) * (boatMoving ? Math.cos(t * 3.7) * 0.16 : 0.1); });
    this.wakes.forEach((wake, i) => {
      wake.visible = mode === 'swimming' || mode === 'boating'; const a = (t * 0.8 + i / 5) % 1;
      wake.position.set(player.x, 0.14, player.z); wake.scale.setScalar(0.4 + a * (mode === 'boating' ? 2.2 : 1.4));
      (wake.material as THREE.MeshBasicMaterial).opacity = reduced ? 0.15 : (1 - a) * 0.24;
    });
    this.waterDrops.forEach((drop, i) => { const a = (t * 2 + i / 12) % 1; drop.position.set(Math.sin(i * 3) * 0.07, -0.05 - a * 0.6, 0.3 + a * 0.2); });
  }
}
