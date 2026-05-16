import * as THREE from "three";
import { flashMesh } from "./utils.js";
import { gunmetalMaterial, woodMaterial } from "./textures.js";

/* ═══════════════════════════════════════════════════
   Impact Shotgun — detailed pump-action viewmodel
   with procedural textured materials
   ═══════════════════════════════════════════════════ */
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
    window.addEventListener("keydown", (e) => { if (e.code === "KeyR") this.reload(); });
  }

  buildModel() {
    this.model = new THREE.Group();

    // Textured materials
    const gunMetal = gunmetalMaterial({ baseColor: "#1e2228", roughness: 0.3, metalness: 0.65 });
    const darkSteel = gunmetalMaterial({ baseColor: "#141820", roughness: 0.35, metalness: 0.7, emissive: 0x030508 });
    const blued = gunmetalMaterial({ baseColor: "#181c26", roughness: 0.25, metalness: 0.72 });
    const wood = woodMaterial({ baseColor: "#3a2210" });
    const chrome = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.12, metalness: 0.92, emissive: 0x222222, emissiveIntensity: 0.06 });
    const muzzleMat = gunmetalMaterial({ baseColor: "#0c0c0c", roughness: 0.22, metalness: 0.78 });

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.1, 10), blued);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, -0.1, -0.78);

    // Magazine tube
    const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 8), darkSteel);
    magTube.rotation.x = Math.PI / 2; magTube.position.set(0, -0.16, -0.68);

    // Barrel shroud
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.7), gunMetal);
    shroud.position.set(0, -0.13, -0.6);

    // Muzzle
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.06, 10), muzzleMat);
    muzzle.rotation.x = Math.PI / 2; muzzle.position.set(0, -0.1, -1.34);

    // Muzzle ring
    const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 6, 12), chrome);
    muzzleRing.position.set(0, -0.1, -1.35);

    // Front sight
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.02), chrome);
    frontSight.position.set(0, -0.06, -1.2);

    // Receiver
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.4), gunMetal);
    receiver.position.set(0, -0.18, -0.2);

    // Top rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.35), darkSteel);
    rail.position.set(0, -0.07, -0.2);

    // Ejection port
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.1 }));
    port.position.set(0.1, -0.14, -0.18);

    // Pump / forend
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.24), chrome);
    pump.position.set(0, -0.22, -0.52);
    const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.28, metalness: 0.72 });
    for (let i = -2; i <= 2; i++) {
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.015, 0.015), ridgeMat);
      ridge.position.set(0, -0.22, -0.46 + i * 0.04);
      this.model.add(ridge);
    }

    // Trigger guard
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 8), darkSteel);
    guard.position.set(0, -0.3, -0.1); guard.rotation.y = Math.PI / 2;

    // Trigger
    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.04, 0.02), chrome);
    trigger.position.set(0, -0.28, -0.1);

    // Pistol grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.12), wood);
    grip.position.set(0, -0.44, -0.02); grip.rotation.x = -0.18;

    // Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.28), wood);
    stock.position.set(0, -0.52, 0.14); stock.rotation.x = -0.05;

    // Butt plate
    const buttPlate = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.15, 0.025), darkSteel);
    buttPlate.position.set(0, -0.52, 0.29);

    // Sling mount
    const slingMount = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 4, 6), chrome);
    slingMount.position.set(0, -0.08, -1.05);

    this.model.add(
      barrel, magTube, shroud, muzzle, muzzleRing, frontSight,
      receiver, rail, port, pump, guard, trigger,
      grip, stock, buttPlate, slingMount
    );

    this.model.position.set(0.48, -0.42, -0.72);
    this.model.rotation.y = -0.02;
    this.camera.add(this.model);
  }

  reset() { this.loaded = 8; this.reserve = 24; this.cooldown = 0; this.reloadTimer = 0; }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      this.model.rotation.x = Math.sin(this.reloadTimer * 18) * 0.07;
      this.model.position.y = -0.42 + Math.sin(this.reloadTimer * 12) * 0.025;
      if (this.reloadTimer <= 0) {
        const needed = this.magSize - this.loaded;
        const moved = Math.min(needed, this.reserve);
        this.loaded += moved;
        this.reserve -= moved;
        this.model.position.y = -0.42;
        this.ui.showMessage("Impact Shotgun loaded.", "RELOADED");
      }
    } else {
      this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, 0, 0.2);
      this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, -0.42, 0.15);
    }
  }

  reload() {
    if (this.reloadTimer > 0 || this.loaded >= this.magSize || this.reserve <= 0) return false;
    this.reloadTimer = 0.9;
    this.ui.showMessage("Reloading shells.", "RELOAD");
    return true;
  }

  addAmmo(amount) { this.reserve += amount; }

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
    this.model.rotation.x = -0.18;
    this.model.position.z = -0.72 + 0.08;

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
