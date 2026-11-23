// police.js — the wanted system: 0 to 5 stars, police cars and officers who
// chase the player, and the heat that cools when you break line of sight.
import * as THREE from 'three';
import { makeCarModel } from './vehicles.js';
import { makeOfficer } from './people.js';
import { clamp } from './util.js';

export const WEAPONS = ['Fists', 'Pistol', 'SMG', 'Shotgun', 'Rifle', 'Launcher'];

export function buildPolice(scene, rng) {
  const group = new THREE.Group();
  group.name = 'police';
  const cars = [];
  for (let i = 0; i < 5; i++) {
    const car = makeCarModel('police');
    car.position.set(60 + (rng() - 0.5) * 120, 0, (rng() - 0.5) * 160);
    car.userData.speed = 0;
    car.visible = false;
    group.add(car); cars.push(car);
  }
  const officers = [];
  for (let i = 0; i < 6; i++) {
    const o = makeOfficer();
    o.position.set(40 + (rng() - 0.5) * 80, 0, -60 + (rng() - 0.5) * 80);
    o.visible = false;
    group.add(o); officers.push(o);
  }
  scene.add(group);
  const state = {
    wanted: 0, heat: 0, hidden: 0,
    addHeat(n) { this.heat = clamp(this.heat + n, 0, 100); this.wanted = this.heat <= 0 ? 0 : this.heat < 20 ? 1 : this.heat < 40 ? 2 : this.heat < 60 ? 3 : this.heat < 85 ? 4 : 5; },
    update(dt, playerPos, playerInCar, playerSpeed) {
      // heat cools when the player is slow and far from police
      const nearest = cars.reduce((m, c) => c.visible ? Math.min(m, c.position.distanceTo(playerPos)) : m, 999);
      if (this.wanted > 0 && nearest > 60 && Math.abs(playerSpeed) < 3) {
        this.hidden += dt;
        if (this.hidden > 6) { this.heat = Math.max(0, this.heat - dt * 4); this.wanted = this.heat <= 0 ? 0 : this.wanted; if (this.heat <= 0) this.hidden = 0; }
      } else this.hidden = 0;
      // deploy cars + officers to match the wanted level
      const wantCars = this.wanted >= 1 ? Math.min(2 + this.wanted, 5) : 0;
      cars.forEach((c, i) => {
        c.visible = i < wantCars;
        if (!c.visible) return;
        // chase: steer toward the player, faster at higher wanted
        const dx = playerPos.x - c.position.x, dz = playerPos.z - c.position.z;
        const target = Math.atan2(dx, dz);
        let diff = target - c.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        c.rotation.y += clamp(diff, -1.6 * dt, 1.6 * dt);
        const sp = 9 + this.wanted * 2.2;
        c.position.x += Math.sin(c.rotation.y) * sp * dt;
        c.position.z += Math.cos(c.rotation.y) * sp * dt;
        for (const w of (c.userData.wheels || [])) w.rotation.z -= sp * dt * 2.4;
        if (c.position.distanceTo(playerPos) < 4.5) this.addHeat(2 * dt);
      });
      const wantOfficers = this.wanted >= 2 ? Math.min(this.wanted, 6) : 0;
      officers.forEach((o, i) => {
        o.visible = i < wantOfficers;
        if (!o.visible) return;
        const dx = playerPos.x - o.position.x, dz = playerPos.z - o.position.z;
        o.rotation.y = Math.atan2(dx, dz);
        const d = Math.hypot(dx, dz);
        if (d > 3) { o.position.x += (dx / d) * 4.5 * dt; o.position.z += (dz / d) * 4.5 * dt; }
      });
      return { wanted: this.wanted, nearest };
    },
  };
  return { group, cars, officers, state };
}
