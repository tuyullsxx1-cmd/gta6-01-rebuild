// save.js — save the run to localStorage and load it back. Small and plain.
const KEY = 'maravilla-save-v1';

export function saveGame(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      mission: state.mission, money: state.money, weapon: state.weapon,
      x: state.x, z: state.z, rot: state.rot, wanted: state.wanted,
      at: Date.now(),
    }));
    return true;
  } catch (e) { return false; }
}
export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
export function hasSave() { return !!loadGame(); }
