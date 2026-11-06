# Dino Dash

A chunky-pixel endless runner in 3D, inspired by the classic offline dino game.
You start the way you remember: a grey dino in a grey desert, jumping cacti
and ducking bats. Hit **200** and the world explodes into colour, and then it
keeps changing: twelve worlds, each with its own gimmick.

Play it from the classic side view (tilted a little so you can feel the
depth), from a third-person chase camera, or through the dino's own eyes.
Switch at any time with **C**; every view plays the same run.

Built with [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/).
Every model, texture and sound is generated in code at runtime. The only
bundled asset is the Press Start 2P font (SIL Open Font License, via
`@fontsource/press-start-2p`).

## Launch

Requires [Node.js](https://nodejs.org/) 18+ and a browser with WebGL.

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173). A static build
for any web host:

```bash
npm run build
npm run preview
```

## How to play

| Action | Keys | Gamepad | Touch |
| --- | --- | --- | --- |
| Jump (hold for higher) | Space / ↑ / W | A / D-pad up | Tap, or JUMP |
| Duck · fast-fall in the air | ↓ / S | D-pad down / stick | DUCK |
| Gimmick (fire, pickaxe) | X / F / E / Shift | X / B / RT | FIRE / PICK |
| Switch lanes (Neon Highway) | ← → / A D | LB / RB | ◀ ▶ |
| Camera: 2.5D → 3rd person → 1st person | C | Y | camera chip |
| Pixel size (chunky / big / fine) | V | | menu |
| Pause / menu | P / Esc | Start | II |
| Mute | M | | sound chip |

Your score climbs with distance; the game gets faster the further you go.
The score blinks and beeps every 100. Your best score and the furthest world
you've reached are saved, and the title screen lets you start in any world
you've unlocked.

## The worlds

| # | World | Gimmick |
| --- | --- | --- |
| 1 | **Classic Desert** | None: grey, silent, pure. Cacti on the ground, bats in the air. |
| 2 | **Pixel Forest** | Double jump. Some log stacks are too tall for one. |
| 3 | **Mount Magma** | The dino breathes fire (X) and burns rocks, spikes and fire bats. |
| 4 | **The Moon** | Crazy low gravity: huge floaty jumps, ↓ to slam back down. UFOs hover at every height. |
| 5 | **Block World** | A diamond pickaxe (X) to take out walking zombies and mine dirt blocks. |
| 6 | **Deep Reef** | The dino swims: hold jump to rise, let go to sink, past coral, jellyfish and sharks. |
| 7 | **Crystal Cave** | Pitch dark except for a headlamp, and some stalactites fall as you get close. |
| 8 | **Aisle 9** | The dino rides a shopping cart; drive through spills for a spin bonus. Watch for runaway carts. |
| 9 | **Sugar Rush** | Eat floating candy to go GIANT and smash through everything for 5 seconds. |
| 10 | **Frostbite Peaks** | Snowboard: big air turns into a flip and bonus points. Penguins slide at you. |
| 11 | **Neon Highway** | Three lanes on a hoverboard: dodge synthwave traffic left and right. |
| 12 | **Interstellar** | Jump flips gravity: run on the floor or the ceiling, past asteroids on both. |

After Interstellar the run loops back to the forest for another lap, faster.

## How it works

- **Big pixels, fast.** The scene renders into a low-resolution target (one
  texel is 2–4 screen pixels) and is blown up with nearest filtering. That is
  both the look and most of the speed: the fill cost is tiny. The sim runs at
  a fixed 120 Hz.
- **Voxels from pixel art.** Every model is drawn as pixel art in
  `src/render/sprites.js` and extruded into voxels. Pixels far from the edge
  of a drawing are pushed out deeper, so flat sprites become rounded, chunky
  3D models while staying perfectly pixelated from the side. Each model is a
  single geometry with vertex colours; scenery is instanced.
- **Grey to colour.** The classic desert is drawn in greys and the final pass
  snaps everything to four tones. At 200 a circle of colour bursts out of the
  dino on screen while the grey scenery shatters into voxels.
- **Fair by construction.** `src/game/Bot.js` is a look-ahead autopilot that
  clones the game and tries input plans. The tests make it run every world;
  if it ever can't survive, the spawner made something impossible. It also
  plays the title-screen demo (add `?bot` to the URL to watch it play a run).

## Project layout

```
src/game/      Game.js (simulation), maps.js (worlds + spawn tables), Bot.js
src/render/    sprites, voxel builder, models, themes, World, DinoView,
               ObstacleView, Particles, CameraRig, Post (pixel + colour pass)
src/audio/     Audio.js: synthesised effects and per-world chiptune
tests/         unit tests (node --test) and an end-to-end browser check
```

## Tests

```bash
npm test             # physics, gimmicks, world progression, fairness
npm run build && npm run test:e2e   # drives the real game in Chrome
```

The end-to-end check uses `playwright-core` with a local Chrome/Chromium
(set `CHROMIUM_PATH` if it isn't found) and saves screenshots to
`test-results/`.

## License

MIT
