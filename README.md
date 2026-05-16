# Garage Hell

Garage Hell is a small local playable prototype of a retro, Doom-inspired first-person shooter set inside a cursed auto repair shop. You play a trapped mechanic clearing Oil Imps from service bays, an office, a parts room, and a wet back alley.

This first version is intentionally small: one level, one weapon, one enemy type, pickups, a red locked door, death, restart, and a win condition.

## Required Software

- Node.js 18 or newer
- npm

Godot 4 was the preferred target, but this workspace did not have Godot available, so the prototype uses the practical fallback: Vite, Three.js, HTML, CSS, and JavaScript.

## Run Locally

### Easiest on Mac

Double-click `play.command`.

It installs dependencies if needed, opens the game in your browser, and starts the local server. Keep the terminal window open while playing.

### Manual

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

Click inside the gameplay viewport to shoot. Drag inside the viewport to look around.

## Controls

- WASD: move
- Drag mouse in viewport: look
- Click: shoot the Impact Shotgun
- Shift: sprint
- Space: jump
- R: reload
- E: interact/open door
- Esc: release browser focus if needed
- Enter: restart from death/win screen

## Objective

Clear all Oil Imps. Explore the garage, collect supplies, find the red key, open the locked parts room, and survive the final fight in the back alley.

## Current Features

- First-person movement with mouse look, sprinting, jumping, collision, health, armor, damage feedback, death, and restart
- Impact Shotgun with visible placeholder weapon, ammo, reserve shells, cooldown, reload, muzzle flash, recoil kick, and simple placeholder audio
- Oil Imp enemies that chase, attack in melee, take damage, flash on hit, and die
- One compact cursed garage level with service bays, lifts, toolboxes, oil barrels, shop lights, office, parts room, locked door, and back alley
- Pickups for health, armor, shells, red key, and blue key placeholder
- Liquid-glass inspired HUD panels outside the gameplay POV for health, armor, ammo, keys, items, objective, and status
- Start screen, death screen, restart, win screen, and enemy counter

## Known Issues

- Enemy navigation is intentionally simple; Oil Imps steer around collision but can bunch up around narrow doorways.
- Audio is generated with basic Web Audio tones instead of finished sound assets.
- Art is all original placeholder geometry and procedural materials.
- There is no save system, options menu, or mobile/touch support.

## Suggested Next Features

- Add a second weapon, such as a nail driver or cursed wrench launcher
- Replace placeholder Oil Imp geometry with custom animated low-poly models
- Add proper pathfinding nodes for enemies
- Add more interactable shop hazards, like exploding oil drums and sparking lifts
- Add stronger end encounter logic for the back alley
- Add music, ambient loops, and polished sound effects
- Add graphics options and mouse sensitivity settings
