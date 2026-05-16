import * as THREE from "three";
import { makeAabb, makeTextSprite, pointInAabb } from "./utils.js";
import { Pickup } from "./pickups.js";

export class Level {
  constructor(scene, viewport) {
    this.scene = scene;
    this.viewport = viewport;
    this.colliders = [];
    this.doors = [];
    this.pickups = [];
    this.enemySpawns = [];
    this.decor = [];
    this.build();
  }

  clear() {
    for (const object of this.decor) this.scene.remove(object);
    for (const door of this.doors) this.scene.remove(door.mesh);
    for (const pickup of this.pickups) this.scene.remove(pickup.mesh);
    this.colliders = [];
    this.doors = [];
    this.pickups = [];
    this.enemySpawns = [];
    this.decor = [];
  }

  rebuild() {
    this.clear();
    this.build();
  }

  build() {
    this.addLighting();
    this.addRoomFloor(0, 1, 16, 14, 0x272726);
    this.addRoomFloor(-11, 4, 6, 6, 0x22262b);
    this.addRoomFloor(11, -1.5, 6, 7, 0x242323);
    this.addRoomFloor(6, -9.5, 18, 7, 0x17191c);
    this.addPerimeter();
    this.addGarageDressing();
    this.addOffice();
    this.addPartsRoom();
    this.addBackAlley();
    this.addDoors();
    this.addPickups();
    this.enemySpawns = [
      { x: -6.4, z: -3.6 },
      { x: 6.1, z: -4.0 },
      { x: 6.8, z: -0.5 },
      { x: -1.8, z: -5.0 },
      { x: -12.2, z: 5.8 },
      { x: 10.7, z: 0.6 },
      { x: 12.7, z: -4.0 },
      { x: 1.2, z: -10.2 },
      { x: 7.8, z: -11.2 },
      { x: 13.8, z: -8.2 }
    ];
  }

  addLighting() {
    const ambient = new THREE.HemisphereLight(0xaeb8c8, 0x3b1d11, 1.28);
    this.scene.add(ambient);
    this.decor.push(ambient);
    const red = new THREE.PointLight(0xff5b2e, 7.2, 23);
    red.position.set(1, 4.8, -4);
    const orange = new THREE.PointLight(0xffbd69, 4.6, 22);
    orange.position.set(-6, 4, 5.5);
    const blue = new THREE.PointLight(0x8bd8ff, 2.8, 14);
    blue.position.set(-11, 3.3, 4);
    const workLight = new THREE.DirectionalLight(0xffe0bb, 1.15);
    workLight.position.set(-4, 8, 7);
    this.scene.add(red, orange, blue, workLight);
    this.decor.push(red, orange, blue, workLight);
  }

