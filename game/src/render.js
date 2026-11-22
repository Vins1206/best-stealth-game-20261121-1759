// render.js — all canvas drawing: vault, cones, cover, thief, guards, HUD.
//
// The look is built for the screenshot sheet: a deep-blue night floor,
// pale stone walls, warm wooden crates that read as cover at a glance,
// amber vision cones that flush red as suspicion rises, a green glowing
// exit, and a top HUD bar carrying the detection meter and relic count.

import { WORLD_WIDTH, WORLD_HEIGHT, DETECTION_SUSPICIOUS_AT } from './config.js';
import { WALLS, CRATES, SHADOWS, EXIT_ZONE } from './level.js';
import { guardMood } from './guards.js';

function drawFloor(ctx) {
  ctx.fillStyle = '#17203a';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.fillStyle = '#1a2442';
  const tile = 64;
  for (let y = 0; y < WORLD_HEIGHT / tile; y += 1) {
    for (let x = 0; x < WORLD_WIDTH / tile; x += 1) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD_WIDTH; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_HEIGHT); ctx.stroke();
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke();
  }
}

function drawShadows(ctx) {
  for (const patch of SHADOWS) {
    ctx.fillStyle = 'rgba(5,8,20,0.55)';
    ctx.fillRect(patch.x, patch.y, patch.w, patch.h);
    ctx.strokeStyle = 'rgba(120,160,255,0.25)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(patch.x, patch.y, patch.w, patch.h);
    ctx.setLineDash([]);
  }
  ctx.fillStyle = 'rgba(160,190,255,0.6)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('shadow — hard to see', SHADOWS[0].x + 8, SHADOWS[0].y + 16);
}

function drawExit(ctx, state) {
  const ready = state.player.relics >= state.relicsNeeded;
  const pulse = 0.65 + 0.35 * Math.sin(state.time * 3);
  ctx.fillStyle = ready ? `rgba(46,204,113,${0.5 + 0.3 * pulse})` : 'rgba(46,204,113,0.22)';
  ctx.fillRect(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h);
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h);
  ctx.fillStyle = '#d8ffe9';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + 34);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(ready ? 'escape now!' : 'needs 3 embers', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + 54);
  ctx.textAlign = 'left';
}

function drawWallsAndCrates(ctx) {
  for (const wall of WALLS) {
    ctx.fillStyle = '#8d99b8';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = '#aeb9d4';
    ctx.fillRect(wall.x, wall.y, wall.w, Math.min(6, wall.h));
    ctx.strokeStyle = '#5d6a8c';
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
  }
  for (const crate of CRATES) {
    ctx.fillStyle = '#b07a3f';
    ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
    ctx.fillStyle = '#c98f4e';
    ctx.fillRect(crate.x + 4, crate.y + 4, crate.w - 8, crate.h - 8);
    ctx.strokeStyle = '#6e4520';
    ctx.lineWidth = 3;
    ctx.strokeRect(crate.x + 2, crate.y + 2, crate.w - 4, crate.h - 4);
    ctx.beginPath();
    ctx.moveTo(crate.x + 4, crate.y + 4);
    ctx.lineTo(crate.x + crate.w - 4, crate.y + crate.h - 4);
    ctx.moveTo(crate.x + crate.w - 4, crate.y + 4);
    ctx.lineTo(crate.x + 4, crate.y + crate.h - 4);
    ctx.stroke();
  }
}

