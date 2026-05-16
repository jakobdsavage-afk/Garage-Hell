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
    this.speed = 1.72 + Math.random() * 0.38;
    this.attackCooldown = Math.random() * 0.8;
    this.radius = 0.48;
    this.dead = false;
    this.buildMesh();
  }

  buildMesh() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5a3a23, roughness: 0.68, emissive: 0x2a0f05, emissiveIntensity: 0.58 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0x6a472b, roughness: 0.64, emissive: 0x2d1006, emissiveIntensity: 0.48 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff7040, emissive: 0xff3600, emissiveIntensity: 5.2 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.58, 4, 8), bodyMat);
    body.position.y = 0.82;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), headMat);
    head.position.y = 1.48;
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), eyeMat);
    leftEye.position.set(-0.13, 1.53, -0.29);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.12;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), eyeMat);
    core.position.set(0, 1.04, -0.37);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x65431f, roughness: 0.62 });
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 6), hornMat);
    horn.position.set(-0.18, 1.78, 0);
    horn.rotation.z = 0.35;
    const horn2 = horn.clone();
    horn2.position.x = 0.18;
    horn2.rotation.z = -0.35;
    const stainMat = new THREE.MeshBasicMaterial({ color: 0xff4b16, transparent: true, opacity: 0.28, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.76, 20), stainMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.035;
    const threatLight = new THREE.PointLight(0xff3b12, 0.85, 3.8);
    threatLight.position.set(0, 1.1, -0.15);
    group.add(body, head, leftEye, rightEye, core, horn, horn2, glow, threatLight);
    group.position.copy(this.position);
    this.mesh = group;
    this.scene.add(group);
  }

  update(dt, player) {
    if (this.dead) return;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const toPlayer = new THREE.Vector3(player.position.x - this.position.x, 0, player.position.z - this.position.z);
    const distance = toPlayer.length();
    const awake = distance < 10.5;

    if (awake && !player.dead) {
      toPlayer.normalize();
      const desired = toPlayer.multiplyScalar(this.speed);
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, desired.x, clamp01(6 * dt));
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, desired.z, clamp01(6 * dt));

      if (distance < 1.18 && this.attackCooldown <= 0) {
        player.applyDamage(10);
        this.attackCooldown = 1.05;
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
    this.mesh.position.y = Math.abs(Math.sin(performance.now() * 0.006 + this.position.x)) * 0.07;
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
