// player.js — the thief: movement, wall collision, sneaking, relics.
//
// Movement is a circle resolved against every solid rectangle one axis
// at a time, so the thief slides along walls and crates instead of
// sticking to them. Sneaking is slower and quieter and far harder to
// spot; walking in the open is fast and obvious. That trade is the game.

import {
  PLAYER_RADIUS,
  PLAYER_WALK_SPEED,
  PLAYER_SNEAK_SPEED,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from './config.js';

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    relics: 0,
    stepPhase: 0,
  };
}

function circleHitsRect(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

export function collides(x, y, solids) {
  return solids.some((solid) => circleHitsRect(x, y, PLAYER_RADIUS, solid));
}

export function updatePlayer(player, input, dt, solids) {
  const move = input.moveVector();
  player.sneaking = input.sneaking();
  player.moving = move.x !== 0 || move.y !== 0;
  if (!player.moving) return;

  const speed = player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
  player.facing = Math.atan2(move.y, move.x);
  player.stepPhase += dt * speed * (player.sneaking ? 0.06 : 0.11);

  const nextX = player.x + move.x * speed * dt;
  if (!collides(nextX, player.y, solids)) player.x = nextX;
  const nextY = player.y + move.y * speed * dt;
  if (!collides(player.x, nextY, solids)) player.y = nextY;

  player.x = Math.max(PLAYER_RADIUS + 2, Math.min(WORLD_WIDTH - PLAYER_RADIUS - 2, player.x));
  player.y = Math.max(PLAYER_RADIUS + 2, Math.min(WORLD_HEIGHT - PLAYER_RADIUS - 2, player.y));
}

export function collectRelics(player, relicSpots, onCollect) {
  for (const spot of relicSpots) {
    if (spot.taken) continue;
    if (Math.hypot(player.x - spot.x, player.y - spot.y) < 30) {
      spot.taken = true;
      player.relics += 1;
      onCollect(spot);
    }
  }
}
