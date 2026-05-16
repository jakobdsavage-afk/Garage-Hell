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
    this.scene.background = new THREE.Color(0x050408);
    this.scene.fog = new THREE.FogExp2(0x070508, 0.028);
    this.camera = new THREE.PerspectiveCamera(74, 1, 0.05, 80);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.viewport.prepend(this.renderer.domElement);

    this.level = new Level(this.scene, this.viewport);
    // Set scene environment for all PBR materials
    this.scene.environment = this.level.envMap;

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
    this.fallbackPointer = { active: false, moved: false, x: 0, y: 0 };
    this.bindEvents();
    this.resize();
    this.ui.update(this.state);
    requestAnimationFrame(() => this.loop());
  }

  addPlayerHeadlamp() {
    // Tight warm headlamp
    const lamp = new THREE.SpotLight(0xffd8a8, 3.0, 16, Math.PI / 9, 0.6, 1.4);
    lamp.position.set(0, 0.1, 0);
    lamp.target.position.set(0, -0.3, -1);
    this.camera.add(lamp);
    this.camera.add(lamp.target);

    // Very subtle fill
    const fill = new THREE.PointLight(0xeeddcc, 0.3, 3.5);
    fill.position.set(0, 0, -0.5);
    this.camera.add(fill);
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    this.ui.bindStart(() => this.startOrRestart());
    this.viewport.addEventListener("click", () => this.audio.unlock());
    window.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || !this.viewport.contains(e.target)) return;
      if (!this.running || this.player.dead || this.won) return;
      this.audio.unlock();
      this.fallbackPointer = { active: true, moved: false, x: e.clientX, y: e.clientY };
    });
    window.addEventListener("mousemove", (e) => {
      if (!this.fallbackPointer.active) return;
      const dx = e.clientX - this.fallbackPointer.x;
      const dy = e.clientY - this.fallbackPointer.y;
      if (dx * dx + dy * dy > 36) this.fallbackPointer.moved = true;
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button !== 0 || !this.fallbackPointer.active) return;
      const shouldShoot = !this.fallbackPointer.moved && this.viewport.contains(e.target);
      this.fallbackPointer.active = false;
      if (shouldShoot && this.running && !this.player.dead && !this.won) this.fireWeapon();
    });
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyE" && this.running && !this.player.dead && !this.won) {
        this.level.tryInteract(this.player, this.ui, this.audio);
      }
      if (e.code === "Enter" && (!this.running || this.player.dead || this.won)) {
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

  fireWeapon() { this.weapon.tryFire(this.enemies, this.level.getActiveColliderMeshes()); }

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
    this.inCombat = this.enemies.enemies.some(e => !e.dead && e.position.distanceTo(this.player.position) < 8);

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
