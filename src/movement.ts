import { MAP_SCALE, PARK_RADIUS } from './activities';

export function shoreRadius(angle: number) { return 8.1 * MAP_SCALE * (1 + 0.045 * Math.sin(angle * 3) + 0.025 * Math.cos(angle * 7)); }
export function lakeRadiusAt(x: number, z: number) { return shoreRadius(Math.atan2(z / 0.66, x)); }
export function isWater(x: number, z: number, margin = 0) { return Math.hypot(x, z / 0.66) < lakeRadiusAt(x, z) - margin; }
export function constrainToPark(x: number, z: number) {
  const radius = Math.hypot(x, z / 0.66); const factor = Math.min(1, PARK_RADIUS / (radius || 1)); return { x: x * factor, z: z * factor };
}
export function constrainToWater(x: number, z: number, margin = 0.8) {
  const radius = Math.hypot(x, z / 0.66); const factor = Math.min(1, (lakeRadiusAt(x, z) - margin) / (radius || 1)); return { x: x * factor, z: z * factor };
}
/** Used by assisted walks so a land destination never routes through the lake. */
export function constrainToShore(x: number, z: number) {
  const radius = Math.hypot(x, z / 0.66);
  const angle = Math.atan2(z / 0.66, x);
  const minimum = shoreRadius(angle) + 0.65;
  const bounded = Math.max(minimum, Math.min(PARK_RADIUS, radius));
  return { x: Math.cos(angle) * bounded, z: Math.sin(angle) * bounded * 0.66 };
}

export type SphereObstacle = { x: number; y: number; z: number; radius: number };
/** Shorten the camera boom before solid scenery; never hide the scenery. */
export function cameraBoomFraction(start: { x: number; y: number; z: number }, end: { x: number; y: number; z: number }, obstacles: SphereObstacle[]) {
  const dx = end.x - start.x, dy = end.y - start.y, dz = end.z - start.z;
  const lengthSq = dx * dx + dy * dy + dz * dz; if (!lengthSq) return 1;
  let fraction = 1;
  for (const sphere of obstacles) {
    const ox = start.x - sphere.x, oy = start.y - sphere.y, oz = start.z - sphere.z;
    const b = ox * dx + oy * dy + oz * dz;
    const c = ox * ox + oy * oy + oz * oz - sphere.radius ** 2;
    if (c < 0) continue;
    const discriminant = b * b - lengthSq * c;
    if (discriminant < 0) continue;
    const entry = (-b - Math.sqrt(discriminant)) / lengthSq;
    if (entry > 0 && entry < fraction) fraction = Math.max(0.08, entry - 0.18 / Math.sqrt(lengthSq));
  }
  return fraction;
}

export function cameraRelativeMovement(horizontal: number, forward: number, yaw: number) {
  const length = Math.hypot(horizontal, forward) || 1;
  return {
    x: (horizontal * Math.cos(yaw) - forward * Math.sin(yaw)) / length,
    z: (-horizontal * Math.sin(yaw) - forward * Math.cos(yaw)) / length,
  };
}
