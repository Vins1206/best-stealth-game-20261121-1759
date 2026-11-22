// input.js — keyboard and mouse state for the thief.
//
// WASD and the arrow keys move, Shift sneaks, R restarts, and a mouse
// click throws a pebble at that spot. Input is only recorded here; the
// player and guard modules decide what the recorded intent does.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    click: null,
    mouse: { x: 0, y: 0 },
    restartPressed: false,
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    keys.add(event.code);
    if (event.code === 'KeyR') state.restartPressed = true;
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });

  function toWorld(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    state.mouse = toWorld(event);
  });
  canvas.addEventListener('click', (event) => {
    state.click = toWorld(event);
  });

  state.moveVector = function moveVector() {
    let x = 0;
    let y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const scale = Math.SQRT1_2;
      x *= scale;
      y *= scale;
    }
    return { x, y };
  };

  state.sneaking = function sneaking() {
    return keys.has('ShiftLeft') || keys.has('ShiftRight');
  };

  state.takeClick = function takeClick() {
    const click = state.click;
    state.click = null;
    return click;
  };

  state.takeRestart = function takeRestart() {
    const pressed = state.restartPressed;
    state.restartPressed = false;
    return pressed;
  };

  return state;
}
