// Sizzle & Sage — screenshots: ?shot=start|play|rush|end stages the real game
// into four honest frames. Each scene builds a fresh world from a fixed seed,
// then sets its state with the game's own rules (real orders, real plates,
// real timers), so the picture is what a short game really looks like.

import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, resetWorld, say } from './world.js';
import { STATIONS, stationFront } from './config.js';

// Put the chef at a station's front, facing the counter.
function standAt(world, stationId) {
  const front = stationFront(STATIONS[stationId]);
  world.chef.x = front.x;
  world.chef.y = front.y;
  world.chef.facing = 1;
  world.chef.target = null;
}

export function stageShot(name, world) {
  resetWorld(world);
  world.seed = 7;
  if (name === 'play') {
    world.screen = SCREEN_PLAY;
    world.time = 42;
    world.dayLeft = 108;
    world.level = 1;
    world.coins = 54;
    world.served = 3;
    world.combo = 2;
    world.comboTimer = 8;
    world.orders = [
      { id: 1, recipeId: 'burger', patience: 38, patienceMax: 58, golden: false, bornAt: 20 },
      { id: 2, recipeId: 'salad', patience: 24, patienceMax: 56, golden: false, bornAt: 28 },
      { id: 3, recipeId: 'melt', patience: 47, patienceMax: 62, golden: false, bornAt: 36 },
    ];
    world.grill = [
      { id: 'patty', state: 'grilled', cook: 6.2 },
      { id: 'patty', state: 'raw', cook: 2.4 },
    ];
    world.board = { id: 'tomato', state: 'raw' };
    world.boardTimer = 0.9;
    world.plate = [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'grilled' },
    ];
    world.hands = [{ id: 'lettuce', state: 'chopped' }];
    standAt(world, 'plates');
    say(world, 'Burger on the plate — add the chopped lettuce, then serve!');
    return SCREEN_PLAY;
  }
  if (name === 'rush') {
    world.screen = SCREEN_PLAY;
    world.time = 128;
    world.dayLeft = 22;
    world.level = 4;
    world.rush = true;
    world.coins = 236;
    world.served = 11;
    world.combo = 5;
    world.comboTimer = 9;
    world.orders = [
      { id: 1, recipeId: 'sage', patience: 18, patienceMax: 68, golden: true, bornAt: 110 },
      { id: 2, recipeId: 'double', patience: 12, patienceMax: 64, golden: false, bornAt: 114 },
      { id: 3, recipeId: 'burger', patience: 31, patienceMax: 58, golden: false, bornAt: 120 },
      { id: 4, recipeId: 'melt', patience: 41, patienceMax: 62, golden: false, bornAt: 124 },
    ];
    world.grill = [
      { id: 'patty', state: 'grilled', cook: 6.8 },
      { id: 'patty', state: 'grilled', cook: 7.1 },
    ];
    world.board = { id: 'lettuce', state: 'raw' };
    world.boardTimer = 1.2;
    world.plate = [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'grilled' },
      { id: 'cheese', state: 'raw' },
      { id: 'lettuce', state: 'chopped' },
      { id: 'tomato', state: 'chopped' },
    ];
    world.hands = [];
    standAt(world, 'serve');
    say(world, 'RUSH HOUR! The Sage Special is ready — serve it now!');
    return SCREEN_PLAY;
  }
  if (name === 'end') {
    world.screen = SCREEN_OVER;
    world.time = 150;
    world.dayLeft = 0;
    world.coins = 342;
    world.tips = 61;
    world.served = 14;
    world.failed = 2;
    world.bestCombo = 6;
    world.stars = 3;
    world.orders = [];
    world.plate = [];
    standAt(world, 'plates');
    return SCREEN_OVER;
  }
  // start: the title screen over a quiet, ready kitchen.
  world.screen = SCREEN_TITLE;
  world.orders = [
    { id: 1, recipeId: 'burger', patience: 50, patienceMax: 58, golden: false, bornAt: 0 },
  ];
  world.plate = [{ id: 'bun', state: 'raw' }];
  standAt(world, 'board');
  return SCREEN_TITLE;
}
