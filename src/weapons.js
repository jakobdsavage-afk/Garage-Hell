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

    // Materials
    const gunMetal = new THREE.MeshStandardMaterial({
      color: 0x2a2e33,
      roughness: 0.38,
      metalness: 0.55,
      emissive: 0x080a0e,
      emissiveIntensity: 0.15
    });
    const darkSteel = new THREE.MeshStandardMaterial({
      color: 0x1a1e22,
      roughness: 0.45,
      metalness: 0.6,
      emissive: 0x040608,
      emissiveIntensity: 0.1
    });
    const wood = new THREE.MeshStandardMaterial({
      color: 0x3d2814,
      roughness: 0.82,
      metalness: 0.0,
      emissive: 0x0a0500,
      emissiveIntensity: 0.1
    });
    const chrome = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0x222222,
      emissiveIntensity: 0.1
    });
    const muzzleMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
      metalness: 0.7
    });

    // Double barrel tubes
    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.92, 8), darkSteel);
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(0.08, -0.12, -0.7);
    const barrel2 = barrel1.clone();
    barrel2.position.x = -0.08;

    // Barrel shroud / heat shield
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.75), gunMetal);
    shroud.position.set(0, -0.14, -0.58);

    // Muzzle ring
    const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 12), muzzleMat);
    muzzle.position.set(0, -0.12, -1.15);

    // Receiver body
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.38), gunMetal);
    receiver.position.set(0, -0.2, -0.22);

    // Pump slide
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.22), chrome);
    pump.position.set(0, -0.28, -0.48);

    // Trigger guard
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 8), darkSteel);
    guard.position.set(0, -0.32, -0.12);
    guard.rotation.y = Math.PI / 2;

    // Stock / grip — wood
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.16), wood);
    grip.position.set(0, -0.48, -0.02);
    grip.rotation.x = -0.2;

    // Stock butt
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.22), wood);
    stock.position.set(0, -0.62, 0.08);

    // Shell ejection port detail
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.1), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 }));
    port.position.set(0.16, -0.16, -0.2);

    this.model.add(barrel1, barrel2, shroud, muzzle, receiver, pump, guard, grip, stock, port);
    this.model.position.set(0.44, -0.38, -0.72);
    this.model.rotation.y = -0.02;
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
      // Pump-action reload wobble
      this.model.rotation.x = Math.sin(this.reloadTimer * 18) * 0.06;
      this.model.position.y = -0.38 + Math.sin(this.reloadTimer * 12) * 0.02;
      if (this.reloadTimer <= 0) {
        const needed = this.magSize - this.loaded;
        const moved = Math.min(needed, this.reserve);
        this.loaded += moved;
        this.reserve -= moved;
        this.model.position.y = -0.38;
        this.ui.showMessage("Impact Shotgun loaded.", "RELOADED");
      }
    } else {
      this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, 0, 0.2);
      this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, -0.38, 0.15);
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
    // Recoil kick
    this.model.rotation.x = -0.15;
    this.model.position.z = -0.72 + 0.06;

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
