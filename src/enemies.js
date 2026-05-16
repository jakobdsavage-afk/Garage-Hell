import * as THREE from "three";
import { circleIntersectsAabb, resolveCollisions } from "./utils.js";

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

    // Dark oily body — high contrast against lit environment
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1008,
      roughness: 0.35,
      metalness: 0.15,
      emissive: 0x0a0400,
      emissiveIntensity: 0.3
    });

    // Slightly lighter head for silhouette read
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a0c,
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0x120800,
      emissiveIntensity: 0.3
    });

    // Bright threat eyes — key readability element
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff6020,
      emissive: 0xff4400,
      emissiveIntensity: 6.0,
      roughness: 0.2
    });

    // Body — hunched capsule shape
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.7, 5, 10), bodyMat);
    body.position.y = 0.78;
    body.rotation.x = 0.15; // Hunched forward

    // Head — slightly flattened for menacing look
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), headMat);
    head.position.y = 1.52;
    head.scale.set(1.1, 0.85, 1.0);

    // Eyes — larger, brighter, wider apart for threat read at distance
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), eyeMat);
    leftEye.position.set(-0.16, 1.55, -0.24);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.16;

    // Core chest glow — visible from all angles
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff2200,
      emissiveIntensity: 4.0,
      roughness: 0.2
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), coreMat);
    core.position.set(0, 0.95, -0.35);

    // Horns — sharper, more defined
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0x3a2810,
      roughness: 0.5,
      metalness: 0.2,
      emissive: 0x1a0800,
      emissiveIntensity: 0.3
    });
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 6), hornMat);
    horn.position.set(-0.2, 1.82, -0.05);
    horn.rotation.z = 0.3;
    horn.rotation.x = -0.15;
    const horn2 = horn.clone();
    horn2.position.x = 0.2;
    horn2.rotation.z = -0.3;

    // Arms — simple cylinders for silhouette width
    const armMat = new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.4, metalness: 0.1 });
    const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.5, 4, 6), armMat);
    leftArm.position.set(-0.42, 0.85, -0.1);
    leftArm.rotation.z = 0.4;
    leftArm.rotation.x = -0.3;
    const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.5, 4, 6), armMat);
    rightArm.position.set(0.42, 0.85, -0.1);
    rightArm.rotation.z = -0.4;
    rightArm.rotation.x = -0.3;

    // Oil drip puddle beneath — dark with subtle red edge glow
    const puddleMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = 0.02;

    // Threat glow ring
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.7, 20), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.03;

    // Threat point light — makes enemy visible in dark areas
    const threatLight = new THREE.PointLight(0xff3300, 1.2, 4.5);
    threatLight.position.set(0, 1.0, -0.2);

    group.add(body, head, leftEye, rightEye, core, horn, horn2, leftArm, rightArm, puddle, glow, threatLight);
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
        new THREE.Vector3(player.position.x, 0.9, player.position.z),
        0.55
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
    // Aggressive bobbing animation
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
    return this.enemies.filter((enemy) => !enemy.dead).map((enemy) => enemy.mesh);
  }

  findByMesh(mesh) {
    return this.enemies.find((enemy) => {
      let current = mesh;
      while (current) {
        if (current === enemy.mesh) return true;
        current = current.parent;
      }
      return false;
    });
  }

  get alive() {
    return this.enemies.filter((enemy) => !enemy.dead).length;
  }

  get total() {
    return this.enemies.length;
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
