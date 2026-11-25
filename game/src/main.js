// Sizzle & Sage — main: the game loop, screens and sound wiring. The world
// advances in fixed steps, the renderer draws it, and the input layer feeds
// it. ?shot=start|play|rush|end freezes a staged frame for screenshots.

import { VIEW, INGREDIENTS } from './config.js';
import { createWorld, resetWorld, step, interact, takeFromFridge, clickAt, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, say } from './world.js';
import { createInput, attachInput, consumePresses, consumeClick } from './input.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import { unlockAudio, toggleMute, playChop, playSizzle, playServe, playError, playOrder, playRush, playPickup, startMusic, stopMusic } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const world = createWorld();
const input = createInput();
attachInput(input, canvas);

let paused = false;
let last = performance.now();
let shotStaged = false;
let lastSoundSeen = null;

function playSound(tag) {
  if (!tag) return;
  if (tag === 'chopDone') playChop(true);
  else if (tag === 'chopTick') playChop(false);
  else if (tag === 'sizzle') playSizzle();
  else if (tag === 'serve') playServe(world.tips);
  else if (tag === 'error') playError();
  else if (tag === 'order') playOrder();
  else if (tag === 'rush') playRush();
  else if (tag === 'pickup') playPickup();
  else if (tag === 'grillReady') playSizzle();
}

function startDay() {
  resetWorld(world);
  world.screen = SCREEN_PLAY;
  paused = false;
  startMusic();
  say(world, 'First orders are coming — grab ingredients from the fridge!');
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (shotName && !shotStaged) {
    stageShot(shotName, world);
    shotStaged = true;
    draw(ctx, world, false);
    return;
  }

  const pressed = consumePresses(input);
  const click = consumeClick(input);
  if (pressed.mute) toggleMute();
  if (pressed.enter) {
    unlockAudio();
    if (world.screen === SCREEN_TITLE) startDay();
    else if (world.screen === SCREEN_OVER) startDay();
  }
  if (pressed.quit) {
    if (world.screen === SCREEN_PLAY) {
      resetWorld(world);
      world.screen = SCREEN_TITLE;
      stopMusic();
    }
    paused = false;
  }
  if (pressed.pause && world.screen === SCREEN_PLAY) paused = !paused;

  if (world.screen === SCREEN_PLAY && !paused) {
    if (click) {
      unlockAudio();
      clickAt(world, click.x, click.y);
    }
    if (pressed.number) {
      // 1-6 grabs that ingredient straight from the fridge, wherever the
      // chef stands — a shortcut for players who know the menu by heart.
      const ids = Object.keys(INGREDIENTS);
      const id = ids[pressed.number - 1];
      if (id) playSound(takeFromFridge(world, id));
    }
    if (pressed.interact) {
      unlockAudio();
      const sound = interact(world);
      if (sound === 'fridge') {
        // Keyboard at the fridge: take the next ingredient in rotation, so
        // the game is fully playable without a mouse.
        const ids = Object.keys(INGREDIENTS);
        const id = ids[world.fridgeIndex % ids.length];
        world.fridgeIndex = (world.fridgeIndex || 0) + 1;
        playSound(takeFromFridge(world, id));
      } else {
        playSound(sound);
      }
    }
    world.lastSound = null;
    step(world, dt, input);
    if (world.lastSound && world.lastSound !== lastSoundSeen) playSound(world.lastSound);
    lastSoundSeen = world.lastSound;
    if (world.screen === SCREEN_OVER) stopMusic();
  }

  draw(ctx, world, paused);
  if (status) {
    const line = world.screen === SCREEN_TITLE
      ? 'Sizzle and Sage. Press Enter to start cooking.'
      : world.screen === SCREEN_OVER
        ? `Day complete. ${world.coins} coins, ${world.served} dishes served.`
        : `${world.served} served, ${world.coins} coins, ${Math.ceil(world.dayLeft)} seconds left.`;
    if (status.textContent !== line) status.textContent = line;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
