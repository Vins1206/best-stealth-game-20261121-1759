// level.js — the Ember Vault floor plan: walls, crates, shadows, patrols.
//
// The vault is one top-down room complex. Solid rectangles block both
// movement and sight, so every crate and wall is real cover. Shadow
// carpets are floor patches where a still, sneaking thief is hard to see.

export const WALLS = [
  // Outer shell.
  { x: 0, y: 0, w: 1280, h: 24 },
  { x: 0, y: 776, w: 1280, h: 24 },
  { x: 0, y: 0, w: 24, h: 800 },
  { x: 1256, y: 0, w: 24, h: 800 },
  // Gallery dividers with door gaps.
  { x: 300, y: 24, w: 22, h: 300 },
  { x: 300, y: 404, w: 22, h: 372 },
  { x: 640, y: 24, w: 22, h: 250 },
  { x: 640, y: 354, w: 22, h: 240 },
  { x: 640, y: 674, w: 22, h: 102 },
  { x: 960, y: 24, w: 22, h: 330 },
  { x: 960, y: 434, w: 22, h: 342 },
  // Horizontal shelves that make side corridors.
  { x: 24, y: 470, w: 190, h: 22 },
  { x: 420, y: 210, w: 220, h: 22 },
  { x: 662, y: 520, w: 200, h: 22 },
  { x: 982, y: 560, w: 180, h: 22 },
  { x: 90, y: 250, w: 130, h: 22 },
];

export const CRATES = [
  { x: 150, y: 120, w: 54, h: 54 },
  { x: 212, y: 120, w: 54, h: 54 },
  { x: 430, y: 560, w: 54, h: 54 },
  { x: 492, y: 560, w: 54, h: 54 },
  { x: 430, y: 622, w: 54, h: 54 },
  { x: 760, y: 130, w: 54, h: 54 },
  { x: 760, y: 192, w: 54, h: 54 },
  { x: 1060, y: 250, w: 54, h: 54 },
  { x: 1122, y: 250, w: 54, h: 54 },
  { x: 180, y: 600, w: 54, h: 54 },
  { x: 880, y: 650, w: 54, h: 54 },
  { x: 520, y: 330, w: 54, h: 54 },
];

export const SHADOWS = [
  { x: 40, y: 520, w: 150, h: 110 },
  { x: 360, y: 40, w: 180, h: 100 },
  { x: 700, y: 580, w: 150, h: 130 },
  { x: 1010, y: 620, w: 190, h: 130 },
  { x: 350, y: 640, w: 160, h: 110 },
];

export const RELIC_SPOTS = [
  { x: 480, y: 110, name: 'Ember of Dawn' },
  { x: 800, y: 430, name: 'Ember of Tides' },
  { x: 1100, y: 470, name: 'Ember of Roots' },
];

export const EXIT_ZONE = { x: 1146, y: 40, w: 92, h: 96 };

export const PATROL_ROUTES = [
  [{ x: 130, y: 380 }, { x: 540, y: 380 }, { x: 540, y: 660 }, { x: 130, y: 660 }],
  [{ x: 470, y: 90 }, { x: 470, y: 300 }, { x: 880, y: 300 }, { x: 880, y: 90 }],
  [{ x: 1080, y: 660 }, { x: 1080, y: 180 }, { x: 730, y: 180 }, { x: 730, y: 660 }],
  [{ x: 90, y: 90 }, { x: 240, y: 90 }, { x: 240, y: 420 }, { x: 90, y: 420 }],
];

export function allSolids() {
  return [...WALLS, ...CRATES];
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function playerInShadow(x, y) {
  return SHADOWS.some((patch) => pointInRect(x, y, patch));
}
