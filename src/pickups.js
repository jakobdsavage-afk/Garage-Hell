import * as THREE from "three";
import { paintedMetalMaterial, gunmetalMaterial } from "./textures.js";

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

    // Floating platform base — dark metallic disc
    const baseMat = gunmetalMaterial({ baseColor: "#14161c", roughness: 0.4, metalness: 0.45 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.1, 8), baseMat);
    group.add(base);

    if (this.type === "health") {
      // Medkit — white metal box with red cross
      const boxMat = paintedMetalMaterial({ hue: 0, sat: 5, light: 80, roughness: 0.45, metalness: 0.15 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.32), boxMat);
      box.position.y = 0.28;
      group.add(box);

      const crossMat = new THREE.MeshStandardMaterial({ color: 0xcc1515, emissive: 0xff0000, emissiveIntensity: 2.0, roughness: 0.3, metalness: 0.2 });
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.34), crossMat);
      crossV.position.y = 0.28;
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.34), crossMat);
      crossH.position.y = 0.28;
      group.add(crossV, crossH);

      const light = new THREE.PointLight(0xff4444, 1.0, 3);
      light.position.y = 0.4;
      group.add(light);

    } else if (this.type === "armor") {
      // Armor shard — blue metallic diamond
      const armorMat = paintedMetalMaterial({ hue: 215, sat: 65, light: 40, roughness: 0.2, metalness: 0.55, emissive: 0x1144aa, emissiveIntensity: 1.2 });
      const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), armorMat);
      diamond.position.y = 0.35;
      diamond.scale.set(1.0, 1.4, 1.0);
      group.add(diamond);

      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x66aaff, emissive: 0x3388ff, emissiveIntensity: 1.5,
        roughness: 0.3, metalness: 0.5, transparent: true, opacity: 0.7
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 8, 16), ringMat);
      ring.position.y = 0.35; ring.rotation.x = Math.PI / 2;
      group.add(ring);

      const light = new THREE.PointLight(0x4488ff, 0.8, 3);
      light.position.y = 0.4;
      group.add(light);

    } else if (this.type === "ammo") {
      // Shell box — dark brass/olive metal box with shell tips
      const shellMat = paintedMetalMaterial({ hue: 35, sat: 50, light: 25, roughness: 0.45, metalness: 0.4, emissive: 0x442200, emissiveIntensity: 0.4 });
      const shellBox = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.32), shellMat);
      shellBox.position.y = 0.24;
      group.add(shellBox);

      const tipMat = new THREE.MeshStandardMaterial({ color: 0xccaa44, emissive: 0xaa8800, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.55 });
      for (let i = -1; i <= 1; i++) {
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 6), tipMat);
        tip.position.set(i * 0.12, 0.4, 0);
        group.add(tip);
      }

      const light = new THREE.PointLight(0xffaa33, 0.5, 2.5);
      light.position.y = 0.4;
      group.add(light);

    } else if (this.type === "key") {
      const keyColor = this.key === "red" ? 0xff2020 : this.key === "blue" ? 0x2288ff : 0xffcc00;
      const keyEmissive = this.key === "red" ? 0xff0000 : this.key === "blue" ? 0x0055ff : 0xffaa00;
      const keyMat = new THREE.MeshStandardMaterial({
        color: keyColor, roughness: 0.2, metalness: 0.6,
        emissive: keyEmissive, emissiveIntensity: 2.5
      });

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16), keyMat);
      ring.position.y = 0.42; ring.rotation.x = Math.PI / 6;
      group.add(ring);

      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.04), keyMat);
      shaft.position.set(0, 0.2, 0);
      group.add(shaft);

      const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.04), keyMat);
      teeth.position.set(0.04, 0.1, 0);
      group.add(teeth);

      const light = new THREE.PointLight(keyColor, 2.0, 4.5);
      light.position.y = 0.4;
      group.add(light);
    }

    return group;
  }

  update(dt) {
    if (this.collected) return;
    this.mesh.rotation.y += dt * 1.8;
    this.mesh.position.y = this.position.y + Math.sin(performance.now() * 0.004 + this.position.x) * 0.08;
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
