// missions.js — ten named story missions for Milo Vane, from meeting Vera at
// the marina beacon to the one last score. Each mission has an objective,
// a place, a line of dialogue and a payout.
export const MISSIONS = [
  { id: 1, name: 'First Light', place: 'Marina beacon', x: -196, z: -20,
    objective: 'Meet Vera at the marina beacon',
    who: 'Vera', line: 'Milo Vane. Fresh off the boat, fast hands, faster car. I like that.',
    payout: 500 },
  { id: 2, name: 'The Long Way Home', place: 'Grand Maravilla', x: 40, z: -88,
    objective: 'Drive Vera to the Grand Maravilla casino',
    who: 'Vera', line: 'Drive smooth. The casino likes winners, not sirens.',
    payout: 800 },
  { id: 3, name: 'Hot Wheels', place: 'Downtown Plaza', x: 40, z: -60,
    objective: 'Steal the red Comet from the plaza',
    who: 'Vera', line: 'That Comet has been sitting there all week. Take it. Quietly.',
    payout: 1200 },
  { id: 4, name: 'Harbour Lights', place: 'El Faro', x: -225, z: -215,
    objective: 'Take the boat to the lighthouse point',
    who: 'Milo', line: 'The old lighthouse. Nobody watches the water after dark.',
    payout: 1500 },
  { id: 5, name: 'The Grand Maravilla', place: 'Casino', x: 40, z: -88,
    objective: 'Case the casino: photograph the vault door',
    who: 'Vera', line: 'Count the cameras. Count the guards. Then count the money.',
    payout: 2000 },
  { id: 6, name: 'Payday', place: 'Casino vault', x: 40, z: -108,
    objective: 'Rob the vault and get to the getaway car',
    who: 'Milo', line: 'This is it. One bag, one car, one clean exit.',
    payout: 5000 },
  { id: 7, name: 'Heat Wave', place: 'Paseo del Mar', x: -140, z: 0,
    objective: 'Lose the 3-star wanted level on the boulevard',
    who: 'Vera', line: 'Every cop in Maravilla is looking for you. Vanish.',
    payout: 2500 },
  { id: 8, name: 'The Informant', place: 'Miramar', x: 200, z: -120,
    objective: 'Pick up the informant in the Miramar hills',
    who: 'Informant', line: 'The harbour master talks. For a price. Bring cash.',
    payout: 1800 },
  { id: 9, name: 'Last Call', place: 'Estadio Sol', x: 180, z: 170,
    objective: 'Confront the rival crew at the stadium',
    who: 'Milo', line: 'No more running. This ends tonight, under the lights.',
    payout: 3000 },
  { id: 10, name: 'One Last Score', place: 'El Faro', x: -225, z: -215,
    objective: 'Escape by boat from the lighthouse — one last score',
    who: 'Vera', line: 'The boat is waiting. After this, we are ghosts.',
    payout: 10000 },
];

export function missionMarker(x, z) {
  // a floating gold diamond that marks the objective on the map
  return { x, z };
}

export function missionAt(index) {
  return MISSIONS[Math.max(0, Math.min(MISSIONS.length - 1, index))];
}
