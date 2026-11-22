// shots.js — deterministic poses for the maker's screenshots.
//
// A screenshot is a real render of the running game with its actors
// placed by hand: ?shot=start shows the whole vault at nightfall,
// ?shot=patrol puts the thief in a crate's shadow at a cone's edge,
// ?shot=alarm freezes the moment suspicion nearly fills, and ?shot=win
// stands the thief in the exit with every ember taken. The simulation
// still runs underneath; only the opening positions differ.

export const SHOT_NAMES = ['start', 'patrol', 'alarm', 'win'];

export function readShotName() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  return SHOT_NAMES.includes(shot) ? shot : null;
}

export function applyShotPose(state, shot) {
  if (!shot) return;
  const [g0, g1, g2, g3] = state.guards;
  if (shot === 'start') {
    state.player.x = 120; state.player.y = 690; state.player.facing = -0.6;
    g0.x = 330; g0.y = 380; g0.facing = 0;
    g1.x = 700; g1.y = 120; g1.facing = 0.4;
    g2.x = 1080; g2.y = 420; g2.facing = Math.PI;
    g3.x = 150; g3.y = 200; g3.facing = 1.1;
    state.detection = 0;
  }
  if (shot === 'patrol') {
    // Thief tucked behind the double crates at (430,560), a patrol cone
    // sweeping past the crate edge: cover, visibly doing its job.
    state.player.x = 562; state.player.y = 652; state.player.facing = -Math.PI / 2;
    state.player.sneaking = true;
    g0.x = 330; g0.y = 560; g0.facing = 0.15;
    g1.x = 760; g1.y = 300; g1.facing = 2.6;
    g2.x = 900; g2.y = 640; g2.facing = Math.PI;
    g3.x = 170; g3.y = 320; g3.facing = 0.8;
    state.detection = 12;
    for (const spot of state.relicSpots) if (spot.name === 'Ember of Dawn') { spot.taken = true; state.player.relics = 1; }
  }
  if (shot === 'alarm') {
    // Caught in the open in a cone: meter near the top, guard staring.
    state.player.x = 770; state.player.y = 415; state.player.facing = 2.8;
    g0.x = 300; g0.y = 640; g0.facing = -0.5;
    g1.x = 830; g1.y = 320; g1.facing = Math.PI / 2;
    g1.seesPlayer = true; g1.mode = 'suspicious';
    g2.x = 1080; g2.y = 300; g2.facing = Math.PI;
    g3.x = 150; g3.y = 150; g3.facing = 0.9;
    state.detection = 82;
    state.anyGuardSeesPlayer = true;
  }
  if (shot === 'win') {
    state.player.x = 1190; state.player.y = 88; state.player.facing = 0.4;
    state.player.relics = state.relicsNeeded;
    for (const spot of state.relicSpots) spot.taken = true;
    g0.x = 300; g0.y = 400; g0.facing = 0;
    g1.x = 700; g1.y = 200; g1.facing = 2.8;
    g2.x = 900; g2.y = 600; g2.facing = -1.2;
    g3.x = 160; g3.y = 260; g3.facing = 1.0;
    state.detection = 8;
    state.mode = 'won';
    state.elapsed = 96;
  }
}
