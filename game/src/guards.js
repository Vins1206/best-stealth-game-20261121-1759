// guards.js — patrol guards: routes, suspicion, distraction, pursuit.
//
// Each guard walks its waypoint loop and pauses at each corner. A thrown
// pebble pulls the nearest guard off route to look at the noise. Seeing
// the thief raises shared suspicion; a suspicious guard stops and stares,
// and a guard who keeps sight of the thief at full suspicion gives chase
// until the meter is full and the night ends in capture.

import {
  GUARD_PATROL_SPEED,
  GUARD_PAUSE_SECONDS,
  GUARD_TURN_RATE,
  DETECTION_SUSPICIOUS_AT,
} from './config.js';
import { angleDifference } from './vision.js';

export function createGuard(route, index) {
  const start = route[0];
  return {
    id: index,
    x: start.x,
    y: start.y,
    facing: Math.atan2(route[1].y - start.y, route[1].x - start.x),
    route,
    waypoint: 1,
    pauseLeft: 0,
    mode: 'patrol',
    distractPoint: null,
    distractLeft: 0,
    stareLeft: 0,
    seesPlayer: false,
    stepPhase: Math.random() * 10,
  };
}

export function turnToward(guard, targetAngle, dt) {
  const diff = angleDifference(targetAngle, guard.facing);
  const maxTurn = GUARD_TURN_RATE * dt;
  if (Math.abs(diff) <= maxTurn) guard.facing = targetAngle;
  else guard.facing += Math.sign(diff) * maxTurn;
}

function moveToward(guard, target, speed, dt) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 4) return true;
  const step = Math.min(distance, speed * dt);
  guard.x += (dx / distance) * step;
  guard.y += (dy / distance) * step;
  turnToward(guard, Math.atan2(dy, dx), dt);
  guard.stepPhase += dt * speed * 0.09;
  return distance - step < 4;
}

export function distractGuard(guard, point, seconds) {
  guard.mode = 'distracted';
  guard.distractPoint = { x: point.x, y: point.y };
  guard.distractLeft = seconds;
}

export function updateGuard(guard, dt, detection, player) {
  if (guard.distractLeft > 0 && guard.mode === 'distracted') {
    const arrived = moveToward(guard, guard.distractPoint, GUARD_PATROL_SPEED * 1.25, dt);
    if (arrived) {
      guard.distractLeft -= dt;
      turnToward(guard, guard.facing + dt * 0.7, dt);
      if (guard.distractLeft <= 0) guard.mode = 'patrol';
    }
    return;
  }

  if (guard.seesPlayer && detection >= DETECTION_SUSPICIOUS_AT) {
    // Suspicion: freeze and stare. At the top of the meter, give chase.
    const angleTo = Math.atan2(player.y - guard.y, player.x - guard.x);
    turnToward(guard, angleTo, dt);
    if (detection > 92) {
      guard.mode = 'chase';
      moveToward(guard, player, 118, dt);
    } else {
      guard.mode = 'suspicious';
    }
    return;
  }

  guard.mode = 'patrol';
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    return;
  }
  const target = guard.route[guard.waypoint];
  if (moveToward(guard, target, GUARD_PATROL_SPEED, dt)) {
    guard.waypoint = (guard.waypoint + 1) % guard.route.length;
    guard.pauseLeft = GUARD_PAUSE_SECONDS;
  }
}

export function guardMood(guard, detection) {
  if (guard.mode === 'chase') return '!';
  if (guard.mode === 'suspicious' || (guard.seesPlayer && detection >= DETECTION_SUSPICIOUS_AT)) return '?';
  if (guard.mode === 'distracted') return '...';
  return '';
}
