import { clamp } from "./utils.js";

export class UI {
  constructor() {
    this.el = {
      healthValue: document.querySelector("#healthValue"),
      maxHealthValue: document.querySelector("#maxHealthValue"),
      healthBar: document.querySelector("#healthBar"),
      armorValue: document.querySelector("#armorValue"),
      maxArmorValue: document.querySelector("#maxArmorValue"),
      armorBar: document.querySelector("#armorBar"),
      ammoLoaded: document.querySelector("#ammoLoaded"),
      ammoReserve: document.querySelector("#ammoReserve"),
      ammoBar: document.querySelector("#ammoBar"),
      redKey: document.querySelector("#redKey"),
      blueKey: document.querySelector("#blueKey"),
      yellowKey: document.querySelector("#yellowKey"),
      redKeyCount: document.querySelector("#redKeyCount"),
      blueKeyCount: document.querySelector("#blueKeyCount"),
      yellowKeyCount: document.querySelector("#yellowKeyCount"),
      healthPickupCount: document.querySelector("#healthPickupCount"),
      armorPickupCount: document.querySelector("#armorPickupCount"),
      skullCount: document.querySelector("#skullCount"),
      enemyProgress: document.querySelector("#enemyProgress"),
      objectiveBar: document.querySelector("#objectiveBar"),
      statusText: document.querySelector("#statusText"),
      messageText: document.querySelector("#messageText"),
      overlay: document.querySelector("#overlay"),
      overlayTitle: document.querySelector("#overlayTitle"),
      overlayText: document.querySelector("#overlayText"),
      startButton: document.querySelector("#startButton"),
      damageVignette: document.querySelector("#damageVignette"),
      muzzleFlash: document.querySelector("#muzzleFlash"),
      weaponHud: document.querySelector("#weaponHud")
    };
    this.messageTimer = 0;
  }

  bindStart(handler) {
    this.el.startButton.addEventListener("click", (event) => {
      event.stopPropagation();
      handler();
    });
  }

  update(state) {
    const healthPct = clamp(state.health / state.maxHealth, 0, 1) * 100;
    const armorPct = clamp(state.armor / state.maxArmor, 0, 1) * 100;

    this.el.healthValue.textContent = Math.ceil(state.health);
    this.el.maxHealthValue.textContent = state.maxHealth;
    this.el.healthBar.style.width = `${healthPct}%`;

    this.el.armorValue.textContent = Math.ceil(state.armor);
    this.el.maxArmorValue.textContent = state.maxArmor;
    this.el.armorBar.style.width = `${armorPct}%`;

    this.el.ammoLoaded.textContent = state.shellsLoaded;
    this.el.ammoReserve.textContent = state.shellsReserve;
    // Ammo bar: loaded / magSize (8)
    const ammoPct = clamp(state.shellsLoaded / 8, 0, 1) * 100;
    this.el.ammoBar.style.width = `${ammoPct}%`;

    // Keys
    this.el.redKey.classList.toggle("collected", state.keys.red);
    this.el.blueKey.classList.toggle("collected", state.keys.blue);
    this.el.yellowKey.classList.toggle("collected", state.keys.yellow);
    this.el.redKeyCount.textContent = state.keys.red ? "1" : "0";
    this.el.blueKeyCount.textContent = state.keys.blue ? "1" : "0";
    this.el.yellowKeyCount.textContent = state.keys.yellow ? "1" : "0";
    this.el.redKeyCount.classList.toggle("has", state.keys.red);
    this.el.blueKeyCount.classList.toggle("has", state.keys.blue);
    this.el.yellowKeyCount.classList.toggle("has", state.keys.yellow);

    // Items
    this.el.healthPickupCount.textContent = state.pickupCounts.health;
    this.el.armorPickupCount.textContent = state.pickupCounts.armor;
    this.el.skullCount.textContent = state.kills;

    // Objective
    this.el.enemyProgress.textContent = `${state.kills} / ${state.totalEnemies}`;
    const objPct = state.totalEnemies > 0 ? clamp(state.kills / state.totalEnemies, 0, 1) * 100 : 0;
    this.el.objectiveBar.style.width = `${objPct}%`;

    // Status
    if (state.dead) this.setStatus("YOU DIED", "Restart and give the closing shift another try.");
    else if (state.won) this.setStatus("GARAGE CLEARED", "The shop is quiet again.");
    else if (state.health <= 30) this.setStatus("LOW HEALTH", "Find a health pack before the floor eats you.");
    else if (state.inCombat) this.setStatus("FIGHTING", "Oil Imps are closing in.");
    else if (!this.messageTimer) this.setStatus("READY", "The service bays are quiet. Too quiet.");
  }

  tick(dt) {
    if (this.messageTimer > 0) {
      this.messageTimer = Math.max(0, this.messageTimer - dt);
    }
  }

  setStatus(status, message, timed = false) {
    this.el.statusText.textContent = status;
    this.el.messageText.textContent = message;
    if (timed) this.messageTimer = 2.2;
  }

  showMessage(message, status = "STATUS") {
    this.setStatus(status, message, true);
  }

  showDamage() {
    this.el.damageVignette.classList.add("active");
    setTimeout(() => this.el.damageVignette.classList.remove("active"), 150);
  }

  showMuzzle() {
    this.el.muzzleFlash.classList.remove("active");
    this.el.weaponHud.classList.remove("kick");
    void this.el.muzzleFlash.offsetWidth;
    this.el.muzzleFlash.classList.add("active");
    this.el.weaponHud.classList.add("kick");
    setTimeout(() => this.el.weaponHud.classList.remove("kick"), 95);
  }

  showOverlay(title, text, buttonText = "Start Game") {
    this.el.overlayTitle.textContent = title;
    this.el.overlayText.textContent = text;
    this.el.startButton.textContent = buttonText;
    this.el.overlay.classList.add("visible");
  }

  hideOverlay() {
    this.el.overlay.classList.remove("visible");
  }
}
