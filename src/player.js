import * as THREE from "three";
import { clamp, resolveCollisions } from "./utils.js";

export class Player {
  constructor(camera, level, ui, audio) {
    this.camera = camera;
    this.level = level;
    this.ui = ui;
    this.audio = audio;
    this.position = new THREE.Vector3(0, 1.65, 6.25);
    this.velocity = new THREE.Vector3();
    this.radius = 0.42;
    this.height = 1.65;
    this.pitch = 0;
    this.yaw = 0;
    this.onGround = false;
    this.health = 100;
    this.maxHealth = 100;
    this.armor = 25;
    this.maxArmor = 100;
    this.dead = false;
    this.keys = { red: false, blue: false, yellow: false };
    this.pickupCounts = { health: 0, armor: 0, ammo: 0 };
    this.controls = {
      forward: false,
      back: false,
      left: false,
      right: false,
      sprint: false,
      jump: false
    };
    this.lookSensitivity = 0.0022;
    this.footBob = 0;
    this.damageCooldown = 0;
    this.bindControls();
    this.syncCamera();
  }

  bindControls() {
    window.addEventListener("keydown", (event) => {
      if (event.repeat) return;
      this.setKey(event.code, true);
    });
    window.addEventListener("keyup", (event) => this.setKey(event.code, false));
    window.addEventListener("mousemove", (event) => {
      if (document.pointerLockElement !== this.level.viewport || this.dead) return;
      this.yaw -= event.movementX * this.lookSensitivity;
      this.pitch -= event.movementY * this.lookSensitivity;
      this.pitch = clamp(this.pitch, -1.25, 1.25);
      this.syncCamera();
    });
  }

  setKey(code, active) {
    if (code === "KeyW") this.controls.forward = active;
    if (code === "KeyS") this.controls.back = active;
    if (code === "KeyA") this.controls.left = active;
    if (code === "KeyD") this.controls.right = active;
    if (code === "ShiftLeft" || code === "ShiftRight") this.controls.sprint = active;
    if (code === "Space") this.controls.jump = active;
  }

  reset() {
    this.position.set(0, 1.65, 6.25);
    this.velocity.set(0, 0, 0);
    this.pitch = 0;
    this.yaw = 0;
    this.health = this.maxHealth;
    this.armor = 25;
    this.dead = false;
    this.keys = { red: false, blue: false, yellow: false };
    this.pickupCounts = { health: 0, armor: 0, ammo: 0 };
    this.damageCooldown = 0;
    this.syncCamera();
  }

  update(dt) {
    if (this.dead) return;
    this.damageCooldown = Math.max(0, this.damageCooldown - dt);

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = new THREE.Vector3();
    if (this.controls.forward) wish.add(forward);
    if (this.controls.back) wish.sub(forward);
    if (this.controls.right) wish.add(right);
    if (this.controls.left) wish.sub(right);
    if (wish.lengthSq() > 0) wish.normalize();

    const speed = this.controls.sprint ? 9.2 : 6.3;
    const accel = this.onGround ? 22 : 8;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, wish.x * speed, clamp(accel * dt, 0, 1));
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, wish.z * speed, clamp(accel * dt, 0, 1));

    if (this.controls.jump && this.onGround) {
      this.velocity.y = 6.8;
      this.onGround = false;
    }

    this.velocity.y -= 18 * dt;
    this.position.addScaledVector(this.velocity, dt);

    if (this.position.y < this.height) {
      this.position.y = this.height;
      this.velocity.y = 0;
      this.onGround = true;
    }

    resolveCollisions(this.position, this.radius, this.level.colliders);
    this.position.x = clamp(this.position.x, -15.4, 18.8);
    this.position.z = clamp(this.position.z, -13.5, 13.4);

    if (wish.lengthSq() > 0 && this.onGround) this.footBob += dt * (this.controls.sprint ? 13 : 9);
    this.syncCamera();
  }

  syncCamera() {
    const bob = this.onGround ? Math.sin(this.footBob) * 0.035 : 0;
    this.camera.position.set(this.position.x, this.position.y + bob, this.position.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  applyDamage(amount) {
    if (this.dead || this.damageCooldown > 0) return;
    this.damageCooldown = 0.28;
    const armorBlock = Math.min(this.armor, amount * 0.62);
    this.armor -= armorBlock;
    this.health -= amount - armorBlock;
    this.ui.showDamage();
    this.audio.hurt();
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      this.audio.death();
      document.exitPointerLock?.();
    }
  }

  heal(amount) {
    const before = this.health;
    this.health = clamp(this.health + amount, 0, this.maxHealth);
    return this.health > before;
  }

  addArmor(amount) {
    const before = this.armor;
    this.armor = clamp(this.armor + amount, 0, this.maxArmor);
    return this.armor > before;
  }

  getState() {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      armor: this.armor,
      maxArmor: this.maxArmor,
      keys: this.keys,
      pickupCounts: this.pickupCounts,
      dead: this.dead
    };
  }
}
