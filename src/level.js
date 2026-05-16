import * as THREE from "three";
import { makeAabb, makeTextSprite, pointInAabb } from "./utils.js";
import { Pickup } from "./pickups.js";

export class Level {
  constructor(scene, viewport) {
    this.scene = scene;
    this.viewport = viewport;
    this.colliders = [];
    this.doors = [];
    this.pickups = [];
    this.enemySpawns = [];
    this.decor = [];
    this.build();
  }

  clear() {
    for (const object of this.decor) this.scene.remove(object);
    for (const door of this.doors) this.scene.remove(door.mesh);
    for (const pickup of this.pickups) this.scene.remove(pickup.mesh);
    this.colliders = [];
    this.doors = [];
    this.pickups = [];
    this.enemySpawns = [];
    this.decor = [];
  }

  rebuild() {
    this.clear();
    this.build();
  }

  build() {
    this.addLighting();
    this.addFloors();
    this.addCeiling();
    this.addPerimeter();
    this.addGarageDressing();
    this.addOffice();
    this.addPartsRoom();
    this.addBackAlley();
    this.addDoors();
    this.addPickups();
    this.enemySpawns = [
      { x: -6.4, z: -3.6 },
      { x: 6.1, z: -4.0 },
      { x: 6.8, z: -0.5 },
      { x: -1.8, z: -5.0 },
      { x: -12.2, z: 5.8 },
      { x: 10.7, z: 0.6 },
      { x: 12.7, z: -4.0 },
      { x: 1.2, z: -10.2 },
      { x: 7.8, z: -11.2 },
      { x: 13.8, z: -8.2 }
    ];
  }

  /* ═══════════════════════════════════════════════════
     LIGHTING — dramatic contrast, colored pools
     ═══════════════════════════════════════════════════ */
  addLighting() {
    // Very dim hemisphere — dark darks, warm sky
    const ambient = new THREE.HemisphereLight(0x8a7060, 0x0a0608, 0.65);
    this.scene.add(ambient);
    this.decor.push(ambient);

    // Overhead fluorescent tubes — cool white-green, harsh
    const fluoro = [
      { pos: [-2, 4.0, 1.5], int: 4.0, dist: 14 },
      { pos: [4, 4.0, -2], int: 3.5, dist: 12 },
      { pos: [-5, 3.8, 5], int: 2.8, dist: 10 },
      { pos: [6, 3.8, -10], int: 2.5, dist: 10 }
    ];
    for (const f of fluoro) {
      const light = new THREE.PointLight(0xd4e8c8, f.int, f.dist);
      light.position.set(...f.pos);
      this.scene.add(light);
      this.decor.push(light);
    }

    // HELL BENT neon sign — strong red wash
    const neonMain = new THREE.PointLight(0xff2200, 8.0, 16);
    neonMain.position.set(0, 3.0, 7.0);
    this.scene.add(neonMain);
    this.decor.push(neonMain);
    // Secondary neon bounce
    const neonBounce = new THREE.PointLight(0xff3311, 3.5, 10);
    neonBounce.position.set(0, 0.5, 6.0);
    this.scene.add(neonBounce);
    this.decor.push(neonBounce);

    // OFFICE neon sign — red glow
    const officeNeon = new THREE.PointLight(0xff3322, 4.0, 8);
    officeNeon.position.set(-8.3, 2.8, 4.2);
    this.scene.add(officeNeon);
    this.decor.push(officeNeon);

    // Cool blue fill in office
    const officeCool = new THREE.PointLight(0x3366aa, 2.0, 8);
    officeCool.position.set(-11, 3.0, 4);
    this.scene.add(officeCool);
    this.decor.push(officeCool);

    // Warm amber in parts room
    const partsWarm = new THREE.PointLight(0xffaa55, 2.5, 10);
    partsWarm.position.set(11.5, 3.5, -1.5);
    this.scene.add(partsWarm);
    this.decor.push(partsWarm);

    // Hell glow from oil pits
    const hellGlow = new THREE.PointLight(0xff1100, 5.0, 8);
    hellGlow.position.set(-1.7, 0.3, 4.9);
    const hellGlow2 = new THREE.PointLight(0xff2200, 3.5, 8);
    hellGlow2.position.set(1.2, 0.3, -9.6);
    this.scene.add(hellGlow, hellGlow2);
    this.decor.push(hellGlow, hellGlow2);

    // Back alley dim fill
    const alleyFill = new THREE.PointLight(0x445566, 1.5, 12);
    alleyFill.position.set(6, 3.0, -10);
    this.scene.add(alleyFill);
    this.decor.push(alleyFill);

    // Subtle directional for overall form readability
    const keyLight = new THREE.DirectionalLight(0xffeedd, 0.35);
    keyLight.position.set(-3, 8, 5);
    this.scene.add(keyLight);
    this.decor.push(keyLight);
  }