function drawRelics(ctx, state) {
  for (const spot of state.relicSpots) {
    if (spot.taken) continue;
    const glow = 14 + 4 * Math.sin(state.time * 4 + spot.x);
    const gradient = ctx.createRadialGradient(spot.x, spot.y, 2, spot.x, spot.y, glow + 12);
    gradient.addColorStop(0, 'rgba(255,170,40,0.85)');
    gradient.addColorStop(1, 'rgba(255,170,40,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(spot.x, spot.y, glow + 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb02e';
    ctx.beginPath();
    ctx.moveTo(spot.x, spot.y - 13);
    ctx.lineTo(spot.x + 10, spot.y);
    ctx.lineTo(spot.x, spot.y + 13);
    ctx.lineTo(spot.x - 10, spot.y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath(); ctx.arc(spot.x, spot.y, 3.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCone(ctx, polygon, alertLevel) {
  if (polygon.length < 3) return;
  const red = Math.round(255 * Math.min(1, alertLevel));
  ctx.fillStyle = alertLevel > 0.45
    ? `rgba(255,${Math.max(60, 190 - red)},60,0.34)`
    : 'rgba(255,196,64,0.26)';
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i += 1) ctx.lineTo(polygon[i].x, polygon[i].y);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = alertLevel > 0.45 ? 'rgba(255,90,70,0.55)' : 'rgba(255,210,90,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, guard, state) {
  const mood = guardMood(guard, state.detection);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(guard.x, guard.y + 12, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = guard.mode === 'chase' ? '#e33e2b' : '#c0392b';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f0c297';
  ctx.beginPath(); ctx.arc(guard.x, guard.y - 3, 7.5, 0, Math.PI * 2); ctx.fill();
  // Cap brim points the way the guard faces.
  const bx = guard.x + Math.cos(guard.facing) * 10;
  const by = guard.y - 3 + Math.sin(guard.facing) * 10;
  ctx.fillStyle = '#7b1d12';
  ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.facing) * 6, guard.y + Math.sin(guard.facing) * 6, 2.4, 0, Math.PI * 2);
  ctx.fill();
  if (mood) {
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = mood === '!' ? '#ff5142' : '#ffd23e';
    ctx.fillText(mood, guard.x, guard.y - 26);
    ctx.textAlign = 'left';
  }
}

function drawPlayer(ctx, player, hidden) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 12, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(110,220,255,0.8)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(player.x, player.y, 19, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = '#27ae8f';
  ctx.beginPath(); ctx.arc(player.x, player.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(player.facing) * 16, player.y + Math.sin(player.facing) * 16);
  ctx.lineTo(player.x + Math.cos(player.facing + 2.5) * 11, player.y + Math.sin(player.facing + 2.5) * 11);
  ctx.lineTo(player.x + Math.cos(player.facing - 2.5) * 11, player.y + Math.sin(player.facing - 2.5) * 11);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath(); ctx.arc(player.x, player.y, 4, 0, Math.PI * 2); ctx.fill();
  if (hidden) {
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9be7ff';
    ctx.fillText('HIDDEN', player.x, player.y - 24);
    ctx.textAlign = 'left';
  }
}

function drawPebble(ctx, state) {
  if (!state.pebble) return;
  const p = state.pebble;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.arc(p.x, p.y, 6 + (1 - p.left / p.total) * 20, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('pebble noise', p.x + 10, p.y - 8);
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(8,10,22,0.92)';
  ctx.fillRect(0, 0, WORLD_WIDTH, 0); // HUD lives in the bottom strip instead.
  const y = WORLD_HEIGHT - 0;
  void y;
  // Top-left title chip.
  ctx.fillStyle = 'rgba(8,10,22,0.88)';
  ctx.fillRect(28, 28, 300, 58);
  ctx.strokeStyle = 'rgba(255,176,46,0.7)';
  ctx.strokeRect(28.5, 28.5, 300, 58);
  ctx.fillStyle = '#ffb02e';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('LANTERN HEIST', 42, 54);
  ctx.fillStyle = '#dfe6ff';
  ctx.font = '12.5px system-ui, sans-serif';
  ctx.fillText('Steal 3 embers. Reach the EXIT unseen.', 42, 74);

  // Detection meter, top centre.
  const meterX = 470;
  const meterW = 340;
  ctx.fillStyle = 'rgba(8,10,22,0.88)';
  ctx.fillRect(meterX - 12, 28, meterW + 24, 58);
  ctx.fillStyle = '#dfe6ff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(state.detection >= DETECTION_SUSPICIOUS_AT ? 'DETECTION — THEY SUSPECT YOU' : 'DETECTION', meterX, 46);
  ctx.fillStyle = '#2a3352';
  ctx.fillRect(meterX, 54, meterW, 16);
  const fill = Math.max(0, Math.min(1, state.detection / 100));
  ctx.fillStyle = fill > 0.75 ? '#ff5142' : fill > 0.38 ? '#ff9f2e' : '#57d977';
  ctx.fillRect(meterX, 54, meterW * fill, 16);

  // Relics + timer + state, top right under the exit is busy, so bottom bar.
  ctx.fillStyle = 'rgba(8,10,22,0.9)';
  ctx.fillRect(0, WORLD_HEIGHT - 34, WORLD_WIDTH, 34);
  ctx.fillStyle = '#ffb02e';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`Embers: ${state.player.relics} / ${state.relicsNeeded}`, 28, WORLD_HEIGHT - 12);
  ctx.fillStyle = '#dfe6ff';
  ctx.font = '13px system-ui, sans-serif';
  const status = state.mode === 'won'
    ? 'Escaped unseen — you win!'
    : state.mode === 'caught'
      ? 'Caught! Press R to try again.'
      : state.player.sneaking
        ? 'Sneaking: slow, quiet, hard to spot'
        : state.anyGuardSeesPlayer
          ? 'SPOTTED — break line of sight!'
          : 'Unseen';
  ctx.fillText(status, 190, WORLD_HEIGHT - 12);
  ctx.fillText('WASD / arrows move · Shift sneak · Click throws a pebble · R restart', 620, WORLD_HEIGHT - 12);
  const seconds = Math.floor(state.elapsed);
  ctx.fillText(`Time ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, 1170, WORLD_HEIGHT - 12);
}

function drawBanner(ctx, state) {
  if (state.mode === 'playing') return;
  ctx.fillStyle = 'rgba(4,6,14,0.62)';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.textAlign = 'center';
  if (state.mode === 'won') {
    ctx.fillStyle = '#57d977';
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.fillText('ESCAPED UNSEEN', WORLD_WIDTH / 2, 360);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(`All 3 embers stolen in ${Math.floor(state.elapsed)} seconds, never caught.`, WORLD_WIDTH / 2, 402);
  } else {
    ctx.fillStyle = '#ff5142';
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.fillText('CAUGHT!', WORLD_WIDTH / 2, 360);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText('A guard kept you in sight until the alarm filled.', WORLD_WIDTH / 2, 402);
  }
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = '#ffd23e';
  ctx.fillText('Press R to play again', WORLD_WIDTH / 2, 448);
  ctx.textAlign = 'left';
}

export function renderGame(ctx, state, conePolygons) {
  drawFloor(ctx);
  drawShadows(ctx);
  drawExit(ctx, state);
  for (let i = 0; i < state.guards.length; i += 1) {
    drawCone(ctx, conePolygons[i], state.guards[i].seesPlayer ? Math.max(0.5, state.detection / 100) : state.detection / 220);
  }
  drawWallsAndCrates(ctx);
  drawRelics(ctx, state);
  drawPebble(ctx, state);
  for (const guard of state.guards) drawGuard(ctx, guard, state);
  drawPlayer(ctx, state.player, state.playerHidden);
  drawHud(ctx, state);
  drawBanner(ctx, state);
}
