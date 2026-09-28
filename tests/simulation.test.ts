import { test } from 'node:test';
import assert from 'node:assert/strict';
import { healthFor, seededRandom, type ActionId } from '../src/simulation.ts';
import { cameraRelativeMovement, constrainToShore, constrainToWater, constrainToPark, cameraBoomFraction, isWater, shoreRadius } from '../src/movement.ts';
import { MAP_SCALE, PARK_RADIUS, boatMooring, canLeaveBoat, activities } from '../src/activities.ts';

test('baseline and each action produce the documented scores', () => {
  assert.deepEqual(healthFor([]), { clarity: 32, habitat: 24, wildlife: 2 });
  assert.deepEqual(healthFor(['cleanup']), { clarity: 50, habitat: 32, wildlife: 3 });
  assert.deepEqual(healthFor(['reeds']), { clarity: 40, habitat: 54, wildlife: 5 });
  assert.deepEqual(healthFor(['drain']), { clarity: 54, habitat: 36, wildlife: 4 });
});
test('all six action orders produce the same final world; duplicate actions have no effect', () => {
  const orders: ActionId[][] = [['cleanup','reeds','drain'],['cleanup','drain','reeds'],['reeds','cleanup','drain'],['reeds','drain','cleanup'],['drain','cleanup','reeds'],['drain','reeds','cleanup']];
  for (const order of orders) assert.deepEqual(healthFor(order), { clarity: 80, habitat: 74, wildlife: 8 });
  assert.deepEqual(healthFor(['cleanup','cleanup']), healthFor(['cleanup']));
});
test('procedural world seeds are reproducible and bounded', () => {
  const a = seededRandom(), b = seededRandom();
  for (let i = 0; i < 1000; i++) { const n = a(); assert.equal(n, b()); assert.ok(n >= 0 && n < 1); }
});

test('assisted land routes stay out of water and inside the larger park', () => {
  for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
    const inside = constrainToShore(Math.cos(angle), Math.sin(angle));
    assert.equal(isWater(inside.x, inside.z), false);
    const outside = constrainToShore(Math.cos(angle) * 100, Math.sin(angle) * 100);
    assert.ok(Math.hypot(outside.x, outside.z / 0.66) <= PARK_RADIUS + 0.00001);
  }
});

test('boats remain in water while free exploration respects the park boundary', () => {
  assert.ok(shoreRadius(0) > 8.1 * 2);
  assert.equal(MAP_SCALE, 2.2);
  for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
    const boat = constrainToWater(Math.cos(angle) * 100, Math.sin(angle) * 100);
    assert.ok(isWater(boat.x, boat.z, 0.5));
    const park = constrainToPark(Math.cos(angle) * 100, Math.sin(angle) * 100);
    assert.ok(Math.hypot(park.x, park.z / 0.66) <= PARK_RADIUS + 0.00001);
  }
});

test('boat exit is restricted to the jetty and all activities have distinct identifiers', () => {
  assert.ok(canLeaveBoat(boatMooring));
  assert.equal(canLeaveBoat({ x: boatMooring.x + 5, z: boatMooring.z }), false);
  assert.equal(new Set(activities.map(a => a.id)).size, 6);
});

test('camera stops in front of solid scenery, without changing scenery visibility', () => {
  const start = { x: 0, y: 1, z: 0 }, end = { x: 0, y: 1, z: 10 };
  const tree = { x: 0, y: 1, z: 5, radius: 1 };
  const boom = cameraBoomFraction(start, end, [tree]);
  assert.ok(boom > 0.3 && boom < 0.4);
  assert.deepEqual(tree, { x: 0, y: 1, z: 5, radius: 1 });
  assert.equal(cameraBoomFraction(start, end, [{ ...tree, x: 5 }]), 1);
  assert.equal(cameraBoomFraction(start, end, [{ ...tree, z: -5 }]), 1);
  assert.equal(cameraBoomFraction(start, start, [tree]), 1);
});

test('camera-relative movement turns correctly and diagonals do not move faster', () => {
  assert.deepEqual(cameraRelativeMovement(0, 1, 0), { x: 0, z: -1 });
  const side = cameraRelativeMovement(0, 1, Math.PI / 2);
  assert.ok(Math.abs(side.x + 1) < 0.0001 && Math.abs(side.z) < 0.0001);
  const diagonal = cameraRelativeMovement(1, 1, 0.5);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z) - 1) < 0.0001);
});