  /* ═══════════════════════════════════════════════════
     FLOORS — wet reflective concrete
     ═══════════════════════════════════════════════════ */
  addFloors() {
    // Main garage — wet dark concrete
    this.addFloorSlab(0, 1, 16, 14, 0x2a2622, 0x0a0806, 0.15, 0.45);
    // Office — slightly cooler
    this.addFloorSlab(-11, 4, 6, 6, 0x222830, 0x060810, 0.2, 0.35);
    // Parts room
    this.addFloorSlab(11, -1.5, 6, 7, 0x28241e, 0x080604, 0.18, 0.4);
    // Back alley — darkest, wettest
    this.addFloorSlab(6, -9.5, 18, 7, 0x161a20, 0x040508, 0.1, 0.55);
  }

  addFloorSlab(x, z, width, depth, color, emissiveColor, roughness, metalness) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive: emissiveColor,
      emissiveIntensity: 0.08
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, depth), mat);
    floor.position.set(x, -0.1, z);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.decor.push(floor);

    // Oil stain patches on floor
    const stainMat = new THREE.MeshStandardMaterial({
      color: 0x0a0808,
      roughness: 0.05,
      metalness: 0.7,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });
    const stainCount = Math.floor(width * depth / 12);
    for (let i = 0; i < stainCount; i++) {
      const sx = x + (Math.random() - 0.5) * (width - 1);
      const sz = z + (Math.random() - 0.5) * (depth - 1);
      const size = 0.6 + Math.random() * 1.2;
      const stain = new THREE.Mesh(new THREE.CircleGeometry(size, 8), stainMat);
      stain.rotation.x = -Math.PI / 2;
      stain.position.set(sx, 0.005, sz);
      this.scene.add(stain);
      this.decor.push(stain);
    }
  }

  /* ═══════════════════════════════════════════════════
     CEILING — dark industrial with exposed beams
     ═══════════════════════════════════════════════════ */
  addCeiling() {
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.95,
      metalness: 0.0,
      emissive: 0x030303,
      emissiveIntensity: 0.1
    });
    // Main garage ceiling
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.15, 14.5), ceilMat);
    ceil.position.set(0, 4.2, 1);
    this.scene.add(ceil);
    this.decor.push(ceil);

    // Exposed ceiling beams
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.85, metalness: 0.1 });
    for (let bx = -6; bx <= 6; bx += 4) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 14), beamMat);
      beam.position.set(bx, 4.0, 1);
      this.scene.add(beam);
      this.decor.push(beam);
    }
    // Cross beams
    for (let bz = -4; bz <= 7; bz += 5.5) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 0.15), beamMat);
      beam.position.set(0, 3.9, bz);
      this.scene.add(beam);
      this.decor.push(beam);
    }

    // Fluorescent tube fixtures (visible glowing geometry)
    const fixtureMat = new THREE.MeshStandardMaterial({
      color: 0xeeffee,
      emissive: 0xccffcc,
      emissiveIntensity: 3.0,
      roughness: 0.1
    });
    const fixtureHousing = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6, metalness: 0.3 });
    const fixtures = [[-2, 1.5], [4, -2], [-5, 5], [6, -10]];
    for (const [fx, fz] of fixtures) {
      // Housing
      const housing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.3), fixtureHousing);
      housing.position.set(fx, 3.75, fz);
      this.scene.add(housing);
      this.decor.push(housing);
      // Glowing tube
      const tube = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.08), fixtureMat);
      tube.position.set(fx, 3.7, fz);
      this.scene.add(tube);
      this.decor.push(tube);
    }
  }

  addBox(x, y, z, width, height, depth, color, collider = true, emissive = 0x000000, opts = {}) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.72,
      metalness: opts.metalness ?? 0.08,
      emissive,
      emissiveIntensity: emissive ? (opts.emissiveIntensity ?? 0.55) : 0.04
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    box.position.set(x, y, z);
    box.castShadow = true;
    box.receiveShadow = true;
    this.scene.add(box);
    this.decor.push(box);
    if (collider) {
      this.colliders.push({ active: true, aabb: makeAabb(x, z, width, depth), object: box });
    }
    return box;
  }

  /* ═══════════════════════════════════════════════════
     PERIMETER — cinder block textured walls
     ═══════════════════════════════════════════════════ */
  addPerimeter() {
    const wallColor = 0x4a443e;
    const wallOpts = { roughness: 0.92, metalness: 0.02 };

    // Main room walls
    this.addWall(0, 1.8, 8.25, 16.5, 3.6, 0.5, wallColor, wallOpts);
    this.addWall(-8.25, 1.8, -2.5, 0.5, 3.6, 7.2, wallColor, wallOpts);
    this.addWall(-8.25, 1.8, 6.5, 0.5, 3.6, 3.5, wallColor, wallOpts);
    this.addWall(8.25, 1.8, 4.8, 0.5, 3.6, 6.8, wallColor, wallOpts);
    this.addWall(8.25, 1.8, -5.1, 0.5, 3.6, 1.8, wallColor, wallOpts);
    this.addWall(-5.6, 1.8, -6.25, 5.2, 3.6, 0.5, wallColor, wallOpts);
    this.addWall(6.8, 1.8, -6.25, 2.8, 3.6, 0.5, wallColor, wallOpts);

    // Office walls — slightly cooler
    const officeColor = 0x3a4048;
    this.addWall(-14.25, 1.8, 4, 0.5, 3.6, 6.5, officeColor, wallOpts);
    this.addWall(-11, 1.8, 0.75, 6.5, 3.6, 0.5, officeColor, wallOpts);
    this.addWall(-11, 1.8, 7.25, 6.5, 3.6, 0.5, officeColor, wallOpts);
    this.addWall(-8.25, 1.8, 1.8, 0.5, 3.6, 2.1, officeColor, wallOpts);
    this.addWall(-8.25, 1.8, 6.5, 0.5, 3.6, 1.5, officeColor, wallOpts);

    // Parts room walls
    const partsColor = 0x443c36;
    this.addWall(14.25, 1.8, -1.5, 0.5, 3.6, 7.5, partsColor, wallOpts);
    this.addWall(11, 1.8, 2.25, 6.5, 3.6, 0.5, partsColor, wallOpts);
    this.addWall(11, 1.8, -5.25, 6.5, 3.6, 0.5, partsColor, wallOpts);
    this.addWall(8.25, 1.8, 0.75, 0.5, 3.6, 3, partsColor, wallOpts);
    this.addWall(8.25, 1.8, -4.0, 0.5, 3.6, 2.3, partsColor, wallOpts);

    // Back alley walls
    const alleyColor = 0x2e3038;
    this.addWall(-3.25, 1.8, -9.5, 0.5, 3.6, 7.5, alleyColor, wallOpts);
    this.addWall(15.25, 1.8, -9.5, 0.5, 3.6, 7.5, alleyColor, wallOpts);
    this.addWall(6, 1.8, -13.25, 18.5, 3.6, 0.5, alleyColor, wallOpts);
    this.addWall(11.2, 1.8, -6.25, 8.6, 3.6, 0.5, alleyColor, wallOpts);
  }

  addWall(x, y, z, width, height, depth, color, opts) {
    // Main wall body
    const wallMat = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.92,
      metalness: opts.metalness ?? 0.02,
      emissive: 0x060504,
      emissiveIntensity: 0.06
    });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.decor.push(wall);
    this.colliders.push({ active: true, aabb: makeAabb(x, z, width, depth), object: wall });

    // Cinder block line pattern (horizontal mortar lines)
    const isWide = width > depth;
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x2a2520, transparent: true, opacity: 0.35 });
    const lineCount = Math.floor(height / 0.4);
    for (let i = 0; i < lineCount; i++) {
      const ly = y - height / 2 + 0.2 + i * 0.4;
      let line;
      if (isWide) {
        line = new THREE.Mesh(new THREE.BoxGeometry(width + 0.01, 0.02, depth + 0.02), lineMat);
      } else {
        line = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, 0.02, depth + 0.01), lineMat);
      }
      line.position.set(x, ly, z);
      this.scene.add(line);
      this.decor.push(line);
    }

    // Baseboard — darker strip at bottom
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: 0.95, metalness: 0.0 });
    const baseH = 0.25;
    const base = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, baseH, depth + 0.04), baseMat);
    base.position.set(x, baseH / 2, z);
    this.scene.add(base);
    this.decor.push(base);
  }

  /* ═══════════════════════════════════════════════════
     GARAGE DRESSING — cars, lifts, toolboxes, signs, drums
     ═══════════════════════════════════════════════════ */
  addGarageDressing() {
    // ── Service bay oil pits ──
    this.addOilPit(-3.7, 1.2, 2.2, 4.2);
    this.addOilPit(3.9, 1.1, 2.2, 4.2);

    // ── Car lifts with cars ──
    this.addCarOnLift(-3.7, 1.2, 0xaa2222);
    this.addCarOnLift(3.9, 1.1, 0xaa2222);

    // ── Red toolbox chest (left wall) ──
    this.addToolbox(-6.8, 6.2);
    // ── Blue toolbox (right area) ──
    this.addToolbox(6.8, 6.0, 0x1855aa);

    // ── Tire stacks ──
    this.addTireStack(-7.2, -4.5, 3);
    this.addTireStack(7.4, 6.8, 2);
    this.addTireStack(-7.0, 2.0, 2);

    // ── Oil drums ──
    this.addOilDrum(-0.8, -4.3);
    this.addOilDrum(0.5, -4.3);
    this.addOilDrum(1.8, -4.3);
    this.addOilDrum(7.0, -4.8);

    // ── Wet floor caution signs ──
    this.addWetFloorSign(-1.0, 3.0);
    this.addWetFloorSign(5.0, -8.5);

    // ── Oil spill puddles (reflective) ──
    this.addOilPuddle(-1.7, 4.9, 2.4, 1.3);
    this.addOilPuddle(4.8, -2.8, 2.8, 1.0);
    this.addOilPuddle(2.0, -9.0, 3.0, 1.5);

    // ── Floor safety lines — yellow hazard stripes ──
    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0xddaa00,
      emissive: 0x665500,
      emissiveIntensity: 0.3,
      roughness: 0.6,
      metalness: 0.1
    });
    const hazardPositions = [
      [0, 5.25, 13.2, 0.12], [0, -5.35, 13.2, 0.12],
      [-7.1, 0, 0.12, 10.8], [7.1, 0, 0.12, 10.8]
    ];
    for (const [hx, hz, hw, hd] of hazardPositions) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(hw, 0.015, hd), hazardMat);
      stripe.position.set(hx, 0.015, hz);
      this.scene.add(stripe);
      this.decor.push(stripe);
    }

    // ── HELL BENT AUTO REPAIR — main neon sign ──
    this.addNeonSign("HELL BENT", 0, 3.2, 7.85, 5.5, 0.9, 0xff2200, 0xff1100, 48);
    this.addNeonSign("AUTO REPAIR", 0, 2.35, 7.85, 4.2, 0.6, 0xff3300, 0xff2200, 32);

    // ── Wall-mounted poster: "OIL CHANGES / WE LUBE / WE SLAY" ──
    this.addWallPoster(-7.9, 2.4, 5.5, "OIL CHANGES\nWE LUBE\nWE SLAY", 0xddccaa, 0x2a2218);

    // ── Workbench near back wall ──
    this.addBox(5.5, 0.48, 7.2, 3.0, 0.96, 0.8, 0x4a3828, true, 0x000000, { roughness: 0.85 });
    // Vise on workbench
    this.addBox(5.5, 1.05, 7.1, 0.3, 0.35, 0.3, 0x555555, false, 0x000000, { roughness: 0.4, metalness: 0.6 });
    // Tools on bench
    this.addBox(4.8, 1.0, 7.15, 0.5, 0.08, 0.15, 0x666666, false, 0x000000, { roughness: 0.3, metalness: 0.7 });
    this.addBox(6.2, 1.0, 7.15, 0.35, 0.06, 0.1, 0x888888, false, 0x000000, { roughness: 0.2, metalness: 0.8 });

    // ── Pipe runs along walls (visual detail) ──
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x555550, roughness: 0.5, metalness: 0.4 });
    // Horizontal pipe along back wall
    const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 15, 6), pipeMat);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(0, 3.2, 7.95);
    this.scene.add(pipe1);
    this.decor.push(pipe1);
    // Vertical pipe on left wall
    const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6), pipeMat);
    pipe2.position.set(-7.95, 1.8, 0);
    this.scene.add(pipe2);
    this.decor.push(pipe2);
  }

  addCarOnLift(centerX, centerZ, liftColor) {
    const liftOpts = { roughness: 0.4, metalness: 0.4 };

    // Four lift posts
    const posts = [
      [centerX - 1.0, centerZ - 1.5],
      [centerX - 1.0, centerZ + 1.5],
      [centerX + 1.0, centerZ - 1.5],
      [centerX + 1.0, centerZ + 1.5]
    ];
    for (const [px, pz] of posts) {
      this.addBox(px, 1.2, pz, 0.18, 2.4, 0.18, liftColor, true, 0x330808, liftOpts);
    }
    // Cross arms
    this.addBox(centerX, 2.1, centerZ - 1.5, 2.2, 0.1, 0.1, liftColor, false, 0x220505, liftOpts);
    this.addBox(centerX, 2.1, centerZ + 1.5, 2.2, 0.1, 0.1, liftColor, false, 0x220505, liftOpts);

    // Lift platform
    const platMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.2 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 3.4), platMat);
    platform.position.set(centerX, 2.15, centerZ);
    this.scene.add(platform);
    this.decor.push(platform);

    // CAR on the lift — boxy sedan shape
    const carBody = new THREE.MeshStandardMaterial({
      color: 0x1a1a22,
      roughness: 0.35,
      metalness: 0.5,
      emissive: 0x020204,
      emissiveIntensity: 0.1
    });
    // Main body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 3.2), carBody);
    body.position.set(centerX, 2.6, centerZ);
    this.scene.add(body);
    this.decor.push(body);
    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.6), carBody);
    cabin.position.set(centerX, 3.15, centerZ - 0.2);
    this.scene.add(cabin);
    this.decor.push(cabin);

    // Hood — open (tilted up)
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x222230, roughness: 0.4, metalness: 0.45 });
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 1.0), hoodMat);
    hood.position.set(centerX, 3.3, centerZ + 1.3);
    hood.rotation.x = -0.7; // Tilted open
    this.scene.add(hood);
    this.decor.push(hood);

    // Wheels (visible under the car)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.0 });
    const wheelPositions = [
      [centerX - 0.85, 2.3, centerZ - 1.0],
      [centerX + 0.85, 2.3, centerZ - 1.0],
      [centerX - 0.85, 2.3, centerZ + 1.0],
      [centerX + 0.85, 2.3, centerZ + 1.0]
    ];
    for (const [wx, wy, wz] of wheelPositions) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 10), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      this.scene.add(wheel);
      this.decor.push(wheel);
    }
  }

  addToolbox(x, z, color = 0xcc2020) {
    // Multi-drawer rolling toolbox chest
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.35,
      emissive: color === 0xcc2020 ? 0x220000 : 0x000822,
      emissiveIntensity: 0.15
    });
    // Main body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.55), bodyMat);
    body.position.set(x, 0.6, z);
    body.castShadow = true;
    this.scene.add(body);
    this.decor.push(body);
    this.colliders.push({ active: true, aabb: makeAabb(x, z, 1.0, 0.65), object: body });

    // Drawer lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 5; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.015, 0.56), lineMat);
      line.position.set(x, 0.2 + i * 0.22, z);
      this.scene.add(line);
      this.decor.push(line);
    }

    // Chrome handles
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.2, metalness: 0.8 });
    for (let i = 0; i < 5; i++) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.04), handleMat);
      handle.position.set(x, 0.3 + i * 0.22, z - 0.28);
      this.scene.add(handle);
      this.decor.push(handle);
    }

    // Top surface
    const topMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.2 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.04, 0.58), topMat);
    top.position.set(x, 1.22, z);
    this.scene.add(top);
    this.decor.push(top);
  }

  addWetFloorSign(x, z) {
    // A-frame caution sign
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xddcc00,
      roughness: 0.5,
      metalness: 0.1,
      emissive: 0x665500,
      emissiveIntensity: 0.3
    });
    // Two angled panels forming an A
    const panel1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.02), signMat);
    panel1.position.set(x, 0.35, z - 0.08);
    panel1.rotation.x = 0.15;
    const panel2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.02), signMat);
    panel2.position.set(x, 0.35, z + 0.08);
    panel2.rotation.x = -0.15;
    this.scene.add(panel1, panel2);
    this.decor.push(panel1, panel2);

    // Warning text (just a dark strip for "CAUTION")
    const textMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const text = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.025), textMat);
    text.position.set(x, 0.4, z - 0.09);
    text.rotation.x = 0.15;
    this.scene.add(text);
    this.decor.push(text);
  }

  addOilPuddle(x, z, width, depth) {
    // Highly reflective oil puddle
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x080606,
      roughness: 0.02,
      metalness: 0.85,
      emissive: 0xff1100,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(Math.max(width, depth) / 2, 16), puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, 0.008, z);
    puddle.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
    this.scene.add(puddle);
    this.decor.push(puddle);
  }

  addNeonSign(text, x, y, z, scaleX, scaleY, color, emissive, fontSize) {
    // Backing plate
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x0a0404,
      roughness: 0.9,
      metalness: 0.0,
      emissive: 0x000000
    });
    const back = new THREE.Mesh(new THREE.BoxGeometry(scaleX + 0.4, scaleY + 0.15, 0.08), backMat);
    back.position.set(x, y, z);
    this.scene.add(back);
    this.decor.push(back);

    // Neon text sprite
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 128);
    // Glow effect
    ctx.shadowColor = `#${color.toString(16).padStart(6, '0')}`;
    ctx.shadowBlur = 20;
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.font = `900 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 64);
    // Double pass for extra glow
    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(scaleX, scaleY, 1);
    sprite.position.set(x, y, z + 0.05);
    this.scene.add(sprite);
    this.decor.push(sprite);
  }

  addWallPoster(x, y, z, text, textColor, bgColor) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = `#${bgColor.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = `#${textColor.toString(16).padStart(6, '0')}`;
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.textAlign = "center";
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      ctx.fillText(line, 128, 80 + i * 50);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.0,
      emissive: 0x111111,
      emissiveIntensity: 0.2
    });
    const poster = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 1.0), mat);
    poster.position.set(x, y, z);
    this.scene.add(poster);
    this.decor.push(poster);
  }

  addOilPit(x, z, width, depth) {
    // Dark recessed pit
    const pitMat = new THREE.MeshStandardMaterial({
      color: 0x040404,
      roughness: 0.95,
      metalness: 0.0,
      emissive: 0x080000,
      emissiveIntensity: 0.2
    });
    const pit = new THREE.Mesh(new THREE.BoxGeometry(width, 0.35, depth), pitMat);
    pit.position.set(x, -0.18, z);
    this.scene.add(pit);
    this.decor.push(pit);

    // Glowing edge rails (safety rails around pit)
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xddaa00,
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0x886600,
      emissiveIntensity: 0.4
    });
    const hw = width / 2;
    const hd = depth / 2;
    const rails = [
      [x, 0.03, z - hd, width + 0.1, 0.06, 0.06],
      [x, 0.03, z + hd, width + 0.1, 0.06, 0.06],
      [x - hw, 0.03, z, 0.06, 0.06, depth + 0.1],
      [x + hw, 0.03, z, 0.06, 0.06, depth + 0.1]
    ];
    for (const [rx, ry, rz, rw, rh, rd] of rails) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(rw, rh, rd), railMat);
      rail.position.set(rx, ry, rz);
      this.scene.add(rail);
      this.decor.push(rail);
    }
  }

  addTireStack(x, z, count) {
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.92, metalness: 0.0 });
    for (let i = 0; i < count; i++) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.14, 8, 16), tireMat);
      tire.position.set(x, 0.32 + i * 0.3, z);
      tire.rotation.x = Math.PI / 2;
      tire.rotation.z = i * 0.4;
      this.scene.add(tire);
      this.decor.push(tire);
    }
    this.colliders.push({ active: true, aabb: makeAabb(x, z, 0.7, 0.7), object: null });
  }

  addOilDrum(x, z) {
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x2a3540, roughness: 0.5, metalness: 0.3 });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.0, 12), drumMat);
    drum.position.set(x, 0.5, z);
    drum.castShadow = true;
    this.scene.add(drum);
    this.decor.push(drum);
    this.colliders.push({ active: true, aabb: makeAabb(x, z, 0.7, 0.7), object: drum });

    // Hazard band
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xcc8800,
      roughness: 0.4,
      metalness: 0.2,
      emissive: 0x442200,
      emissiveIntensity: 0.3
    });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.12, 12), bandMat);
    band.position.set(x, 0.7, z);
    this.scene.add(band);
    this.decor.push(band);

    // Lid
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x333840, roughness: 0.4, metalness: 0.4 });
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 12), lidMat);
    lid.position.set(x, 1.02, z);
    this.scene.add(lid);
    this.decor.push(lid);
  }

  /* ═══════════════════════════════════════════════════
     OFFICE
     ═══════════════════════════════════════════════════ */
  addOffice() {
    // Desk
    this.addBox(-12.2, 0.48, 2.1, 2.2, 0.96, 0.9, 0x5a3824, true, 0x000000, { roughness: 0.82 });
    // Filing cabinet
    this.addBox(-13.0, 0.75, 5.9, 0.9, 1.5, 0.55, 0x4a4a4a, true, 0x000000, { roughness: 0.5, metalness: 0.4 });
    // Monitor on desk
    this.addBox(-12.2, 1.15, 2.0, 0.7, 0.5, 0.05, 0x111111, false, 0x224488, { emissiveIntensity: 0.6 });
    // Chair
    this.addBox(-12.2, 0.35, 1.2, 0.5, 0.7, 0.5, 0x222222, false, 0x000000, { roughness: 0.7 });

    // OFFICE neon sign
    this.addNeonSign("OFFICE", -8.0, 2.6, 4.2, 1.8, 0.55, 0xff3322, 0xff2211, 52);

    // Desk lamp glow
    const deskLight = new THREE.PointLight(0xffcc88, 1.5, 5);
    deskLight.position.set(-12.2, 1.6, 2.1);
    this.scene.add(deskLight);
    this.decor.push(deskLight);
  }

  /* ═══════════════════════════════════════════════════
     PARTS ROOM
     ═══════════════════════════════════════════════════ */
  addPartsRoom() {
    // Metal shelving units
    const shelfColor = 0x555550;
    const shelfOpts = { roughness: 0.55, metalness: 0.4 };
    for (const z of [-4.0, -2.4, -0.8, 0.8]) {
      this.addBox(12.9, 0.85, z, 0.55, 1.7, 1.0, shelfColor, true, 0x000000, shelfOpts);
      this.addBox(10.0, 0.85, z, 0.55, 1.7, 1.0, shelfColor, true, 0x000000, shelfOpts);
    }
    // Crates
    this.addBox(11.3, 0.42, -3.1, 1.1, 0.84, 0.9, 0x6b4a2a, true, 0x000000, { roughness: 0.88 });
    this.addBox(12.1, 0.38, 1.1, 0.9, 0.76, 0.9, 0x7a5733, true, 0x000000, { roughness: 0.88 });

    // PARTS neon sign
    this.addNeonSign("PARTS", 8.5, 2.6, -1.5, 1.6, 0.5, 0xffaa33, 0xff8811, 50);
  }

  /* ═══════════════════════════════════════════════════
     BACK ALLEY
     ═══════════════════════════════════════════════════ */
  addBackAlley() {
    // Large cursed oil pit
    this.addOilPuddle(1.2, -9.6, 3.8, 1.8);
    // Hell glow from pit
    const pitGlow = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.05, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x0a0000, emissive: 0xff1100, emissiveIntensity: 1.5, roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.8 })
    );
    pitGlow.position.set(1.2, 0.01, -9.6);
    this.scene.add(pitGlow);
    this.decor.push(pitGlow);

    // Crate
    this.addBox(10.5, 0.42, -11.8, 1.0, 0.84, 1.0, 0x2a2e34, true, 0x000000, { roughness: 0.8 });
    // Oil drum
    this.addOilDrum(12.4, -9.4);
    // Extra drums
    this.addOilDrum(14.0, -11.0);

    // NO EXIT neon sign
    this.addNeonSign("NO EXIT", 6, 2.8, -12.85, 2.2, 0.55, 0xff2200, 0xff1100, 46);
  }

  /* ═══════════════════════════════════════════════════
     DOORS
     ═══════════════════════════════════════════════════ */
  addDoors() {
    const redDoor = this.createDoor("red", 8.25, -2.25, 0.32, 2.55, 0xaa1515);
    this.doors.push(redDoor);
    const alleyDoor = this.createDoor(null, 1.0, -6.25, 3.8, 0.32, 0x3a3e44, true);
    this.doors.push(alleyDoor);
  }

  createDoor(key, x, z, width, depth, color, startsOpen = false) {
    const group = new THREE.Group();

    // Door body — industrial metal
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.35,
      emissive: key === "red" ? 0x440000 : 0x000000,
      emissiveIntensity: key ? 0.4 : 0.0
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, 2.8, depth), bodyMat);
    body.position.y = 1.4;
    group.add(body);

    // Door panel lines (industrial look)
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
    for (let i = 0; i < 4; i++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(width + 0.01, 0.02, depth + 0.01), panelMat);
      panel.position.y = 0.5 + i * 0.65;
      group.add(panel);
    }

    if (key) {
      const keyColor = key === "red" ? 0xff2020 : key === "blue" ? 0x2080ff : 0xffcc00;
      const keyEmissive = key === "red" ? 0xff0000 : key === "blue" ? 0x0044ff : 0xffaa00;
      const frameMat = new THREE.MeshStandardMaterial({
        color: keyColor,
        emissive: keyEmissive,
        emissiveIntensity: 1.5,
        roughness: 0.25,
        metalness: 0.5
      });

      // Lock symbol (torus on door face)
      const lock = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 16), frameMat);
      lock.position.set(0, 1.5, -(depth / 2 + 0.02));
      group.add(lock);

      // Glowing frame edges
      const edgeTop = new THREE.Mesh(new THREE.BoxGeometry(width + 0.15, 0.08, depth + 0.08), frameMat);
      edgeTop.position.y = 2.8;
      const edgeBot = edgeTop.clone();
      edgeBot.position.y = 0;
      const edgeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.8, depth + 0.08), frameMat);
      edgeL.position.set(-width / 2, 1.4, 0);
      const edgeR = edgeL.clone();
      edgeR.position.x = width / 2;
      group.add(edgeTop, edgeBot, edgeL, edgeR);

      // Point light on locked door
      const doorLight = new THREE.PointLight(keyColor, 2.5, 5);
      doorLight.position.set(0, 1.5, -(depth / 2 + 0.4));
      group.add(doorLight);
    }

    group.position.set(x, 0, z);
    this.scene.add(group);

    const collider = { active: !startsOpen, aabb: makeAabb(x, z, width, depth), object: group };
    this.colliders.push(collider);
    group.visible = !startsOpen;
    return { key, mesh: group, collider, open: startsOpen, x, z };
  }

  /* ═══════════════════════════════════════════════════
     PICKUPS
     ═══════════════════════════════════════════════════ */
  addPickups() {
    this.pickups = [
      new Pickup(this.scene, "health", -6.4, 6.4, { amount: 30 }),
      new Pickup(this.scene, "armor", -12.3, 3.4, { amount: 35 }),
      new Pickup(this.scene, "ammo", -1.8, 6.4, { amount: 10 }),
      new Pickup(this.scene, "key", -12.7, 6.0, { key: "red" }),
      new Pickup(this.scene, "ammo", 11.0, -4.1, { amount: 14 }),
      new Pickup(this.scene, "health", 12.7, 1.0, { amount: 25 }),
      new Pickup(this.scene, "key", 13.0, -4.5, { key: "blue" }),
      new Pickup(this.scene, "armor", 5.2, -11.6, { amount: 40 }),
      new Pickup(this.scene, "ammo", 13.2, -11.0, { amount: 12 })
    ];
  }

  tryInteract(player, ui, audio) {
    for (const door of this.doors) {
      if (door.open) continue;
      const expanded = {
        minX: door.collider.aabb.minX - 1,
        maxX: door.collider.aabb.maxX + 1,
        minZ: door.collider.aabb.minZ - 1,
        maxZ: door.collider.aabb.maxZ + 1
      };
      if (!pointInAabb(player.position.x, player.position.z, expanded)) continue;
      if (door.key && !player.keys[door.key]) {
        ui.showMessage(`${door.key.toUpperCase()} key required.`, `${door.key.toUpperCase()} KEY REQUIRED`);
        audio.door(false);
        return false;
      }
      this.openDoor(door);
      ui.showMessage("Door opened.", "DOOR OPENED");
      audio.door(true);
      return true;
    }
    return false;
  }

  openDoor(door) {
    door.open = true;
    door.collider.active = false;
    door.mesh.visible = false;
  }

  getActiveColliderMeshes() {
    return this.colliders
      .filter((collider) => collider.active && collider.object?.visible !== false)
      .map((collider) => collider.object)
      .filter(Boolean);
  }

  hasLineOfSight(from, to, clearance = 0.2) {
    const direction = new THREE.Vector3().subVectors(to, from);
    const distance = direction.length();
    if (distance <= 0.001) return true;
    direction.normalize();
    const raycaster = new THREE.Raycaster(from, direction, 0, Math.max(0, distance - clearance));
    return raycaster.intersectObjects(this.getActiveColliderMeshes(), true).length === 0;
  }
}
