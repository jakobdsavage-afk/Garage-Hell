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

  /* ─── LIGHTING ─── */
  addLighting() {
    // Warmer, more atmospheric hemisphere light
    const ambient = new THREE.HemisphereLight(0xc4a882, 0x1a0d08, 1.45);
    this.scene.add(ambient);
    this.decor.push(ambient);

    // Main overhead fluorescent banks — harsh white-green like real shop lights
    const fluorescent1 = new THREE.PointLight(0xe8f0d8, 5.5, 18);
    fluorescent1.position.set(-2, 4.2, 1.5);
    const fluorescent2 = new THREE.PointLight(0xe8f0d8, 4.8, 16);
    fluorescent2.position.set(4, 4.2, -2);
    const fluorescent3 = new THREE.PointLight(0xe8f0d8, 3.5, 14);
    fluorescent3.position.set(-5, 4.0, 5);

    // Danger accent — deep red from the cursed pit area
    const hellGlow = new THREE.PointLight(0xff2200, 6.5, 12);
    hellGlow.position.set(-1.7, 0.4, 4.9);

    // Secondary hell glow from back alley pit
    const hellGlow2 = new THREE.PointLight(0xff3300, 4.0, 10);
    hellGlow2.position.set(1.2, 0.3, -9.6);

    // Cool blue office accent
    const officeCool = new THREE.PointLight(0x4488cc, 3.2, 10);
    officeCool.position.set(-11, 3.0, 4);

    // Warm work lamp over parts room
    const partsWarm = new THREE.PointLight(0xffaa55, 3.8, 12);
    partsWarm.position.set(11.5, 3.5, -1.5);

    // Fill light for back alley
    const alleyFill = new THREE.PointLight(0x6688aa, 2.2, 14);
    alleyFill.position.set(6, 3.0, -10);

    // Directional key light for overall readability
    const keyLight = new THREE.DirectionalLight(0xffeedd, 0.85);
    keyLight.position.set(-3, 8, 5);

    this.scene.add(fluorescent1, fluorescent2, fluorescent3, hellGlow, hellGlow2, officeCool, partsWarm, alleyFill, keyLight);
    this.decor.push(fluorescent1, fluorescent2, fluorescent3, hellGlow, hellGlow2, officeCool, partsWarm, alleyFill, keyLight);
  }

  /* ─── FLOORS ─── */
  addFloors() {
    // Main garage — stained concrete
    this.addFloorSlab(0, 1, 16, 14, 0x3a3835, 0x1a1816);
    // Office
    this.addFloorSlab(-11, 4, 6, 6, 0x2a3038, 0x0d1118);
    // Parts room
    this.addFloorSlab(11, -1.5, 6, 7, 0x302c2a, 0x120f0d);
    // Back alley
    this.addFloorSlab(6, -9.5, 18, 7, 0x1e2228, 0x080a0e);
  }

  addFloorSlab(x, z, width, depth, color, emissiveColor) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.82,
      metalness: 0.05,
      emissive: emissiveColor,
      emissiveIntensity: 0.12
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, depth), mat);
    floor.position.set(x, -0.1, z);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.decor.push(floor);

    // Subtle floor line markings instead of full grid
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.18 });
    for (let i = -Math.floor(width / 4); i <= Math.floor(width / 4); i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, depth * 0.9), lineMat);
      line.position.set(x + i * 2, 0.005, z);
      this.scene.add(line);
      this.decor.push(line);
    }
  }

  /* ─── CEILING ─── */
  addCeiling() {
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95,
      metalness: 0.0,
      emissive: 0x050505,
      emissiveIntensity: 0.1
    });
    // Main garage ceiling
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.15, 14.5), ceilMat);
    ceil.position.set(0, 3.8, 1);
    this.scene.add(ceil);
    this.decor.push(ceil);

    // Fluorescent light fixture meshes (visible geometry for the lights)
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0xddddcc, emissive: 0xeeffdd, emissiveIntensity: 2.2, roughness: 0.2 });
    const fixtures = [[-2, 1.5], [4, -2], [-5, 5]];
    for (const [fx, fz] of fixtures) {
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.35), fixtureMat);
      fixture.position.set(fx, 3.7, fz);
      this.scene.add(fixture);
      this.decor.push(fixture);
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

  /* ─── PERIMETER WALLS ─── */
  addPerimeter() {
    const wall = 0x3d3632;
    const wallOpts = { roughness: 0.88, metalness: 0.02 };
    // Main room walls
    this.addBox(0, 1.5, 8.25, 16.5, 3, 0.5, wall, true, 0x0a0806, wallOpts);
    this.addBox(-8.25, 1.5, -2.5, 0.5, 3, 7.2, wall, true, 0x0a0806, wallOpts);
    this.addBox(-8.25, 1.5, 6.5, 0.5, 3, 3.5, wall, true, 0x0a0806, wallOpts);
    this.addBox(8.25, 1.5, 4.8, 0.5, 3, 6.8, wall, true, 0x0a0806, wallOpts);
    this.addBox(8.25, 1.5, -5.1, 0.5, 3, 1.8, wall, true, 0x0a0806, wallOpts);
    this.addBox(-5.6, 1.5, -6.25, 5.2, 3, 0.5, wall, true, 0x0a0806, wallOpts);
    this.addBox(6.8, 1.5, -6.25, 2.8, 3, 0.5, wall, true, 0x0a0806, wallOpts);

    // Office walls
    this.addBox(-14.25, 1.5, 4, 0.5, 3, 6.5, 0x2e3540, true, 0x060810, wallOpts);
    this.addBox(-11, 1.5, 0.75, 6.5, 3, 0.5, 0x2e3540, true, 0x060810, wallOpts);
    this.addBox(-11, 1.5, 7.25, 6.5, 3, 0.5, 0x2e3540, true, 0x060810, wallOpts);
    this.addBox(-8.25, 1.5, 1.8, 0.5, 3, 2.1, 0x2e3540, true, 0x060810, wallOpts);
    this.addBox(-8.25, 1.5, 6.5, 0.5, 3, 1.5, 0x2e3540, true, 0x060810, wallOpts);

    // Parts room walls
    this.addBox(14.25, 1.5, -1.5, 0.5, 3, 7.5, 0x38302c, true, 0x0a0806, wallOpts);
    this.addBox(11, 1.5, 2.25, 6.5, 3, 0.5, 0x38302c, true, 0x0a0806, wallOpts);
    this.addBox(11, 1.5, -5.25, 6.5, 3, 0.5, 0x38302c, true, 0x0a0806, wallOpts);
    this.addBox(8.25, 1.5, 0.75, 0.5, 3, 3, 0x38302c, true, 0x0a0806, wallOpts);
    this.addBox(8.25, 1.5, -4.0, 0.5, 3, 2.3, 0x38302c, true, 0x0a0806, wallOpts);

    // Back alley walls
    this.addBox(-3.25, 1.5, -9.5, 0.5, 3, 7.5, 0x252830, true, 0x040508, wallOpts);
    this.addBox(15.25, 1.5, -9.5, 0.5, 3, 7.5, 0x252830, true, 0x040508, wallOpts);
    this.addBox(6, 1.5, -13.25, 18.5, 3, 0.5, 0x252830, true, 0x040508, wallOpts);
    this.addBox(11.2, 1.5, -6.25, 8.6, 3, 0.5, 0x252830, true, 0x040508, wallOpts);
  }

  /* ─── GARAGE DRESSING ─── */
  addGarageDressing() {
    // Service bay oil pits (recessed dark with glowing edges)
    this.addOilPit(-3.7, 1.2, 2.2, 4.2);
    this.addOilPit(3.9, 1.1, 2.2, 4.2);

    // Car lifts — red steel columns
    const liftColor = 0xaa2222;
    const liftOpts = { roughness: 0.45, metalness: 0.35 };
    // Left bay lift posts
    this.addBox(-4.9, 1.05, 1.2, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    this.addBox(-4.9, 1.05, -0.5, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    this.addBox(-4.9, 1.05, 2.9, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    this.addBox(-2.5, 1.05, 1.2, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    this.addBox(-2.5, 1.05, -0.5, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    this.addBox(-2.5, 1.05, 2.9, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    // Left bay cross arms
    this.addBox(-3.7, 2.1, 1.2, 2.6, 0.12, 0.12, liftColor, false, 0x220505, liftOpts);
    this.addBox(-3.7, 2.1, -0.5, 2.6, 0.12, 0.12, liftColor, false, 0x220505, liftOpts);
    this.addBox(-3.7, 2.1, 2.9, 2.6, 0.12, 0.12, liftColor, false, 0x220505, liftOpts);

    // Right bay lift posts
    this.addBox(2.7, 1.05, 1.1, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    this.addBox(2.7, 1.05, -0.6, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    this.addBox(2.7, 1.05, 2.8, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    this.addBox(5.1, 1.05, 1.1, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    this.addBox(5.1, 1.05, -0.6, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    this.addBox(5.1, 1.05, 2.8, 0.2, 2.1, 0.2, liftColor, true, 0x330808, liftOpts);
    // Right bay cross arms
    this.addBox(3.9, 2.1, 1.1, 2.6, 0.12, 0.12, liftColor, false, 0x220505, liftOpts);
    this.addBox(3.9, 2.1, -0.6, 2.6, 0.12, 0.12, liftColor, false, 0x220505, liftOpts);
    this.addBox(3.9, 2.1, 2.8, 2.6, 0.12, 0.12, liftColor, false, 0x220505, liftOpts);

    // Toolboxes — red and blue, chunky
    this.addBox(-6.2, 0.55, 6.1, 1.1, 1.1, 0.6, 0xcc2020, true, 0x220000, { roughness: 0.4, metalness: 0.3 });
    this.addBox(6.4, 0.55, 6.0, 1.0, 1.1, 0.6, 0x1855aa, true, 0x000822, { roughness: 0.4, metalness: 0.3 });

    // Tire stacks
    this.addTireStack(-7.2, -4.5, 3);
    this.addTireStack(7.4, 6.8, 2);

    // Oil drums
    this.addOilDrum(-0.8, -4.3);
    this.addOilDrum(0.5, -4.3);
    this.addOilDrum(1.8, -4.3);

    // Oil spill puddles (flat glowing)
    this.addBox(-1.7, 0.02, 4.9, 2.4, 0.02, 1.3, 0x0a0a0a, false, 0xff2200, { emissiveIntensity: 0.8 });
    this.addBox(4.8, 0.02, -2.8, 2.8, 0.02, 1.0, 0x0a0a0a, false, 0xff2200, { emissiveIntensity: 0.6 });

    // Overhead fluorescent bar accents (visual markers for navigation)
    for (const x of [-5.7, -2.1, 2.4, 5.8]) {
      const light = this.addBox(x, 2.85, -1.3, 1.4, 0.06, 0.15, 0xeeeedd, false, 0xffeeaa, { emissiveIntensity: 1.8 });
      light.rotation.x = 0.04;
    }

    // Floor safety lines — yellow hazard stripes
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xddaa00, transparent: true, opacity: 0.45 });
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

    // Main sign
    const sign = makeTextSprite("HELL BENT AUTO REPAIR", { scaleX: 4.8, scaleY: 1.05, fontSize: 38, background: "rgba(12, 4, 2, 0.92)", border: "rgba(255, 80, 20, 0.85)" });
    sign.position.set(0, 2.5, 7.9);
    this.scene.add(sign);
    this.decor.push(sign);

    // Workbench near back wall
    this.addBox(5.5, 0.48, 7.2, 3.0, 0.96, 0.8, 0x4a3828, true, 0x000000, { roughness: 0.85 });
    // Vise on workbench
    this.addBox(5.5, 1.05, 7.1, 0.3, 0.35, 0.3, 0x555555, false, 0x000000, { roughness: 0.4, metalness: 0.6 });
  }

  addOilPit(x, z, width, depth) {
    // Dark recessed pit
    const pitMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95, metalness: 0.0, emissive: 0x050000, emissiveIntensity: 0.15 });
    const pit = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, depth), pitMat);
    pit.position.set(x, -0.15, z);
    this.scene.add(pit);
    this.decor.push(pit);

    // Glowing edge rails (safety rails around pit)
    const railMat = new THREE.MeshStandardMaterial({ color: 0xddaa00, roughness: 0.5, metalness: 0.3, emissive: 0x886600, emissiveIntensity: 0.4 });
    const railW = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.06, 0.06), railMat);
    railW.position.set(x, 0.03, z - depth / 2);
    const railE = railW.clone();
    railE.position.z = z + depth / 2;
    const railN = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, depth + 0.1), railMat);
    railN.position.set(x - width / 2, 0.03, z);
    const railS = railN.clone();
    railS.position.x = x + width / 2;
    this.scene.add(railW, railE, railN, railS);
    this.decor.push(railW, railE, railN, railS);
  }

  addTireStack(x, z, count) {
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.92, metalness: 0.0 });
    for (let i = 0; i < count; i++) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.14, 8, 16), tireMat);
      tire.position.set(x, 0.32 + i * 0.3, z);
      tire.rotation.x = Math.PI / 2;
      tire.rotation.z = i * 0.4;
      this.scene.add(tire);
      this.decor.push(tire);
    }
    // Collider for the stack
    this.colliders.push({ active: true, aabb: makeAabb(x, z, 0.7, 0.7), object: null });
  }

  addOilDrum(x, z) {
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x2a3540, roughness: 0.6, metalness: 0.25 });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.0, 12), drumMat);
    drum.position.set(x, 0.5, z);
    drum.castShadow = true;
    this.scene.add(drum);
    this.decor.push(drum);
    this.colliders.push({ active: true, aabb: makeAabb(x, z, 0.7, 0.7), object: drum });

    // Hazard band
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xcc8800, roughness: 0.5, emissive: 0x442200, emissiveIntensity: 0.3 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.12, 12), bandMat);
    band.position.set(x, 0.7, z);
    this.scene.add(band);
    this.decor.push(band);
  }

  /* ─── OFFICE ─── */
  addOffice() {
    // Desk
    this.addBox(-12.2, 0.48, 2.1, 2.2, 0.96, 0.9, 0x5a3824, true, 0x000000, { roughness: 0.82 });
    // Filing cabinet
    this.addBox(-13.0, 0.75, 5.9, 0.9, 1.5, 0.55, 0x4a4a4a, true, 0x000000, { roughness: 0.5, metalness: 0.4 });
    // Monitor on desk
    this.addBox(-12.2, 1.15, 2.0, 0.7, 0.5, 0.05, 0x111111, false, 0x224488, { emissiveIntensity: 0.6 });

    // Office sign
    const sign = makeTextSprite("OFFICE", { scaleX: 1.8, scaleY: 0.58, fontSize: 54, background: "rgba(20, 30, 50, 0.92)", border: "rgba(80, 140, 220, 0.8)" });
    sign.position.set(-8.35, 2.25, 4.2);
    sign.rotation.y = Math.PI / 2;
    this.scene.add(sign);
    this.decor.push(sign);

    // Desk lamp glow
    const deskLight = new THREE.PointLight(0xffcc88, 1.5, 5);
    deskLight.position.set(-12.2, 1.6, 2.1);
    this.scene.add(deskLight);
    this.decor.push(deskLight);
  }

  /* ─── PARTS ROOM ─── */
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

    // Parts room sign
    const sign = makeTextSprite("PARTS", { scaleX: 1.6, scaleY: 0.55, fontSize: 52, background: "rgba(40, 25, 10, 0.9)", border: "rgba(200, 140, 50, 0.8)" });
    sign.position.set(8.35, 2.25, -1.5);
    sign.rotation.y = -Math.PI / 2;
    this.scene.add(sign);
    this.decor.push(sign);
  }

  /* ─── BACK ALLEY ─── */
  addBackAlley() {
    // Large cursed oil pit
    this.addBox(1.2, -0.05, -9.6, 3.8, 0.1, 1.8, 0x050505, false, 0xff1100, { emissiveIntensity: 1.0 });
    // Crate
    this.addBox(10.5, 0.42, -11.8, 1.0, 0.84, 1.0, 0x2a2e34, true, 0x000000, { roughness: 0.8 });
    // Oil drum
    this.addOilDrum(12.4, -9.4);
    // Exit sign glow
    this.addBox(5.7, 2.5, -12.9, 2.2, 0.5, 0.1, 0x111111, false, 0xff2200, { emissiveIntensity: 1.5 });

    // "NO EXIT" sign
    const sign = makeTextSprite("NO EXIT", { scaleX: 2.0, scaleY: 0.55, fontSize: 48, background: "rgba(30, 5, 5, 0.92)", border: "rgba(255, 40, 20, 0.85)" });
    sign.position.set(6, 2.5, -12.8);
    this.scene.add(sign);
    this.decor.push(sign);
  }

  /* ─── DOORS ─── */
  addDoors() {
    const redDoor = this.createDoor("red", 8.25, -2.25, 0.32, 2.55, 0xaa1515);
    this.doors.push(redDoor);
    const alleyDoor = this.createDoor(null, 1.0, -6.25, 3.8, 0.32, 0x3a3e44, true);
    this.doors.push(alleyDoor);
  }

  createDoor(key, x, z, width, depth, color, startsOpen = false) {
    const group = new THREE.Group();

    // Door body
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.3,
      emissive: key === "red" ? 0x440000 : 0x000000,
      emissiveIntensity: key ? 0.4 : 0.0
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, 2.5, depth), bodyMat);
    body.position.y = 1.25;
    group.add(body);

    // If keyed door, add visual lock indicator and pulsing frame
    if (key) {
      const frameMat = new THREE.MeshStandardMaterial({
        color: key === "red" ? 0xff2020 : key === "blue" ? 0x2080ff : 0xffcc00,
        emissive: key === "red" ? 0xff0000 : key === "blue" ? 0x0044ff : 0xffaa00,
        emissiveIntensity: 1.2,
        roughness: 0.3,
        metalness: 0.5
      });
      // Lock symbol (torus on door face)
      const lock = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 16), frameMat);
      lock.position.set(0, 1.4, -(depth / 2 + 0.02));
      lock.rotation.x = 0;
      group.add(lock);

      // Glowing frame edges
      const edgeTop = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.06, depth + 0.06), frameMat);
      edgeTop.position.y = 2.5;
      const edgeBot = edgeTop.clone();
      edgeBot.position.y = 0;
      group.add(edgeTop, edgeBot);

      // Point light on locked door
      const doorLight = new THREE.PointLight(
        key === "red" ? 0xff2200 : key === "blue" ? 0x2266ff : 0xffcc00,
        2.0, 4
      );
      doorLight.position.set(0, 1.5, -(depth / 2 + 0.3));
      group.add(doorLight);
    }

    group.position.set(x, 0, z);
    this.scene.add(group);

    const collider = { active: !startsOpen, aabb: makeAabb(x, z, width, depth), object: group };
    this.colliders.push(collider);
    group.visible = !startsOpen;
    return { key, mesh: group, collider, open: startsOpen, x, z };
  }

  /* ─── PICKUPS ─── */
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
