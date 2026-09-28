export type ActionId = 'cleanup' | 'reeds' | 'drain';
export type Health = { clarity: number; habitat: number; wildlife: number };
export const actions: { id: ActionId; title: string; description: string; icon: string; effect: Health; response: string; location: string }[] = [
  { id: 'cleanup', title: 'Collect shoreline litter', description: 'Walk to the community shore', icon: 'hand-heart', effect: { clarity: 18, habitat: 8, wildlife: 1 }, response: 'Shoreline cleaned. The water looks brighter and another fish appears.', location: 'The community shore' },
  { id: 'reeds', title: 'Plant native seeds', description: 'Walk to the reed garden', icon: 'sprout', effect: { clarity: 8, habitat: 30, wildlife: 3 }, response: 'Seeds planted. Time moves a little faster here: reeds grow and wildlife returns.', location: 'The reed garden' },
  { id: 'drain', title: 'Clear inlet litter', description: 'Walk to the little inlet', icon: 'droplets', effect: { clarity: 22, habitat: 12, wildlife: 2 }, response: 'Inlet cleared. Less litter, clearer water. Real wastewater still needs treatment.', location: 'The little inlet' },
];
export function healthFor(completed: readonly ActionId[]): Health {
  const health = { clarity: 32, habitat: 24, wildlife: 2 };
  for (const id of new Set(completed)) {
    const effect = actions.find(action => action.id === id)?.effect;
    if (effect) { health.clarity += effect.clarity; health.habitat += effect.habitat; health.wildlife += effect.wildlife; }
  }
  return health;
}
export function seededRandom(seed = 824): () => number {
  return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
}
