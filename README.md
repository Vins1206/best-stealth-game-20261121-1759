# Lantern Heist

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Vins1206/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Vins1206/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

An entry for make.fun's "Make the best stealth game" bounty ($50, top 10 share).

**Lantern Heist** is a complete top-down stealth game in the browser. You are a lantern thief inside the Ember Vault at night. Four guards walk learnable patrol routes with visible vision cones that stop at real cover. Slip behind crates and stone walls, wait in shadow carpets where you are hard to see, throw pebbles to pull a guard off its route, steal the three glowing embers, and reach the green EXIT unseen.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak: slower and quieter, and much harder to spot
- **Mouse click** — throw a pebble there; the nearest guard investigates the noise
- **R** — restart the night

Being seen fills the shared detection meter at the top of the screen. Shadow and sneaking slow it down; breaking line of sight drains it. A suspicious guard stops and stares, and if the meter fills you are caught. Collect all 3 embers, then stand in the EXIT to win.

## Run it

Serve the static game and open it in desktop Chrome — no build step, no network requests, every file lives under `game/`:

```
node serve.ts
# open http://localhost:8080
```

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored library
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `game/index.html` — the page and canvas
- `game/src/config.js` — every tunable number
- `game/src/level.js` — the vault floor plan: walls, crates, shadows, patrol routes
- `game/src/vision.js` — line of sight and raycast vision cones
- `game/src/guards.js` — patrols, suspicion, pebble distraction, pursuit
- `game/src/player.js` — movement, collision, sneaking, relic pickup
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — WebAudio footsteps, alerts and stings, generated in code
- `game/src/render.js` — all canvas drawing and the HUD
- `game/src/shots.js` — the deterministic poses used for the screenshots
- `game/src/main.js` — the night loop: detection, win and caught states
- `screenshots/` — real renders of the running game

MIT licensed — see `LICENSE`.
