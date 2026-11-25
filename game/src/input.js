// Sizzle & Sage — input: keyboard and mouse, kept in one small state object
// the world reads each frame. Keys: WASD or arrows to walk, E or Space to
// use the nearest station, 1-6 to grab an ingredient at the fridge, M to
// mute, Enter to start or restart, P to pause, Esc to quit back to the title.

export function createInput() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    interactPressed: false,
    numberPressed: 0,
    enterPressed: false,
    pausePressed: false,
    mutePressed: false,
    quitPressed: false,
    click: null,
  };
}

const KEYMAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
};

export function attachInput(input, canvas) {
  window.addEventListener('keydown', (event) => {
    const field = KEYMAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      if (!event.repeat) input.interactPressed = true;
      event.preventDefault();
    } else if (event.code === 'Enter') {
      if (!event.repeat) input.enterPressed = true;
    } else if (event.code === 'KeyP') {
      if (!event.repeat) input.pausePressed = true;
    } else if (event.code === 'KeyM') {
      if (!event.repeat) input.mutePressed = true;
    } else if (event.code === 'Escape') {
      if (!event.repeat) input.quitPressed = true;
    } else if (/^Digit[1-6]$/.test(event.code)) {
      if (!event.repeat) input.numberPressed = Number(event.code.slice(5));
    }
  });
  window.addEventListener('keyup', (event) => {
    const field = KEYMAP[event.code];
    if (field) input[field] = false;
  });
  window.addEventListener('blur', () => {
    input.left = false;
    input.right = false;
    input.up = false;
    input.down = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  });
}

// Edge-triggered presses are consumed once per frame by the main loop.
export function consumePresses(input) {
  const pressed = {
    interact: input.interactPressed,
    number: input.numberPressed,
    enter: input.enterPressed,
    pause: input.pausePressed,
    mute: input.mutePressed,
    quit: input.quitPressed,
  };
  input.interactPressed = false;
  input.numberPressed = 0;
  input.enterPressed = false;
  input.pausePressed = false;
  input.mutePressed = false;
  input.quitPressed = false;
  return pressed;
}

export function consumeClick(input) {
  const click = input.click;
  input.click = null;
  return click;
}
