import * as THREE from "three";
import { circleIntersectsAabb, resolveCollisions } from "./utils.js";
import { oilySkinMaterial } from "./textures.js";

/* ═══════════════════════════════════════════════════
   Oil Imp — large muscular demon with textured oily skin,
   glowing eyes, horns, claws. Uses procedural textures.
   ═══════════════════════════════════════════════════ */

// Shared materials (created once, reused for all imps)
let sharedMats = null;
function getSharedMaterials() {
  if (sharedMats) return sharedMats;
  sharedMats = {
    body: oilySkinMaterial({ baseColor: "#1a0e06", roughness: 0.22, metalness: 0.25, emissive: 0x0a0400, emissiveIntensity: 0.12 }),
    darkSkin: oilySkinMaterial({ baseColor: "#120a04", roughness: 0.28, metalness: 0.2, emissive: 0x060200, emissiveIntensity: 0.1 }),
    eye: new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff3300, emissiveIntensity: 8.0, roughness: 0.1 }),
    eyeGlow: new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.35, depthWrite: false }),
    core: new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff2200, emissiveIntensity: 5.0, roughness: 0.15 }),
    horn: oilySkinMaterial({ baseColor: "#3a2810", roughness: 0.4, metalness: 0.3, emissive: 0x1a0800, emissiveIntensity: 0.15 }),
    claw: new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 0.35, metalness: 0.35, emissive: 0x100600, emissiveIntensity: 0.15 }),
    puddle: new THREE.MeshStandardMaterial({ color: 0x060404, roughness: 0.02, metalness: 0.8, transparent: true, opacity: 0.5, depthWrite: false }),
    glow: new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.18, depthWrite: false })
  };
  return sharedMats;
}

export class OilImp {
  constructor(scene, x, z, level, onDeath) {
    this.scene = scene;
    this.level = level;
    this.onDeath = onDeath;
    this.position = new THREE.Vector3(x, 0, z);
    this.velocity = new THREE.Vector3();
    this.health = 70;
    this.maxHealth = 70;
    this.speed = 1.28 + Math.random() * 0.28;
    this.attackCooldown = Math.random() * 0.8;
    this.radius = 0.48;
    this.dead = false;
    this.buildMesh();
  }

