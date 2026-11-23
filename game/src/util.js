// util.js — small shared helpers: a seeded random, math helpers and
// canvas-generated textures (all art is made in code, nothing is loaded).
import * as THREE from 'three';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Facade: warm plaster with a grid of windows, some lit gold (sunset).
export function facadeTexture(base, litRatio, seed) {
  const rnd = mulberry32(seed);
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    // subtle plaster variation
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(0,0,0,${0.02 + rnd() * 0.05})`;
      g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 8, 2 + rnd() * 8);
    }
    const cols = 6, rows = 9, cw = w / cols, ch = h / rows;
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
      const lit = rnd() < litRatio;
      g.fillStyle = lit ? (rnd() < 0.7 ? '#ffd98a' : '#fff2c8') : '#2a3542';
      g.fillRect(x * cw + 6, y * ch + 7, cw - 12, ch - 14);
      if (lit) { g.fillStyle = 'rgba(255,190,90,.5)'; g.fillRect(x * cw + 6, y * ch + 7, cw - 12, 3); }
      else { g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x * cw + 6, y * ch + 7, cw - 12, 3); }
    }
  });
}

// Big text sign (casino, shops, street names).
export function signTexture(text, bg, fg, sub) {
  return canvasTexture(1024, 256, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 92px Georgia, serif';
    g.fillText(text, w / 2, sub ? h / 2 - 26 : h / 2);
    if (sub) { g.font = '28px Georgia, serif'; g.fillText(sub, w / 2, h / 2 + 62); }
  });
}

// Terracotta checker for the plaza floor.
export function checkerTexture(a, b) {
  return canvasTexture(256, 256, (g, w, h) => {
    const s = 32;
    for (let x = 0; x < w / s; x++) for (let y = 0; y < h / s; y++) {
      g.fillStyle = (x + y) % 2 ? a : b;
      g.fillRect(x * s, y * s, s, s);
      g.fillStyle = 'rgba(0,0,0,.08)';
      g.fillRect(x * s, y * s, s, 2); g.fillRect(x * s, y * s, 2, s);
    }
  });
}

// Soft round blob (cloud puffs, light glow, water glitter).
export function blobTexture(inner, outer) {
  return canvasTexture(128, 128, (g, w, h) => {
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, inner); grad.addColorStop(1, outer);
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
}

// Dark asphalt with a centre line, for road strips.
export function roadTexture() {
  return canvasTexture(128, 256, (g, w, h) => {
    g.fillStyle = '#3d3a3d'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.04})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    g.fillStyle = '#e8d27a';
    for (let y = 0; y < h; y += 42) g.fillRect(w / 2 - 2, y, 4, 22);
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.fillRect(6, 0, 3, h); g.fillRect(w - 9, 0, 3, h);
  });
}
