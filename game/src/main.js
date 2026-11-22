// main.js — Lantern Heist: the night loop that ties every module together.
//
// One vault, four patrols, three embers, one exit. The loop updates the
// thief, asks each guard what it can see, folds every sighting into the
// shared detection meter, and ends the night when the meter fills
// (caught) or when a thief carrying all three embers reaches the exit
// (escaped unseen). Pebble clicks distract the nearest guard in range.

import {
  VISION_RANGE,
  VISION_HALF_ANGLE,
  VISION_RAYS,
  DETECTION_MAX,
  DETECTION_FILL_PER_SECOND,
  DETECTION_DECAY_PER_SECOND,
  RELICS_NEEDED,
  PEBBLE_COOLDOWN_SECONDS,
  PEBBLE_DISTRACT_SECONDS,
  PEBBLE_RANGE,
  SHADOW_DETECTION_FACTOR,
  SNEAK_DETECTION_FACTOR,
  PLAYER_START,
} from './config.js';
import { allSolids, playerInShadow, RELIC_SPOTS, EXIT_ZONE, PATROL_ROUTES, pointInRect } from './level.js';
import { buildConePolygon, guardCanSee, hasLineOfSight } from './vision.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createGuard, updateGuard, distractGuard } from './guards.js';
import { createPlayer, updatePlayer, collectRelics } from './player.js';
import { renderGame } from './render.js';
import { readShotName, applyShotPose } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = createInput(canvas);
const audio = createAudio();
const solids = allSolids();

function freshState() {
  return {
    mode: 'playing',
    time: 0,
    elapsed: 0,
    detection: 0,
    player: createPlayer(PLAYER_START),
    guards: PATROL_ROUTES.map((route, i) => createGuard(route, i)),
    relicSpots: RELIC_SPOTS.map((spot) => ({ ...spot, taken: false })),
    relicsNeeded: RELICS_NEEDED,
    pebble: null,
    pebbleCooldown: 0,
    anyGuardSeesPlayer: false,
    playerHidden: false,
    wasSuspicious: false,
  };
}

let state = freshState();
const shot = readShotName();
if (shot) applyShotPose(state, shot);

function throwPebble(point) {
  if (state.pebbleCooldown > 0 || state.mode !== 'playing') return;
  let nearest = null;
  let nearestDistance = Infinity;
  for (const guard of state.guards) {
    const d = Math.hypot(guard.x - point.x, guard.y - point.y);
    if (d < nearestDistance) { nearestDistance = d; nearest = guard; }
  }
  const fromPlayer = Math.hypot(state.player.x - point.x, state.player.y - point.y);
  if (!nearest || fromPlayer > PEBBLE_RANGE + 140) return;
  distractGuard(nearest, point, PEBBLE_DISTRACT_SECONDS);
  state.pebble = { x: point.x, y: point.y, left: PEBBLE_DISTRACT_SECONDS, total: PEBBLE_DISTRACT_SECONDS };
  state.pebbleCooldown = PEBBLE_COOLDOWN_SECONDS;
  audio.pebble();
}

function updateDetection(dt) {
  let seenBy = 0;
  let closestFactor = 0;
  state.playerHidden = true;
  for (const guard of state.guards) {
    const result = guardCanSee(guard, state.player, VISION_RANGE, VISION_HALF_ANGLE, solids);
    guard.seesPlayer = result.seen;
    if (result.seen) {
      seenBy += 1;
      state.playerHidden = false;
      const distanceFactor = 1.15 - (result.distance / VISION_RANGE) * 0.65;
      closestFactor = Math.max(closestFactor, distanceFactor);
    }
  }
  state.anyGuardSeesPlayer = seenBy > 0;
  if (seenBy > 0) {
    let rate = DETECTION_FILL_PER_SECOND * closestFactor;
    if (playerInShadow(state.player.x, state.player.y)) rate *= SHADOW_DETECTION_FACTOR;
    if (state.player.sneaking) rate *= SNEAK_DETECTION_FACTOR;
    state.detection = Math.min(DETECTION_MAX, state.detection + rate * dt);
    if (state.detection >= 38 && !state.wasSuspicious) audio.suspicious();
    if (state.detection >= 99 && !state.wasSuspicious) audio.alarm();
    state.wasSuspicious = state.detection >= 38;
  } else {
    state.detection = Math.max(0, state.detection - DETECTION_DECAY_PER_SECOND * dt);
    if (state.detection < 30) state.wasSuspicious = false;
  }
  // Hidden also means fully out of every cone's line of sight.
  if (!state.playerHidden) {
    state.playerHidden = !state.guards.some((guard) =>
      hasLineOfSight(guard.x, guard.y, state.player.x, state.player.y, solids) &&
      Math.hypot(guard.x - state.player.x, guard.y - state.player.y) < VISION_RANGE);
  }
}

function update(dt) {
  state.time += dt;
  if (input.takeRestart()) {
    state = freshState();
    return;
  }
  if (state.mode !== 'playing') return;
  state.elapsed += dt;
  state.pebbleCooldown = Math.max(0, state.pebbleCooldown - dt);
  if (state.pebble) {
    state.pebble.left -= dt;
    if (state.pebble.left <= 0) state.pebble = null;
  }
  const click = input.takeClick();
  if (click) {
    audio.unlock();
    throwPebble(click);
  }

  updatePlayer(state.player, input, dt, solids);
  if (state.player.moving) audio.footstep(state.player.sneaking, state.player.sneaking ? 0.5 : 1);
  collectRelics(state.player, state.relicSpots, () => audio.relic());

  updateDetection(dt);
  for (const guard of state.guards) updateGuard(guard, dt, state.detection, state.player);

  if (state.detection >= DETECTION_MAX) {
    state.mode = 'caught';
    audio.caught();
    statusEl.textContent = 'Caught by a vault guard.';
    return;
  }
  if (state.player.relics >= RELICS_NEEDED && pointInRect(state.player.x, state.player.y, EXIT_ZONE)) {
    state.mode = 'won';
    audio.escaped();
    statusEl.textContent = 'Escaped unseen with all three embers.';
  }
}

let lastTimestamp = performance.now();
function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
  lastTimestamp = timestamp;
  update(dt);
  const conePolygons = state.guards.map((guard) =>
    buildConePolygon(guard, VISION_RANGE, VISION_HALF_ANGLE, VISION_RAYS, solids));
  renderGame(ctx, state, conePolygons);
  requestAnimationFrame(frame);
}

// A small handle for the maker's own play-tests: read the state, and
// walk the thief somewhere without faking a render.
window.__lanternHeist = {
  get state() { return state; },
  teleport(x, y) { state.player.x = x; state.player.y = y; },
  restart() { state = freshState(); },
};

requestAnimationFrame(frame);
