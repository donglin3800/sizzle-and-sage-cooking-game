# sizzle-and-sage-cooking-game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/donglin3800/sizzle-and-sage-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/donglin3800/sizzle-and-sage-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle & Sage is an original lunch-rush cooking game: orders land on the board, you grab ingredients from the fridge, chop the veg, grill the patties, build each plate to match its order and serve it before the customer walks out. Fast serves earn tips, consecutive serves build a combo multiplier, and the last thirty seconds are a rush hour with golden tickets worth double. Five recipes, a 150-second day, keyboard and mouse play, and all sound is synthesised in the browser — no audio files, no network requests.

## Run it

```sh
python3 -m http.server --directory game 8000
```

Then open http://localhost:8000 in desktop Chrome. Move with WASD or the arrow keys, press E or Space to use the nearest station, click a station to walk to it, or press 1–6 to grab an ingredient straight from the fridge. M mutes, P pauses, Enter starts a new day.

## How it plays

- **Fridge** — six ingredients: bun, patty, cheese, tomato, lettuce, onion.
- **Chopping Board** — raw tomato, lettuce and onion must be chopped before they can be plated.
- **Grill** — two slots; a patty grills in six seconds and burns six seconds later. Burnt food goes in the bin, never on a plate.
- **Plating Counter** — build the dish. A plate only matches an order when it holds exactly that recipe's prepared items.
- **Serve Window** — serve a matching plate. The faster the serve, the bigger the tip; golden orders in the rush hour pay double.

## Files

- `game/index.html` — the page, nothing but a canvas and one module script.
- `game/src/config.js` — the kitchen, ingredients, recipes and tuning numbers.
- `game/src/world.js` — the game state and rules: orders, chopping, grilling, plating, serving, combos and the day timer.
- `game/src/render.js` — every pixel of the kitchen, drawn on canvas.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — synthesised sound effects and a bass-line loop, WebAudio only.
- `game/src/shots.js` — the four staged frames (`?shot=start|play|rush|end`) used for the screenshots.
- `game/src/main.js` — the game loop and screen wiring.
- `main.ts` — the make.fun entrypoint: copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=frrbny3y&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
