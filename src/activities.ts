export const MAP_SCALE = 2.2;
export const PARK_RADIUS = 48;
export type ActivityId = 'bench' | 'boat' | 'swim' | 'nursery' | 'sapling' | 'watch';
export type PlayerMode = 'walking' | 'sneaking' | 'swimming' | 'boating' | 'sitting' | 'watching';
export type NpcId = 'meera' | 'arun' | 'kavya' | 'ravi';
export type Point = { x: number; z: number };
export type Activity = { id: ActivityId; title: string; location: string; description: string; icon: string; point: Point; once: boolean };
export const activities: Activity[] = [
  { id: 'boat', title: 'Take the rowboat', location: 'The boating jetty', description: 'Row across the lake. Moor back at the jetty.', icon: 'waves', point: { x: 4, z: 14 }, once: false },
  { id: 'swim', title: 'Go for a swim', location: 'The swimming cove', description: 'Swim out into this fictional lake.', icon: 'droplets', point: { x: 12.7, z: 9.8 }, once: false },
  { id: 'bench', title: 'Sit by the lake', location: 'The picnic grove', description: 'Rest a while and watch the water.', icon: 'sun', point: { x: -26, z: 9 }, once: false },
  { id: 'nursery', title: 'Water the seedlings', location: 'The community nursery', description: 'Give the nursery a little care.', icon: 'sprout', point: { x: 27, z: 10 }, once: true },
  { id: 'sapling', title: 'Plant a shade tree', location: 'The orchard trail', description: 'Plant a sapling beside the trail.', icon: 'leaf', point: { x: 25, z: -12 }, once: true },
  { id: 'watch', title: 'Watch the wetland birds', location: 'The quiet hide', description: 'Sneak close, then stop and observe.', icon: 'bird', point: { x: 1, z: -17 }, once: true },
];
export const boatMooring = { x: 7.6, z: 8.2 };
export const boatExit = { x: 4, z: 14 };
export const npcs: { id: NpcId; name: string; role: string; point: Point; color: number; lines: string[]; destination: ActivityId }[] = [
  { id: 'meera', name: 'Meera', role: 'Birdwatcher', point: { x: -3, z: -18.7 }, color: 0xa2ab77, destination: 'watch', lines: ['Listen before you look. The reeds are full of small movements.', 'Try sneaking near the hide. Fast footsteps startle the birds; a quiet approach lets them settle.', 'These are stylized birds, not a species survey. What could you observe at a real lake without disturbing wildlife?'] },
  { id: 'arun', name: 'Arun', role: 'Boat keeper', point: { x: 7, z: 15 }, color: 0x7899a2, destination: 'boat', lines: ['The little rowboat is yours to borrow. There is a life jacket on the seat.', 'W and S row; A and D steer. Return to this jetty to moor. The return button can guide you back.', 'Swimming here is a game mechanic in a fictional lake. This is not a statement that any real Bengaluru lake is safe to enter.'] },
  { id: 'kavya', name: 'Kavya', role: 'Nursery volunteer', point: { x: 25, z: 13 }, color: 0xb77e67, destination: 'nursery', lines: ['Welcome to our little nursery. The seed trays could use some water.', 'There is also a bare patch along the orchard trail where you can plant a shade tree.', 'We show growth in seconds so you can see the connection. Real habitat needs suitable native plants and long-term care.'] },
  { id: 'ravi', name: 'Ravi', role: 'Evening walker', point: { x: -22, z: 4 }, color: 0x8f879d, destination: 'bench', lines: ['This is my favourite part of the evening walk. There is a quiet bench in the grove.', 'The outer trail takes you past the nursery, orchard, and bird hide. Open the park map if you lose your bearings.', 'You do not have to finish every task. It is fine to just sit and watch the lake for a while.'] },
];
export const modeLabels: Record<PlayerMode, string> = { walking: 'Walking', sneaking: 'Sneaking', swimming: 'Swimming', boating: 'Rowing', sitting: 'Taking a breath', watching: 'Birdwatching' };
export function canLeaveBoat(position: Point) { return Math.hypot(position.x - boatMooring.x, position.z - boatMooring.z) <= 3.1; }
export function activityById(id: ActivityId) { return activities.find(a => a.id === id)!; }
