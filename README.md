# Dino Dash

A chunky-pixel endless runner in 3D, inspired by the classic offline dino game.
You start the way you remember: a grey dino in a grey desert, jumping cacti
and ducking bats. Hit **200** and the world explodes into colour, and then it
keeps changing: nineteen worlds, each with its own gimmick and its own
chiptune theme.

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
| Ability (fire, pickaxe, gun, phase, dash) | X / F / E / Shift | X / B / RT | action button |
| Switch lanes (Neon Highway) | ← → / A D | LB / RB | ◀ ▶ |
| Camera: 2.5D → 3rd person → 1st person | C | Y | camera chip |
| Pixel size (chunky / big / fine) | V | | menu |
| Pause / menu | P / Esc | Start | II |
| Mute | M | | sound chip |

Speed, scoring, jumping and where obstacles appear follow the original
offline dino game's open-source rules (Chromium, BSD licence; see
`src/game/classic.js`): speed starts at 6 px/frame and gains 0.001 every
frame up to 13, score is pixels run × 0.025, the first 3 seconds are clear,
and each gap is random between `width × speed + minGap × 0.6` and 1.5× that.
The classic desert follows them exactly; the power-up worlds get gaps 25%
wider, since they throw more at you.

Your score climbs with distance; the game gets faster the further you go.
The score blinks and beeps every 100. Your best score and the furthest world
you've reached are saved, and the title screen lets you start in any world
you've unlocked. Once you've reached every world, runs visit them in a
random order.

Worlds with an ability also throw **walls** at you: too tall to jump and
nothing to duck under, so you have to burn, mine, shoot, phase or dash
through. A prompt flashes when one is coming.

## The worlds

| # | World | Gimmick |
| --- | --- | --- |
| 1 | **Classic Desert** | None: grey, silent, pure. Cacti on the ground, bats in the air. |
| 2 | **Pixel Forest** | Double jump. Some log stacks are too tall for one. |
| 3 | **Mount Magma** | The dino breathes fire (X) and burns rocks, spikes, fire bats and towering thorn walls. |
| 4 | **The Moon** | Crazy low gravity: huge floaty jumps, ↓ to slam back down. UFOs hover at every height. |
| 5 | **Block World** | A diamond pickaxe (X) to take out walking zombies, dirt blocks and stone walls. |
| 6 | **Deep Reef** | The dino swims: hold jump to rise, let go to sink, past coral, jellyfish and sharks. |
| 7 | **Crystal Cave** | Pitch dark except for a headlamp, and some stalactites fall as you get close. |
| 8 | **Aisle 9** | The dino rides a shopping cart; drive through spills for a spin bonus. Watch for runaway carts. |
| 9 | **Sugar Rush** | Eat floating candy to go GIANT and smash through everything for 5 seconds. |
| 10 | **Frostbite Peaks** | Snowboard: big air turns into a flip and bonus points. Penguins slide at you. |
| 11 | **Neon Highway** | Three lanes on a hoverboard: dodge synthwave traffic left and right. |
| 12 | **Interstellar** | Jump flips gravity: run on the floor or the ceiling, past asteroids on both. |
| 13 | **Shadow City** | Film noir in black and white, except for gold. The dino packs a pistol (X) with gold bullets: goons drop in one shot, bruisers take three. |
| 14 | **Planet Zorb** | Phase (X) to pass through force fields. Tentacles burst out of the ground as you get close. |
| 15 | **Haunted Hollow** | Ghosts fade in and out and are only solid while you can see them. Zombie hands, pumpkins, a spooky waltz. |
| 16 | **Sky Kingdom** | Gaps in the cloud path: fall in and it's over. Hold jump to open a parasol and glide over the wide ones. |
| 17 | **Bamboo Dojo** | Dash (X) with a katana to cut through paper walls and throwing stars. |
| 18 | **Toy Box** | On a pogo stick you never stop bouncing: hold jump for big bounces, down for small ones. |
| 19 | **Splash Lagoon** | Swimming on the surface: leap out over buoys and shark fins, hold down to dive under logs and gulls. |

After Splash Lagoon the run loops back to the forest for another lap, faster.

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
- **Lighting.** Voxel models get per-corner ambient occlusion when they're
  built; the sun casts real shadows; a coloured rim light outlines
  silhouettes; and the final pass adds bloom, a per-world colour grade and
  (in Shadow City) a noir filter that keeps only gold and orange in colour.
- **Facing the camera.** Obstacles are drawn side-on for the 2.5D view. In
  the chase and first-person views they turn toward the camera, and cars,
  carts, sharks and planes swap to head-on drawings.
- **Chiptune.** `src/audio/Audio.js` is a small four-channel engine in the
  style of an old console: two pulse channels (12.5/25/50% duty), a stepped
  4-bit triangle bass and noise drums, with vibrato and a dotted-8th echo.
  Every world's theme is written by hand in `src/audio/songs.js` in a
  compact note format (melody, chords, bass and drum styles).
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
src/audio/     Audio.js: chiptune engine and effects; songs.js: every theme
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
