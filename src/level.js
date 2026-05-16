import * as THREE from "three";
import { makeAabb, pointInAabb } from "./utils.js";
import { Pickup } from "./pickups.js";
import {
  concreteFloorMaterial,
  cinderBlockMaterial,
  corrugatedMetalMaterial,
  paintedMetalMaterial,
  woodMaterial,
  createEnvMap
} from "./textures.js";

export class Level {
  constructor(scene, viewport) {
    this.scene = scene;
    this.viewport = viewport;
    this.colliders = [];
    this.doors = [];
    this.pickups = [];
    this.enemySpawns = [];
    this.decor = [];
    this.envMap = createEnvMap();
    this.materials = {};
    this.buildMaterials();
    this.build();
  }

  clear() {
    for (const o of this.decor) this.scene.remove(o);
    for (const d of this.doors) this.scene.remove(d.mesh);
    for (const p of this.pickups) this.scene.remove(p.mesh);
    this.colliders = [];
    this.doors = [];
    this.pickups = [];
    this.enemySpawns = [];
    this.decor = [];
  }

  rebuild() { this.clear(); this.build(); }

  buildMaterials() {
    this.materials.wetFloor = concreteFloorMaterial({ wet: true, baseColor: "#2a2420", repeat: [4, 4] });
    this.materials.wetFloor.envMap = this.envMap;
    this.materials.dryFloor = concreteFloorMaterial({ wet: false, baseColor: "#302a24", repeat: [3, 3] });
    this.materials.darkFloor = concreteFloorMaterial({ wet: true, baseColor: "#181418", repeat: [4, 4] });
    this.materials.darkFloor.envMap = this.envMap;

    this.materials.wallMain = cinderBlockMaterial({ hue: 25, repeat: [3, 2] });
    this.materials.wallOffice = cinderBlockMaterial({ hue: 210, repeat: [2, 2] });
    this.materials.wallParts = cinderBlockMaterial({ hue: 30, repeat: [2, 2] });
    this.materials.wallAlley = cinderBlockMaterial({ hue: 220, mortarColor: "#1e1c22", repeat: [4, 2] });

    this.materials.ceiling = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.95, metalness: 0.0 });
    this.materials.beam = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7, metalness: 0.15 });
    this.materials.pipe = new THREE.MeshStandardMaterial({ color: 0x444440, roughness: 0.45, metalness: 0.4 });

    this.materials.liftPost = paintedMetalMaterial({ hue: 0, sat: 65, light: 28, roughness: 0.4, metalness: 0.4, emissive: 0x220505, emissiveIntensity: 0.1 });
    this.materials.carBody = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.3, metalness: 0.55, envMap: this.envMap, envMapIntensity: 0.8 });
    this.materials.carHood = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.35, metalness: 0.5, envMap: this.envMap, envMapIntensity: 0.6 });
    this.materials.tire = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.92, metalness: 0.0 });
    this.materials.wheel = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.6 });

    this.materials.toolboxRed = paintedMetalMaterial({ hue: 0, sat: 70, light: 32, roughness: 0.35, metalness: 0.35, emissive: 0x220000, emissiveIntensity: 0.08 });
    this.materials.toolboxBlue = paintedMetalMaterial({ hue: 215, sat: 55, light: 28, roughness: 0.35, metalness: 0.35, emissive: 0x000822, emissiveIntensity: 0.08 });
    this.materials.chrome = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.15, metalness: 0.85, envMap: this.envMap, envMapIntensity: 1.0 });
    this.materials.darkTop = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.2 });

    this.materials.drum = corrugatedMetalMaterial({ baseColor: "#2a3540" });
    this.materials.drumBand = paintedMetalMaterial({ hue: 35, sat: 70, light: 35, roughness: 0.4, metalness: 0.3 });
    this.materials.drumLid = new THREE.MeshStandardMaterial({ color: 0x333840, roughness: 0.35, metalness: 0.45 });

    this.materials.hazard = new THREE.MeshStandardMaterial({ color: 0xddaa00, emissive: 0x665500, emissiveIntensity: 0.25, roughness: 0.55, metalness: 0.1 });
    this.materials.cautionSign = new THREE.MeshStandardMaterial({ color: 0xddcc00, roughness: 0.45, metalness: 0.1, emissive: 0x665500, emissiveIntensity: 0.2 });
    this.materials.cautionText = new THREE.MeshBasicMaterial({ color: 0x111111 });

    this.materials.oilPuddle = new THREE.MeshStandardMaterial({
      color: 0x060404, roughness: 0.02, metalness: 0.85,
      emissive: 0xff1100, emissiveIntensity: 0.1,
      transparent: true, opacity: 0.75, depthWrite: false,
      envMap: this.envMap, envMapIntensity: 2.0
    });

    this.materials.pitDark = new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.95, metalness: 0.0, emissive: 0x060000, emissiveIntensity: 0.15 });
    this.materials.pitGlow = new THREE.MeshStandardMaterial({
      color: 0x0a0000, emissive: 0xff1100, emissiveIntensity: 1.2,
      roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.7
    });
    this.materials.railYellow = new THREE.MeshStandardMaterial({ color: 0xddaa00, roughness: 0.45, metalness: 0.25, emissive: 0x886600, emissiveIntensity: 0.3 });

    this.materials.desk = woodMaterial({ baseColor: "#4a3020" });
    this.materials.crate = woodMaterial({ baseColor: "#5a4228", roughness: 0.88 });
    this.materials.shelf = new THREE.MeshStandardMaterial({ color: 0x444440, roughness: 0.55, metalness: 0.4 });
    this.materials.cabinet = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.4 });
    this.materials.monitor = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x224488, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.2 });
    this.materials.chair = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.1 });

    this.materials.neonBack = new THREE.MeshStandardMaterial({ color: 0x080404, roughness: 0.9, metalness: 0.0 });

    this.materials.fixtureGlow = new THREE.MeshStandardMaterial({ color: 0xeeffee, emissive: 0xccffcc, emissiveIntensity: 3.0, roughness: 0.1 });
    this.materials.fixtureHousing = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.3 });

    this.materials.baseboard = new THREE.MeshStandardMaterial({ color: 0x121010, roughness: 0.95, metalness: 0.0 });

    this.materials.platform = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.65, metalness: 0.2 });
    this.materials.vise = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.35, metalness: 0.6 });
    this.materials.tool = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.3, metalness: 0.7 });
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
      { x: -6.4, z: -3.6 }, { x: 6.1, z: -4.0 }, { x: 6.8, z: -0.5 },
      { x: -1.8, z: -5.0 }, { x: -12.2, z: 5.8 }, { x: 10.7, z: 0.6 },
      { x: 12.7, z: -4.0 }, { x: 1.2, z: -10.2 }, { x: 7.8, z: -11.2 },
      { x: 13.8, z: -8.2 }
    ];
  }

  add(obj) { this.scene.add(obj); this.decor.push(obj); return obj; }

  mesh(geo, mat) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  /* ═══ LIGHTING ═══ */
  addLighting() {
    const hemi = new THREE.HemisphereLight(0x7a6050, 0x080506, 0.5);
    this.add(hemi);

    const dir = new THREE.DirectionalLight(0xffeedd, 0.3);
    dir.position.set(-3, 8, 5);
    this.add(dir);

    // Fluorescents
    const fluoros = [[-2, 4, 1.5, 3.5, 14], [4, 4, -2, 3.0, 12], [-5, 3.8, 5, 2.5, 10], [6, 3.8, -10, 2.2, 10]];
    for (const [x, y, z, int, dist] of fluoros) {
      const l = new THREE.PointLight(0xd4e8c8, int, dist);
      l.position.set(x, y, z);
      this.add(l);
    }

    // HELL BENT neon — strong red
    const neon1 = new THREE.PointLight(0xff2200, 8, 16); neon1.position.set(0, 3, 7);
    const neon2 = new THREE.PointLight(0xff3311, 3.5, 10); neon2.position.set(0, 0.5, 6);
    this.add(neon1); this.add(neon2);

    // OFFICE neon
    const oNeon = new THREE.PointLight(0xff3322, 4, 8); oNeon.position.set(-8.3, 2.8, 4.2);
    const oCool = new THREE.PointLight(0x3366aa, 2, 8); oCool.position.set(-11, 3, 4);
    this.add(oNeon); this.add(oCool);

    // Parts warm
    const pWarm = new THREE.PointLight(0xffaa55, 2.5, 10); pWarm.position.set(11.5, 3.5, -1.5);
    this.add(pWarm);

    // Hell glow from pits
    const hg1 = new THREE.PointLight(0xff1100, 5, 8); hg1.position.set(-1.7, 0.3, 4.9);
    const hg2 = new THREE.PointLight(0xff2200, 3.5, 8); hg2.position.set(1.2, 0.3, -9.6);
    this.add(hg1); this.add(hg2);

    // Alley fill
    const af = new THREE.PointLight(0x445566, 1.5, 12); af.position.set(6, 3, -10);
    this.add(af);
  }

  /* ═══ FLOORS ═══ */
  addFloors() {
    // Main garage — wet
    const mainFloor = this.mesh(new THREE.BoxGeometry(16.5, 0.18, 14.5), this.materials.wetFloor);
    mainFloor.position.set(0, -0.1, 1);
    this.add(mainFloor);

    // Office
    const offFloor = this.mesh(new THREE.BoxGeometry(6, 0.18, 6.5), this.materials.dryFloor);
    offFloor.position.set(-11, -0.1, 4);
    this.add(offFloor);

    // Parts
    const partsFloor = this.mesh(new THREE.BoxGeometry(6, 0.18, 7.5), this.materials.dryFloor);
    partsFloor.position.set(11, -0.1, -1.5);
    this.add(partsFloor);

    // Alley — darkest, wettest
    const alleyFloor = this.mesh(new THREE.BoxGeometry(18.5, 0.18, 7.5), this.materials.darkFloor);
    alleyFloor.position.set(6, -0.1, -9.5);
    this.add(alleyFloor);

    // Large reflective oil puddles
    this.addOilPuddle(-1.7, 4.9, 2.8, 1.5);
    this.addOilPuddle(4.8, -2.8, 3.0, 1.2);
    this.addOilPuddle(2.0, -9.0, 3.5, 1.8);
    this.addOilPuddle(-5.5, 0.5, 2.0, 1.0);
    this.addOilPuddle(6.5, 3.0, 1.5, 1.5);
  }

  addOilPuddle(x, z, w, d) {
    const r = Math.max(w, d) / 2;
    const p = this.mesh(new THREE.CircleGeometry(r, 20), this.materials.oilPuddle);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, 0.008, z);
    p.scale.set(w / (r * 2) * 1.0, 1, d / (r * 2) * 1.0);
    this.add(p);
  }

  /* ═══ CEILING ═══ */
  addCeiling() {
    const c = this.mesh(new THREE.BoxGeometry(16.5, 0.15, 14.5), this.materials.ceiling);
    c.position.set(0, 4.2, 1);
    this.add(c);

    // Beams
    for (let bx = -6; bx <= 6; bx += 4) {
      const b = this.mesh(new THREE.BoxGeometry(0.22, 0.4, 14), this.materials.beam);
      b.position.set(bx, 3.95, 1);
      this.add(b);
    }
    for (let bz = -4; bz <= 7; bz += 5.5) {
      const b = this.mesh(new THREE.BoxGeometry(16, 0.22, 0.18), this.materials.beam);
      b.position.set(0, 3.85, bz);
      this.add(b);
    }

    // Fluorescent fixtures
    const fixPos = [[-2, 1.5], [4, -2], [-5, 5], [6, -10]];
    for (const [fx, fz] of fixPos) {
      const h = this.mesh(new THREE.BoxGeometry(1.6, 0.08, 0.3), this.materials.fixtureHousing);
      h.position.set(fx, 3.75, fz);
      this.add(h);
      const t = this.mesh(new THREE.BoxGeometry(1.4, 0.04, 0.08), this.materials.fixtureGlow);
      t.position.set(fx, 3.7, fz);
      this.add(t);
    }

    // Pipes
    const p1 = this.mesh(new THREE.CylinderGeometry(0.04, 0.04, 15, 6), this.materials.pipe);
    p1.rotation.z = Math.PI / 2; p1.position.set(0, 3.2, 7.95);
    this.add(p1);
    const p2 = this.mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6), this.materials.pipe);
    p2.position.set(-7.95, 1.8, 0);
    this.add(p2);
    const p3 = this.mesh(new THREE.CylinderGeometry(0.035, 0.035, 12, 6), this.materials.pipe);
    p3.rotation.z = Math.PI / 2; p3.position.set(0, 3.5, -2);
    this.add(p3);
  }

  /* ═══ PERIMETER ═══ */
  addPerimeter() {
    const m = this.materials.wallMain;
    const o = this.materials.wallOffice;
    const p = this.materials.wallParts;
    const a = this.materials.wallAlley;

    // Main room
    this.addWall(0, 1.8, 8.25, 16.5, 3.6, 0.5, m);
    this.addWall(-8.25, 1.8, -2.5, 0.5, 3.6, 7.2, m);
    this.addWall(-8.25, 1.8, 6.5, 0.5, 3.6, 3.5, m);
    this.addWall(8.25, 1.8, 4.8, 0.5, 3.6, 6.8, m);
    this.addWall(8.25, 1.8, -5.1, 0.5, 3.6, 1.8, m);
    this.addWall(-5.6, 1.8, -6.25, 5.2, 3.6, 0.5, m);
    this.addWall(6.8, 1.8, -6.25, 2.8, 3.6, 0.5, m);

    // Office
    this.addWall(-14.25, 1.8, 4, 0.5, 3.6, 6.5, o);
    this.addWall(-11, 1.8, 0.75, 6.5, 3.6, 0.5, o);
    this.addWall(-11, 1.8, 7.25, 6.5, 3.6, 0.5, o);
    this.addWall(-8.25, 1.8, 1.8, 0.5, 3.6, 2.1, o);
    this.addWall(-8.25, 1.8, 6.5, 0.5, 3.6, 1.5, o);

    // Parts
    this.addWall(14.25, 1.8, -1.5, 0.5, 3.6, 7.5, p);
    this.addWall(11, 1.8, 2.25, 6.5, 3.6, 0.5, p);
    this.addWall(11, 1.8, -5.25, 6.5, 3.6, 0.5, p);
    this.addWall(8.25, 1.8, 0.75, 0.5, 3.6, 3, p);
    this.addWall(8.25, 1.8, -4.0, 0.5, 3.6, 2.3, p);

    // Alley
    this.addWall(-3.25, 1.8, -9.5, 0.5, 3.6, 7.5, a);
    this.addWall(15.25, 1.8, -9.5, 0.5, 3.6, 7.5, a);
    this.addWall(6, 1.8, -13.25, 18.5, 3.6, 0.5, a);
    this.addWall(11.2, 1.8, -6.25, 8.6, 3.6, 0.5, a);
  }

  addWall(x, y, z, w, h, d, mat) {
    const wall = this.mesh(new THREE.BoxGeometry(w, h, d), mat);
    wall.position.set(x, y, z);
    this.add(wall);
    this.colliders.push({ active: true, aabb: makeAabb(x, z, w, d), object: wall });

    // Baseboard
    const base = this.mesh(new THREE.BoxGeometry(w + 0.04, 0.25, d + 0.04), this.materials.baseboard);
    base.position.set(x, 0.125, z);
    this.add(base);
  }

  /* ═══ GARAGE DRESSING ═══ */
  addGarageDressing() {
    // Oil pits
    this.addOilPit(-3.7, 1.2, 2.2, 4.2);
    this.addOilPit(3.9, 1.1, 2.2, 4.2);

    // Cars on lifts
    this.addCarOnLift(-3.7, 1.2);
    this.addCarOnLift(3.9, 1.1);

    // Toolboxes
    this.addToolbox(-6.8, 6.2, this.materials.toolboxRed);
    this.addToolbox(6.8, 6.0, this.materials.toolboxBlue);

    // Tire stacks
    this.addTireStack(-7.2, -4.5, 3);
    this.addTireStack(7.4, 6.8, 2);
    this.addTireStack(-7.0, 2.0, 2);

    // Oil drums
    this.addOilDrum(-0.8, -4.3);
    this.addOilDrum(0.5, -4.3);
    this.addOilDrum(1.8, -4.3);
    this.addOilDrum(7.0, -4.8);

    // Wet floor signs
    this.addWetFloorSign(-1.0, 3.0);
    this.addWetFloorSign(5.0, -8.5);

    // Hazard stripes
    const hp = [[0, 5.25, 13.2, 0.12], [0, -5.35, 13.2, 0.12], [-7.1, 0, 0.12, 10.8], [7.1, 0, 0.12, 10.8]];
    for (const [hx, hz, hw, hd] of hp) {
      const s = this.mesh(new THREE.BoxGeometry(hw, 0.015, hd), this.materials.hazard);
      s.position.set(hx, 0.015, hz);
      this.add(s);
    }

    // Neon signs
    this.addNeonSign("HELL BENT", 0, 3.2, 7.85, 5.5, 0.9, 0xff2200, 48);
    this.addNeonSign("AUTO REPAIR", 0, 2.35, 7.85, 4.2, 0.6, 0xff3300, 32);

    // Wall poster
    this.addWallPoster(-7.9, 2.4, 5.5, "OIL CHANGES\nWE LUBE\nWE SLAY");

    // Workbench
    const bench = this.mesh(new THREE.BoxGeometry(3.0, 0.96, 0.8), this.materials.desk);
    bench.position.set(5.5, 0.48, 7.2);
    this.add(bench);
    this.colliders.push({ active: true, aabb: makeAabb(5.5, 7.2, 3.0, 0.8), object: bench });

    const vise = this.mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), this.materials.vise);
    vise.position.set(5.5, 1.05, 7.1);
    this.add(vise);
    const tool1 = this.mesh(new THREE.BoxGeometry(0.5, 0.08, 0.15), this.materials.tool);
    tool1.position.set(4.8, 1.0, 7.15);
    this.add(tool1);
    const tool2 = this.mesh(new THREE.BoxGeometry(0.35, 0.06, 0.1), this.materials.chrome);
    tool2.position.set(6.2, 1.0, 7.15);
    this.add(tool2);
  }

  addCarOnLift(cx, cz) {
    const posts = [[cx - 1, cz - 1.5], [cx - 1, cz + 1.5], [cx + 1, cz - 1.5], [cx + 1, cz + 1.5]];
    for (const [px, pz] of posts) {
      const post = this.mesh(new THREE.BoxGeometry(0.18, 2.4, 0.18), this.materials.liftPost);
      post.position.set(px, 1.2, pz);
      this.add(post);
      this.colliders.push({ active: true, aabb: makeAabb(px, pz, 0.18, 0.18), object: post });
    }
    // Cross arms
    const arm1 = this.mesh(new THREE.BoxGeometry(2.2, 0.1, 0.1), this.materials.liftPost);
    arm1.position.set(cx, 2.1, cz - 1.5);
    this.add(arm1);
    const arm2 = arm1.clone(); arm2.position.z = cz + 1.5;
    this.add(arm2);

    // Platform
    const plat = this.mesh(new THREE.BoxGeometry(2.4, 0.08, 3.4), this.materials.platform);
    plat.position.set(cx, 2.15, cz);
    this.add(plat);

    // Car body
    const body = this.mesh(new THREE.BoxGeometry(1.8, 0.7, 3.2), this.materials.carBody);
    body.position.set(cx, 2.6, cz);
    this.add(body);
    // Cabin
    const cabin = this.mesh(new THREE.BoxGeometry(1.5, 0.5, 1.6), this.materials.carBody);
    cabin.position.set(cx, 3.15, cz - 0.2);
    this.add(cabin);
    // Hood open
    const hood = this.mesh(new THREE.BoxGeometry(1.6, 0.05, 1.0), this.materials.carHood);
    hood.position.set(cx, 3.3, cz + 1.3);
    hood.rotation.x = -0.7;
    this.add(hood);
    // Wheels
    for (const [wx, wz] of [[cx - 0.85, cz - 1], [cx + 0.85, cz - 1], [cx - 0.85, cz + 1], [cx + 0.85, cz + 1]]) {
      const tire = this.mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.18, 12), this.materials.tire);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wx, 2.3, wz);
      this.add(tire);
      // Hub
      const hub = this.mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.19, 8), this.materials.wheel);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(wx, 2.3, wz);
      this.add(hub);
    }
    // Engine block visible under hood
    const engine = this.mesh(new THREE.BoxGeometry(1.0, 0.35, 0.8), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.3 }));
    engine.position.set(cx, 3.1, cz + 1.1);
    this.add(engine);
  }

  addToolbox(x, z, mat) {
    const body = this.mesh(new THREE.BoxGeometry(0.9, 1.2, 0.55), mat);
    body.position.set(x, 0.6, z);
    this.add(body);
    this.colliders.push({ active: true, aabb: makeAabb(x, z, 1.0, 0.65), object: body });

    const lineMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 });
    for (let i = 0; i < 5; i++) {
      const line = this.mesh(new THREE.BoxGeometry(0.82, 0.015, 0.56), lineMat);
      line.position.set(x, 0.2 + i * 0.22, z);
      this.add(line);
    }
    for (let i = 0; i < 5; i++) {
      const handle = this.mesh(new THREE.BoxGeometry(0.3, 0.03, 0.04), this.materials.chrome);
      handle.position.set(x, 0.3 + i * 0.22, z - 0.28);
      this.add(handle);
    }
    const top = this.mesh(new THREE.BoxGeometry(0.94, 0.04, 0.58), this.materials.darkTop);
    top.position.set(x, 1.22, z);
    this.add(top);
  }

  addOilPit(x, z, w, d) {
    const pit = this.mesh(new THREE.BoxGeometry(w, 0.35, d), this.materials.pitDark);
    pit.position.set(x, -0.18, z);
    this.add(pit);

    const hw = w / 2, hd = d / 2;
    const rails = [[x, 0.03, z - hd, w + 0.1, 0.06, 0.06], [x, 0.03, z + hd, w + 0.1, 0.06, 0.06],
      [x - hw, 0.03, z, 0.06, 0.06, d + 0.1], [x + hw, 0.03, z, 0.06, 0.06, d + 0.1]];
    for (const [rx, ry, rz, rw, rh, rd] of rails) {
      const rail = this.mesh(new THREE.BoxGeometry(rw, rh, rd), this.materials.railYellow);
      rail.position.set(rx, ry, rz);
      this.add(rail);
    }
  }

  addTireStack(x, z, count) {
    for (let i = 0; i < count; i++) {
      const tire = this.mesh(new THREE.TorusGeometry(0.32, 0.14, 10, 20), this.materials.tire);
      tire.position.set(x, 0.32 + i * 0.3, z);
      tire.rotation.x = Math.PI / 2;
      tire.rotation.z = i * 0.4;
      this.add(tire);
    }
    this.colliders.push({ active: true, aabb: makeAabb(x, z, 0.7, 0.7), object: null });
  }

  addOilDrum(x, z) {
    const drum = this.mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.0, 14), this.materials.drum);
    drum.position.set(x, 0.5, z);
    this.add(drum);
    this.colliders.push({ active: true, aabb: makeAabb(x, z, 0.7, 0.7), object: drum });

    const band = this.mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.12, 14), this.materials.drumBand);
    band.position.set(x, 0.7, z);
    this.add(band);

    const lid = this.mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 14), this.materials.drumLid);
    lid.position.set(x, 1.02, z);
    this.add(lid);
  }

  addWetFloorSign(x, z) {
    const p1 = this.mesh(new THREE.BoxGeometry(0.4, 0.6, 0.02), this.materials.cautionSign);
    p1.position.set(x, 0.35, z - 0.08); p1.rotation.x = 0.15;
    const p2 = this.mesh(new THREE.BoxGeometry(0.4, 0.6, 0.02), this.materials.cautionSign);
    p2.position.set(x, 0.35, z + 0.08); p2.rotation.x = -0.15;
    this.add(p1); this.add(p2);
    const txt = this.mesh(new THREE.BoxGeometry(0.3, 0.08, 0.025), this.materials.cautionText);
    txt.position.set(x, 0.4, z - 0.09); txt.rotation.x = 0.15;
    this.add(txt);
  }

  addNeonSign(text, x, y, z, scaleX, scaleY, color, fontSize) {
    const back = this.mesh(new THREE.BoxGeometry(scaleX + 0.4, scaleY + 0.15, 0.08), this.materials.neonBack);
    back.position.set(x, y, z);
    this.add(back);

    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 128);
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    ctx.shadowColor = hex; ctx.shadowBlur = 25;
    ctx.fillStyle = hex;
    ctx.font = `900 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 64);
    ctx.fillText(text, 256, 64);
    ctx.fillText(text, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(scaleX, scaleY, 1);
    sprite.position.set(x, y, z + 0.05);
    this.add(sprite);
  }

  addWallPoster(x, y, z, text) {
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#2a2218"; ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#ddccaa";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.textAlign = "center";
    text.split("\n").forEach((line, i) => ctx.fillText(line, 128, 80 + i * 50));

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.0, emissive: 0x111111, emissiveIntensity: 0.15 });
    const poster = this.mesh(new THREE.BoxGeometry(0.04, 1.2, 1.0), mat);
    poster.position.set(x, y, z);
    this.add(poster);
  }

  /* ═══ OFFICE ═══ */
  addOffice() {
    const desk = this.mesh(new THREE.BoxGeometry(2.2, 0.96, 0.9), this.materials.desk);
    desk.position.set(-12.2, 0.48, 2.1);
    this.add(desk);
    this.colliders.push({ active: true, aabb: makeAabb(-12.2, 2.1, 2.2, 0.9), object: desk });

    const cab = this.mesh(new THREE.BoxGeometry(0.9, 1.5, 0.55), this.materials.cabinet);
    cab.position.set(-13.0, 0.75, 5.9);
    this.add(cab);
    this.colliders.push({ active: true, aabb: makeAabb(-13.0, 5.9, 0.9, 0.55), object: cab });

    const mon = this.mesh(new THREE.BoxGeometry(0.7, 0.5, 0.05), this.materials.monitor);
    mon.position.set(-12.2, 1.15, 2.0);
    this.add(mon);

    const chair = this.mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), this.materials.chair);
    chair.position.set(-12.2, 0.35, 1.2);
    this.add(chair);

    this.addNeonSign("OFFICE", -8.0, 2.6, 4.2, 1.8, 0.55, 0xff3322, 52);

    const deskLight = new THREE.PointLight(0xffcc88, 1.5, 5);
    deskLight.position.set(-12.2, 1.6, 2.1);
    this.add(deskLight);
  }

  /* ═══ PARTS ROOM ═══ */
  addPartsRoom() {
    for (const z of [-4.0, -2.4, -0.8, 0.8]) {
      const s1 = this.mesh(new THREE.BoxGeometry(0.55, 1.7, 1.0), this.materials.shelf);
      s1.position.set(12.9, 0.85, z);
      this.add(s1);
      this.colliders.push({ active: true, aabb: makeAabb(12.9, z, 0.55, 1.0), object: s1 });
      const s2 = this.mesh(new THREE.BoxGeometry(0.55, 1.7, 1.0), this.materials.shelf);
      s2.position.set(10.0, 0.85, z);
      this.add(s2);
      this.colliders.push({ active: true, aabb: makeAabb(10.0, z, 0.55, 1.0), object: s2 });
    }
    const c1 = this.mesh(new THREE.BoxGeometry(1.1, 0.84, 0.9), this.materials.crate);
    c1.position.set(11.3, 0.42, -3.1);
    this.add(c1);
    this.colliders.push({ active: true, aabb: makeAabb(11.3, -3.1, 1.1, 0.9), object: c1 });
    const c2 = this.mesh(new THREE.BoxGeometry(0.9, 0.76, 0.9), this.materials.crate);
    c2.position.set(12.1, 0.38, 1.1);
    this.add(c2);
    this.colliders.push({ active: true, aabb: makeAabb(12.1, 1.1, 0.9, 0.9), object: c2 });

    this.addNeonSign("PARTS", 8.5, 2.6, -1.5, 1.6, 0.5, 0xffaa33, 50);
  }

  /* ═══ BACK ALLEY ═══ */
  addBackAlley() {
    this.addOilPuddle(1.2, -9.6, 3.8, 1.8);
    const glow = this.mesh(new THREE.BoxGeometry(3.8, 0.05, 1.8), this.materials.pitGlow);
    glow.position.set(1.2, 0.01, -9.6);
    this.add(glow);

    const crate = this.mesh(new THREE.BoxGeometry(1.0, 0.84, 1.0), this.materials.crate);
    crate.position.set(10.5, 0.42, -11.8);
    this.add(crate);
    this.colliders.push({ active: true, aabb: makeAabb(10.5, -11.8, 1.0, 1.0), object: crate });

    this.addOilDrum(12.4, -9.4);
    this.addOilDrum(14.0, -11.0);

    this.addNeonSign("NO EXIT", 6, 2.8, -12.85, 2.2, 0.55, 0xff2200, 46);
  }

  /* ═══ DOORS ═══ */
  addDoors() {
    this.doors.push(this.createDoor("red", 8.25, -2.25, 0.32, 2.55, 0xaa1515));
    this.doors.push(this.createDoor(null, 1.0, -6.25, 3.8, 0.32, 0x3a3e44, true));
  }

  createDoor(key, x, z, width, depth, color, startsOpen = false) {
    const group = new THREE.Group();

    const doorMat = paintedMetalMaterial({
      hue: key === "red" ? 0 : key === "blue" ? 215 : 210,
      sat: key ? 60 : 10,
      light: key ? 25 : 22,
      roughness: 0.5,
      metalness: 0.35,
      emissive: key === "red" ? 0x440000 : 0x000000,
      emissiveIntensity: key ? 0.3 : 0.0
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(width, 2.8, depth), doorMat);
    body.position.y = 1.4;
    body.castShadow = true;
    group.add(body);

    // Panel lines
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
    for (let i = 0; i < 4; i++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(width + 0.01, 0.02, depth + 0.01), panelMat);
      panel.position.y = 0.5 + i * 0.65;
      group.add(panel);
    }

    if (key) {
      const kc = key === "red" ? 0xff2020 : key === "blue" ? 0x2080ff : 0xffcc00;
      const ke = key === "red" ? 0xff0000 : key === "blue" ? 0x0044ff : 0xffaa00;
      const frameMat = new THREE.MeshStandardMaterial({ color: kc, emissive: ke, emissiveIntensity: 1.5, roughness: 0.25, metalness: 0.5 });

      const lock = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 16), frameMat);
      lock.position.set(0, 1.5, -(depth / 2 + 0.02));
      group.add(lock);

      const edgeTop = new THREE.Mesh(new THREE.BoxGeometry(width + 0.15, 0.08, depth + 0.08), frameMat);
      edgeTop.position.y = 2.8;
      const edgeBot = edgeTop.clone(); edgeBot.position.y = 0;
      const edgeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.8, depth + 0.08), frameMat);
      edgeL.position.set(-width / 2, 1.4, 0);
      const edgeR = edgeL.clone(); edgeR.position.x = width / 2;
      group.add(edgeTop, edgeBot, edgeL, edgeR);

      const doorLight = new THREE.PointLight(kc, 2.5, 5);
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

  /* ═══ PICKUPS ═══ */
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
      const expanded = { minX: door.collider.aabb.minX - 1, maxX: door.collider.aabb.maxX + 1, minZ: door.collider.aabb.minZ - 1, maxZ: door.collider.aabb.maxZ + 1 };
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

  openDoor(door) { door.open = true; door.collider.active = false; door.mesh.visible = false; }

  getActiveColliderMeshes() {
    return this.colliders.filter(c => c.active && c.object?.visible !== false).map(c => c.object).filter(Boolean);
  }

  hasLineOfSight(from, to, clearance = 0.2) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const dist = dir.length();
    if (dist <= 0.001) return true;
    dir.normalize();
    const rc = new THREE.Raycaster(from, dir, 0, Math.max(0, dist - clearance));
    return rc.intersectObjects(this.getActiveColliderMeshes(), true).length === 0;
  }
}
