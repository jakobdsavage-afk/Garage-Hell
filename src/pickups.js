import * as THREE from "three";

export class Pickup {
  constructor(scene, type, x, z, options = {}) {
    this.scene = scene;
    this.type = type;
    this.amount = options.amount ?? 0;
    this.key = options.key ?? null;
    this.position = new THREE.Vector3(x, 0.45, z);
    this.collected = false;
    this.mesh = this.buildMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  buildMesh() {
    const group = new THREE.Group();
    const color = this.type === "health" ? 0xff4058 : this.type === "armor" ? 0x63c7ff : this.type === "ammo" ? 0xffc14a : this.key === "red" ? 0xff3434 : 0x37a7ff;
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.24, roughness: 0.4 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0x12141a }));
    const shape = this.type === "key"
      ? new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.045, 8, 16), mat)
      : new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat);
    shape.position.y = 0.32;
    if (this.type === "health") {
      const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.44), crossMat);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.45), crossMat);
      a.position.y = b.position.y = 0.32;
      group.add(a, b);
    }
    if (this.type === "ammo") shape.scale.set(1.2, 0.72, 0.72);
    group.add(base, shape);
    return group;
  }

  update(dt) {
    if (this.collected) return;
    this.mesh.rotation.y += dt * 1.6;
    this.mesh.position.y = this.position.y + Math.sin(performance.now() * 0.004 + this.position.x) * 0.07;
  }

  tryCollect(player, weapon, ui, audio) {
    if (this.collected) return false;
    const dx = player.position.x - this.position.x;
    const dz = player.position.z - this.position.z;
    if (dx * dx + dz * dz > 0.85 * 0.85) return false;

    let collected = true;
    if (this.type === "health") {
      collected = player.heal(this.amount);
      if (collected) {
        player.pickupCounts.health += 1;
        ui.showMessage(`Recovered ${this.amount} health.`, "HEALTH");
      }
    } else if (this.type === "armor") {
      collected = player.addArmor(this.amount);
      if (collected) {
        player.pickupCounts.armor += 1;
        ui.showMessage(`Armor boosted by ${this.amount}.`, "ARMOR");
      }
    } else if (this.type === "ammo") {
      weapon.addAmmo(this.amount);
      player.pickupCounts.ammo += this.amount;
      ui.showMessage(`Picked up ${this.amount} shells.`, "AMMO");
    } else if (this.type === "key") {
      player.keys[this.key] = true;
      ui.showMessage(`${this.key.toUpperCase()} key acquired.`, "KEY");
    }

    if (!collected) return false;
    this.collected = true;
    this.scene.remove(this.mesh);
    audio.pickup();
    return true;
  }
}

export class PickupManager {
  constructor(scene, pickups) {
    this.scene = scene;
    this.pickups = pickups;
  }

  reset(pickups) {
    this.clear();
    this.pickups = pickups;
  }

  clear() {
    for (const pickup of this.pickups) this.scene.remove(pickup.mesh);
    this.pickups = [];
  }

  update(dt, player, weapon, ui, audio) {
    for (const pickup of this.pickups) {
      pickup.update(dt);
      pickup.tryCollect(player, weapon, ui, audio);
    }
  }
}
