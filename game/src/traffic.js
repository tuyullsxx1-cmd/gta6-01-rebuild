// traffic.js — the city in motion: cars that follow the roads and pedestrians
// who stroll the sidewalks. Simple, deterministic, and cheap to run.
import * as THREE from 'three';
import { makeCarModel } from './vehicles.js';
import { makePedestrian } from './people.js';
import { clamp } from './util.js';

const ROAD_Z = [0, 120, -140];        // east-west avenues
const ROAD_X = [-140, 40, 190];       // north-south streets

export function buildTraffic(scene, rng, colliders) {
  const group = new THREE.Group();
  group.name = 'traffic';
  const cars = [];
  const kinds = ['sedan', 'sedan', 'taxi', 'sports', 'truck', 'sedan'];
  for (let i = 0; i < 12; i++) {
    const car = makeCarModel(kinds[i % kinds.length]);
    const horizontal = rng() < 0.5;
    const lane = horizontal ? ROAD_Z[i % ROAD_Z.length] : ROAD_X[i % ROAD_X.length];
    const along = -230 + rng() * 460;
    car.position.set(horizontal ? along : lane + (rng() < 0.5 ? -3.5 : 3.5), 0, horizontal ? lane + (rng() < 0.5 ? -3.5 : 3.5) : along);
    car.rotation.y = horizontal ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    car.userData.speed = 6 + rng() * 7;
    car.userData.horizontal = horizontal;
    car.userData.dir = Math.sin(car.rotation.y) >= 0 ? 1 : -1;
    group.add(car); cars.push(car);
  }
  const peds = [];
  for (let i = 0; i < 26; i++) {
    const p = makePedestrian(rng);
    const onPaseo = rng() < 0.45;
    p.position.set(
      onPaseo ? -128 + (rng() - 0.5) * 8 : -120 + rng() * 330,
      0,
      onPaseo ? -230 + rng() * 460 : (rng() < 0.5 ? 8 : 112) + (rng() - 0.5) * 6);
    p.rotation.y = rng() * Math.PI * 2;
    p.userData.speed = 1 + rng() * 1.4;
    p.userData.turn = (rng() - 0.5) * 0.6;
    p.userData.phase = rng() * Math.PI * 2;
    group.add(p); peds.push(p);
  }
  scene.add(group);
  return {
    group, cars, peds,
    update(dt, t) {
      for (const c of cars) {
        const d = c.userData.dir;
        if (c.userData.horizontal) {
          c.position.x += Math.cos(c.rotation.y) * c.userData.speed * dt * d;
          if (c.position.x > 250) c.position.x = -250;
          if (c.position.x < -250) c.position.x = 250;
        } else {
          c.position.z += Math.sin(c.rotation.y) * c.userData.speed * dt * d * -1;
          if (c.position.z > 250) c.position.z = -250;
          if (c.position.z < -250) c.position.z = 250;
        }
        for (const w of (c.userData.wheels || [])) w.rotation.z -= c.userData.speed * dt * 2.4;
      }
      for (const p of peds) {
        p.rotation.y += p.userData.turn * dt;
        p.position.x += Math.sin(p.rotation.y) * p.userData.speed * dt;
        p.position.z += Math.cos(p.rotation.y) * p.userData.speed * dt;
        p.position.x = clamp(p.position.x, -250, 250);
        p.position.z = clamp(p.position.z, -250, 250);
        // a gentle walk bob + arm swing
        const s = Math.sin(t * 6 + p.userData.phase);
        p.position.y = Math.abs(s) * 0.05;
        p.userData.arms[0].rotation.x = s * 0.5;
        p.userData.arms[1].rotation.x = -s * 0.5;
      }
    },
  };
}