  addRoomFloor(x, z, width, depth, color) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.1, emissive: 0x080604, emissiveIntensity: 0.2 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, depth), mat);
    floor.position.set(x, -0.1, z);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.decor.push(floor);

    const grid = new THREE.GridHelper(Math.max(width, depth), Math.ceil(Math.max(width, depth)), 0xff7a2d, 0x5b5f68);
    grid.position.set(x, 0.01, z);
    grid.scale.x = width / Math.max(width, depth);
    grid.scale.z = depth / Math.max(width, depth);
    this.scene.add(grid);
    this.decor.push(grid);
  }

  addBox(x, y, z, width, height, depth, color, collider = true, emissive = 0x000000) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.08, emissive, emissiveIntensity: emissive ? 0.68 : 0.08 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    box.position.set(x, y, z);
    box.castShadow = true;
    box.receiveShadow = true;
    this.scene.add(box);
    this.decor.push(box);
    if (collider) {
      this.colliders.push({ active: true, aabb: makeAabb(x, z, width, depth), object: box });
    }
    return box;
  }

  addPerimeter() {
    const wall = 0x302b29;
    this.addBox(0, 1.5, 8.25, 16.5, 3, 0.5, wall);
    this.addBox(-8.25, 1.5, -2.5, 0.5, 3, 7.2, wall);
    this.addBox(-8.25, 1.5, 6.5, 0.5, 3, 3.5, wall);
    this.addBox(8.25, 1.5, 4.8, 0.5, 3, 6.8, wall);
    this.addBox(8.25, 1.5, -5.1, 0.5, 3, 1.8, wall);
    this.addBox(-5.6, 1.5, -6.25, 5.2, 3, 0.5, wall);
    this.addBox(6.8, 1.5, -6.25, 2.8, 3, 0.5, wall);

    this.addBox(-14.25, 1.5, 4, 0.5, 3, 6.5, wall);
    this.addBox(-11, 1.5, 0.75, 6.5, 3, 0.5, wall);
    this.addBox(-11, 1.5, 7.25, 6.5, 3, 0.5, wall);
    this.addBox(-8.25, 1.5, 1.8, 0.5, 3, 2.1, wall);
    this.addBox(-8.25, 1.5, 6.5, 0.5, 3, 1.5, wall);

    this.addBox(14.25, 1.5, -1.5, 0.5, 3, 7.5, wall);
    this.addBox(11, 1.5, 2.25, 6.5, 3, 0.5, wall);
    this.addBox(11, 1.5, -5.25, 6.5, 3, 0.5, wall);
    this.addBox(8.25, 1.5, 0.75, 0.5, 3, 3, wall);
    this.addBox(8.25, 1.5, -4.0, 0.5, 3, 2.3, wall);

    this.addBox(-3.25, 1.5, -9.5, 0.5, 3, 7.5, wall);
    this.addBox(15.25, 1.5, -9.5, 0.5, 3, 7.5, wall);
    this.addBox(6, 1.5, -13.25, 18.5, 3, 0.5, wall);
    this.addBox(11.2, 1.5, -6.25, 8.6, 3, 0.5, wall);
  }

  addGarageDressing() {
    const liftMat = 0xb33a2a;
    this.addBox(-3.7, 0.12, 1.2, 2.2, 0.24, 4.2, 0x161616, false);
    this.addBox(3.9, 0.12, 1.1, 2.2, 0.24, 4.2, 0x161616, false);
    this.addBox(-4.9, 1.05, 1.2, 0.16, 2.1, 4.5, liftMat);
    this.addBox(-2.5, 1.05, 1.2, 0.16, 2.1, 4.5, liftMat);
    this.addBox(2.7, 1.05, 1.1, 0.16, 2.1, 4.5, liftMat);
    this.addBox(5.1, 1.05, 1.1, 0.16, 2.1, 4.5, liftMat);
    this.addBox(-6.2, 0.55, 6.1, 1.05, 1.1, 0.55, 0xcc2525);
    this.addBox(6.4, 0.55, 6.0, 0.95, 1.1, 0.55, 0x1e5faf);
    this.addBox(-0.8, 0.52, -4.3, 0.85, 1.05, 0.85, 0x27313a);
    this.addBox(0.5, 0.52, -4.3, 0.85, 1.05, 0.85, 0x27313a);
    this.addBox(1.8, 0.52, -4.3, 0.85, 1.05, 0.85, 0x27313a);
    this.addBox(-1.7, 0.03, 4.9, 2.1, 0.04, 1.1, 0x090909, false, 0xff3300);
    this.addBox(4.8, 0.03, -2.8, 2.6, 0.04, 0.8, 0x090909, false, 0xff3300);

    for (const x of [-5.7, -2.1, 2.4, 5.8]) {
      const light = this.addBox(x, 2.85, -1.3, 1.2, 0.08, 0.12, 0xffd28a, false, 0xff9a34);
      light.rotation.x = 0.04;
    }
    this.addBox(0, 0.022, 5.25, 13.2, 0.025, 0.08, 0xff8c25, false, 0xff5a12);
    this.addBox(0, 0.022, -5.35, 13.2, 0.025, 0.08, 0xff8c25, false, 0xff5a12);
    this.addBox(-7.1, 0.022, 0, 0.08, 0.025, 10.8, 0xff8c25, false, 0xff5a12);
    this.addBox(7.1, 0.022, 0, 0.08, 0.025, 10.8, 0xff8c25, false, 0xff5a12);

    const sign = makeTextSprite("HELL BENT AUTO REPAIR", { scaleX: 4.8, scaleY: 1.05, fontSize: 38 });
    sign.position.set(0, 2.5, 7.9);
    this.scene.add(sign);
    this.decor.push(sign);
  }

  addOffice() {
    this.addBox(-12.2, 0.55, 2.1, 2.0, 1.1, 0.8, 0x5a3824);
    this.addBox(-13.0, 0.75, 5.9, 1.0, 1.5, 0.55, 0x6d2a22);
    const sign = makeTextSprite("OFFICE", { scaleX: 1.8, scaleY: 0.58, fontSize: 54, background: "rgba(80, 10, 6, 0.9)" });
    sign.position.set(-8.35, 2.25, 4.2);
    sign.rotation.y = Math.PI / 2;
    this.scene.add(sign);
    this.decor.push(sign);
  }

  addPartsRoom() {
    for (const z of [-4.0, -2.4, -0.8, 0.8]) {
      this.addBox(12.9, 0.85, z, 0.55, 1.7, 1.0, 0x4b4b46);
      this.addBox(10.0, 0.85, z, 0.55, 1.7, 1.0, 0x4b4b46);
    }
    this.addBox(11.3, 0.42, -3.1, 1.1, 0.84, 0.9, 0x76512e);
    this.addBox(12.1, 0.38, 1.1, 0.9, 0.76, 0.9, 0x7a5733);
  }

  addBackAlley() {
    this.addBox(1.2, 0.05, -9.6, 3.8, 0.08, 1.6, 0x070707, false, 0xff2200);
    this.addBox(10.5, 0.42, -11.8, 1.0, 0.84, 1.0, 0x20242a);
    this.addBox(12.4, 0.52, -9.4, 0.9, 1.05, 0.9, 0x27313a);
    this.addBox(5.7, 1.25, -12.9, 2.2, 0.34, 0.15, 0xff8c25, false, 0xff4a10);
  }

  addDoors() {
    const redDoor = this.createDoor("red", 8.25, -2.25, 0.32, 2.55, 0xff3030);
    this.doors.push(redDoor);
    const alleyDoor = this.createDoor(null, 1.0, -6.25, 3.8, 0.32, 0x2d3036, true);
    this.doors.push(alleyDoor);
  }

  createDoor(key, x, z, width, depth, color, startsOpen = false) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.25, emissive: key === "red" ? 0x330000 : 0x000000, emissiveIntensity: 0.3 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 2.5, depth), mat);
    mesh.position.set(x, 1.25, z);
    this.scene.add(mesh);
    const collider = { active: !startsOpen, aabb: makeAabb(x, z, width, depth), object: mesh };
    this.colliders.push(collider);
    mesh.visible = !startsOpen;
    return { key, mesh, collider, open: startsOpen, x, z };
  }

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
      const expanded = {
        minX: door.collider.aabb.minX - 1,
        maxX: door.collider.aabb.maxX + 1,
        minZ: door.collider.aabb.minZ - 1,
        maxZ: door.collider.aabb.maxZ + 1
      };
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

  openDoor(door) {
    door.open = true;
    door.collider.active = false;
    door.mesh.visible = false;
  }
}
