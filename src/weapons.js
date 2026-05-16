import * as THREE from "three";
import { flashMesh } from "./utils.js";

export class ImpactShotgun {
  constructor(camera, ui, audio) {
    this.camera = camera;
    this.ui = ui;
    this.audio = audio;
    this.loaded = 8;
    this.magSize = 8;
    this.reserve = 24;
    this.cooldown = 0;
    this.reloadTimer = 0;
    this.fireDelay = 0.58;
    this.damage = 34;
    this.range = 22;
    this.spread = 0.04;
    this.raycaster = new THREE.Raycaster();
    this.buildModel();
    window.addEventListener("keydown", (event) => {
      if (event.code === "KeyR") this.reload();
    });
  }

  buildModel() {
    this.model = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0x2c3338, roughness: 0.52, metalness: 0.28 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x15100d, roughness: 0.76, metalness: 0.08 });
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.86), metal);
    barrel.position.set(0.14, -0.18, -0.65);
    const barrel2 = barrel.clone();
    barrel2.position.x = -0.14;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.24, 0.42), metal);
    body.position.set(0, -0.35, -0.28);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 0.18), dark);
    grip.position.set(0.2, -0.62, -0.08);
    grip.rotation.x = -0.28;
    this.model.add(barrel, barrel2, body, grip);
    this.model.position.set(0.42, -0.42, -0.78);
    this.camera.add(this.model);
  }

  reset() {
    this.loaded = 8;
    this.reserve = 24;
    this.cooldown = 0;
    this.reloadTimer = 0;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      this.model.rotation.x = Math.sin(this.reloadTimer * 22) * 0.045;
      if (this.reloadTimer <= 0) {
        const needed = this.magSize - this.loaded;
        const moved = Math.min(needed, this.reserve);
        this.loaded += moved;
        this.reserve -= moved;
        this.ui.showMessage("Impact Shotgun loaded.", "RELOADED");
      }
    } else {
      this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, 0, 0.25);
    }
  }

  reload() {
    if (this.reloadTimer > 0 || this.loaded >= this.magSize || this.reserve <= 0) return false;
    this.reloadTimer = 0.9;
    this.ui.showMessage("Reloading shells.", "RELOAD");
    return true;
  }

  addAmmo(amount) {
    this.reserve += amount;
  }

  tryFire(enemies, blockers = []) {
    if (this.cooldown > 0 || this.reloadTimer > 0) return false;
    if (this.loaded <= 0) {
      this.ui.showMessage("No shells loaded. Press R.", "EMPTY");
      this.reload();
      return false;
    }

    this.loaded -= 1;
    this.cooldown = this.fireDelay;
    this.audio.shoot();
    this.ui.showMuzzle();
    this.model.rotation.x = -0.13;

    let bestHit = null;
    for (let pellet = 0; pellet < 6; pellet++) {
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      direction.x += (Math.random() - 0.5) * this.spread;
      direction.y += (Math.random() - 0.5) * this.spread;
      direction.z += (Math.random() - 0.5) * this.spread;
      direction.normalize();
      this.raycaster.set(this.camera.position, direction);
      this.raycaster.far = this.range;
      const hit = this.raycaster.intersectObjects([...enemies.getMeshes(), ...blockers], true)[0];
      if (hit) {
        const root = enemies.findByMesh(hit.object);
        if (root && (!bestHit || hit.distance < bestHit.distance)) bestHit = { enemy: root, distance: hit.distance };
      }
    }

    if (bestHit) {
      const falloff = Math.max(0.45, 1 - bestHit.distance / this.range);
      bestHit.enemy.takeDamage(this.damage * falloff);
      flashMesh(bestHit.enemy.mesh, 0xffe6a1);
    }
    return true;
  }
}