  buildMesh() {
    const group = new THREE.Group();
    const M = getSharedMaterials();

    // Torso — large, hunched
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.8, 6, 12), M.body);
    torso.position.y = 0.85; torso.rotation.x = 0.2; torso.scale.set(1.15, 1.0, 0.95);
    torso.castShadow = true;

    // Belly
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), M.body);
    belly.position.set(0, 0.55, 0.05); belly.scale.set(1.1, 0.8, 0.9);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), M.darkSkin);
    head.position.y = 1.62; head.scale.set(1.2, 0.85, 1.05);
    head.castShadow = true;

    // Brow ridge
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.22), M.darkSkin);
    brow.position.set(0, 1.68, -0.18);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), M.eye);
    eyeL.position.set(-0.15, 1.6, -0.26);
    const eyeR = eyeL.clone(); eyeR.position.x = 0.15;

    // Eye glow halos
    const glowL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), M.eyeGlow);
    glowL.position.copy(eyeL.position);
    const glowR = glowL.clone(); glowR.position.x = 0.15;

    // Jaw
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.15), M.darkSkin);
    jaw.position.set(0, 1.48, -0.22);

    // Chest core
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), M.core);
    core.position.set(0, 1.0, -0.38);

    // Horns
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 6), M.horn);
    hornL.position.set(-0.22, 1.9, -0.05); hornL.rotation.z = 0.35; hornL.rotation.x = -0.2;
    const hornR = hornL.clone(); hornR.position.x = 0.22; hornR.rotation.z = -0.35;

    // Shoulders
    const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), M.body);
    shoulderL.position.set(-0.48, 1.2, -0.05);
    const shoulderR = shoulderL.clone(); shoulderR.position.x = 0.48;

    // Arms
    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.55, 5, 8), M.body);
    armL.position.set(-0.52, 0.85, -0.15); armL.rotation.z = 0.35; armL.rotation.x = -0.35;
    const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.55, 5, 8), M.body);
    armR.position.set(0.52, 0.85, -0.15); armR.rotation.z = -0.35; armR.rotation.x = -0.35;

    // Forearms
    const forearmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.4, 4, 6), M.darkSkin);
    forearmL.position.set(-0.62, 0.5, -0.3); forearmL.rotation.z = 0.15; forearmL.rotation.x = -0.5;
    const forearmR = forearmL.clone(); forearmR.position.x = 0.62; forearmR.rotation.z = -0.15;

    // Claws
    for (let i = -1; i <= 1; i++) {
      const clawL = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.15, 4), M.claw);
      clawL.position.set(-0.65 + i * 0.04, 0.28, -0.42); clawL.rotation.x = -0.8;
      group.add(clawL);
      const clawR = clawL.clone(); clawR.position.x = 0.65 + i * 0.04;
      group.add(clawR);
    }

    // Legs
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.4, 4, 6), M.body);
    legL.position.set(-0.18, 0.25, 0.05);
    const legR = legL.clone(); legR.position.x = 0.18;

    // Puddle
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), M.puddle);
    puddle.rotation.x = -Math.PI / 2; puddle.position.y = 0.01;

    // Glow ring
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.8, 20), M.glow);
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.02;

    // Threat light
    const threatLight = new THREE.PointLight(0xff3300, 1.8, 5);
    threatLight.position.set(0, 1.0, -0.2);

    group.add(
      torso, belly, head, brow, eyeL, eyeR, glowL, glowR,
      jaw, core, hornL, hornR, shoulderL, shoulderR,
      armL, armR, forearmL, forearmR, legL, legR,
      puddle, glow, threatLight
    );
    group.position.copy(this.position);
    this.mesh = group;
    this.scene.add(group);
  }

  update(dt, player) {
    if (this.dead) return;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const toPlayer = new THREE.Vector3(player.position.x - this.position.x, 0, player.position.z - this.position.z);
    const distance = toPlayer.length();
    const awake = distance < 8.2;

    if (awake && !player.dead) {
      toPlayer.normalize();
      const desired = toPlayer.multiplyScalar(this.speed);
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, desired.x, clamp01(6 * dt));
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, desired.z, clamp01(6 * dt));

      const canReachPlayer = distance < 1.18 && this.level.hasLineOfSight(
        new THREE.Vector3(this.position.x, 0.9, this.position.z),
        new THREE.Vector3(player.position.x, 0.9, player.position.z), 0.55
      );
      if (canReachPlayer && this.attackCooldown <= 0) {
        player.applyDamage(7);
        this.attackCooldown = 1.35;
      }
    } else {
      this.velocity.multiplyScalar(0.9);
    }

    this.position.addScaledVector(this.velocity, dt);
    resolveCollisions(this.position, this.radius, this.level.colliders);
    for (const door of this.level.doors) {
      if (!door.open && circleIntersectsAabb(this.position.x, this.position.z, this.radius, door.collider.aabb)) {
        resolveCollisions(this.position, this.radius, [door.collider]);
      }
    }
    this.mesh.position.set(this.position.x, 0, this.position.z);
    this.mesh.lookAt(player.position.x, 0.8, player.position.z);
    this.mesh.position.y = Math.abs(Math.sin(performance.now() * 0.007 + this.position.x * 2)) * 0.09;
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.health -= amount;
    if (this.health <= 0) this.die();
  }

  die() {
    this.dead = true;
    this.scene.remove(this.mesh);
    this.onDeath?.(this);
  }
}

export class EnemyManager {
  constructor(scene, level, audio) {
    this.scene = scene;
    this.level = level;
    this.audio = audio;
    this.enemies = [];
    this.kills = 0;
  }

  spawnAll(spawns) {
    this.clear();
    for (const spawn of spawns) {
      this.enemies.push(new OilImp(this.scene, spawn.x, spawn.z, this.level, () => {
        this.kills += 1;
        this.audio.death();
      }));
    }
  }

  clear() {
    for (const enemy of this.enemies) this.scene.remove(enemy.mesh);
    this.enemies = [];
    this.kills = 0;
  }

  update(dt, player) {
    for (const enemy of this.enemies) enemy.update(dt, player);
  }

  getMeshes() {
    return this.enemies.filter(e => !e.dead).map(e => e.mesh);
  }

  findByMesh(mesh) {
    return this.enemies.find(enemy => {
      let current = mesh;
      while (current) { if (current === enemy.mesh) return true; current = current.parent; }
      return false;
    });
  }

  get alive() { return this.enemies.filter(e => !e.dead).length; }
  get total() { return this.enemies.length; }
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
