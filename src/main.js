import * as THREE from "three";
import { Level } from "./level.js";
import { Player } from "./player.js";
import { ImpactShotgun } from "./weapons.js";
import { EnemyManager } from "./enemies.js";
import { PickupManager } from "./pickups.js";
import { UI } from "./ui.js";
import { AudioBus } from "./audio.js";

class GarageHellGame {
  constructor() {
    this.viewport = document.querySelector("#gameViewport");
    this.ui = new UI();
    this.audio = new AudioBus();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060508);
    this.scene.fog = new THREE.FogExp2(0x080608, 0.032);
    this.camera = new THREE.PerspectiveCamera(74, 1, 0.05, 80);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.85;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.viewport.prepend(this.renderer.domElement);

    this.level = new Level(this.scene, this.viewport);
    this.player = new Player(this.camera, this.level, this.ui, this.audio);
    this.weapon = new ImpactShotgun(this.camera, this.ui, this.audio);
    this.addPlayerHeadlamp();
    this.scene.add(this.camera);
    this.enemies = new EnemyManager(this.scene, this.level, this.audio);
    this.enemies.spawnAll(this.level.enemySpawns);
    this.pickups = new PickupManager(this.scene, this.level.pickups);
    this.clock = new THREE.Clock();
    this.running = false;
    this.won = false;
    this.inCombat = false;
    this.fallbackPointer = {
      active: false,
      moved: false,
      x: 0,
      y: 0
    };
    this.bindEvents();
    this.resize();
    this.ui.update(this.state);
    requestAnimationFrame(() => this.loop());
  }

  addPlayerHeadlamp() {
    // Tight warm headlamp — like a work light
    const lamp = new THREE.SpotLight(0xffd8a8, 3.5, 18, Math.PI / 9, 0.55, 1.3);
    lamp.position.set(0, 0.1, 0);
    lamp.target.position.set(0, -0.3, -1);
    this.camera.add(lamp);
    this.camera.add(lamp.target);

    // Very subtle fill so player isn't in total darkness
    const fill = new THREE.PointLight(0xeeddcc, 0.35, 4);
    fill.position.set(0, 0, -0.5);
    this.camera.add(fill);
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    this.ui.bindStart(() => this.startOrRestart());
    this.viewport.addEventListener("click", () => {
      this.audio.unlock();
    });
    window.addEventListener("mousedown", (event) => {
      const aimingAtViewport = this.viewport.contains(event.target);
      if (event.button !== 0 || !aimingAtViewport) return;
      if (!this.running || this.player.dead || this.won) return;
      this.audio.unlock();
      this.fallbackPointer = {
        active: true,
        moved: false,
        x: event.clientX,
        y: event.clientY
      };
    });
    window.addEventListener("mousemove", (event) => {
      if (!this.fallbackPointer.active) return;
      const dx = event.clientX - this.fallbackPointer.x;
      const dy = event.clientY - this.fallbackPointer.y;
      if (dx * dx + dy * dy > 36) this.fallbackPointer.moved = true;
    });
    window.addEventListener("mouseup", (event) => {
      if (event.button !== 0 || !this.fallbackPointer.active) return;
      const shouldShoot = !this.fallbackPointer.moved && this.viewport.contains(event.target);
      this.fallbackPointer.active = false;
      if (shouldShoot && this.running && !this.player.dead && !this.won) this.fireWeapon();
    });
    window.addEventListener("keydown", (event) => {
      if (event.code === "KeyE" && this.running && !this.player.dead && !this.won) {
        this.level.tryInteract(this.player, this.ui, this.audio);
      }
      if (event.code === "Enter" && (!this.running || this.player.dead || this.won)) {
        this.startOrRestart();
      }
    });
  }

  get state() {
    return {
      ...this.player.getState(),
      shellsLoaded: this.weapon.loaded,
      shellsReserve: this.weapon.reserve,
      kills: this.enemies.kills,
      totalEnemies: this.enemies.total,
      won: this.won,
      inCombat: this.inCombat
    };
  }

  startOrRestart() {
    this.audio.unlock();
    if (this.enemies) this.enemies.clear();
    this.level.rebuild();
    this.player.level = this.level;
    this.player.reset();
    this.weapon.reset();
    this.enemies = new EnemyManager(this.scene, this.level, this.audio);
    this.enemies.spawnAll(this.level.enemySpawns);
    this.pickups.reset(this.level.pickups);
    this.running = true;
    this.won = false;
    this.fallbackPointer.active = false;
    this.fallbackPointer.moved = false;
    this.ui.hideOverlay();
    this.ui.showMessage("Clear all Oil Imps.", "FIGHTING");
  }

  fireWeapon() {
    this.weapon.tryFire(this.enemies, this.level.getActiveColliderMeshes());
  }

  resize() {
    const rect = this.viewport.getBoundingClientRect();
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height, false);
  }

  loop() {
    const dt = Math.min(this.clock.getDelta(), 0.033);
    if (this.running) this.update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    this.ui.tick(dt);
    this.player.update(dt);
    this.weapon.update(dt);
    this.enemies.update(dt, this.player);
    this.pickups.update(dt, this.player, this.weapon, this.ui, this.audio);
    this.inCombat = this.enemies.enemies.some((enemy) => !enemy.dead && enemy.position.distanceTo(this.player.position) < 8);

    if (this.player.dead) {
      this.running = false;
      this.ui.update(this.state);
      this.ui.showOverlay("You Died", "The demons punched your timecard. Restart and try a faster route.", "Restart");
      return;
    }

    if (!this.won && this.enemies.alive === 0) {
      this.won = true;
      this.running = false;
      this.ui.update(this.state);
      this.ui.showOverlay("Garage Cleared", "Every Oil Imp is down. Hell Bent Auto Repair survives another night.", "Restart");
      return;
    }

    this.ui.update(this.state);
  }
}

new GarageHellGame();
