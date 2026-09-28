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
