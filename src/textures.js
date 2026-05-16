import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════
   Procedural Texture Factory
   Generates canvas-based diffuse + normal + roughness maps
   for realistic-looking surfaces without external assets.
   ═══════════════════════════════════════════════════════════════ */

const TEX_SIZE = 512;

// ── Helpers ──────────────────────────────────────────────────

function createCanvas(w = TEX_SIZE, h = TEX_SIZE) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function noise(ctx, w, h, r, g, b, a, scale = 1) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * scale;
    d[i] = Math.max(0, Math.min(255, d[i] + r * n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + g * n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + b * n));
    d[i + 3] = Math.max(0, Math.min(255, d[i + 3] + a * n));
  }
  ctx.putImageData(id, 0, 0);
}

function toTexture(canvas, repeat = [1, 1]) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  return tex;
}

function toLinearTexture(canvas, repeat = [1, 1]) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  return tex;
}

// ── Concrete Floor ──────────────────────────────────────────

export function concreteFloorMaterial(opts = {}) {
  const w = TEX_SIZE, h = TEX_SIZE;

  // Diffuse
  const dc = createCanvas(w, h);
  const dctx = dc.getContext("2d");
  // Base grey-brown
  dctx.fillStyle = opts.baseColor || "#3a3530";
  dctx.fillRect(0, 0, w, h);
  // Variation patches
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const s = 30 + Math.random() * 80;
    const l = 15 + Math.random() * 12;
    dctx.fillStyle = `hsl(25, 8%, ${l}%)`;
    dctx.beginPath();
    dctx.ellipse(x, y, s, s * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
    dctx.fill();
  }
  // Cracks
  dctx.strokeStyle = "rgba(0,0,0,0.3)";
  dctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    dctx.beginPath();
    let cx = Math.random() * w, cy = Math.random() * h;
    dctx.moveTo(cx, cy);
    for (let s = 0; s < 6; s++) {
      cx += (Math.random() - 0.5) * 60;
      cy += (Math.random() - 0.5) * 60;
      dctx.lineTo(cx, cy);
    }
    dctx.stroke();
  }
  // Oil stains
  for (let i = 0; i < 6; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const r = 20 + Math.random() * 50;
    const grad = dctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(10,8,5,0.6)");
    grad.addColorStop(1, "rgba(10,8,5,0)");
    dctx.fillStyle = grad;
    dctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  noise(dctx, w, h, 30, 28, 25, 0, 1);

  // Normal map
  const nc = createCanvas(w, h);
  const nctx = nc.getContext("2d");
  nctx.fillStyle = "#8080ff";
  nctx.fillRect(0, 0, w, h);
  // Surface bumps
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const s = 2 + Math.random() * 8;
    const v = 100 + Math.floor(Math.random() * 60);
    nctx.fillStyle = `rgb(${v}, ${v}, 255)`;
    nctx.beginPath();
    nctx.arc(x, y, s, 0, Math.PI * 2);
    nctx.fill();
  }
  noise(nctx, w, h, 15, 15, 0, 0, 1);

  // Roughness map
  const rc = createCanvas(w, h);
  const rctx = rc.getContext("2d");
  rctx.fillStyle = opts.wet ? "#333" : "#888";
  rctx.fillRect(0, 0, w, h);
  // Wet patches (lower roughness = shinier)
  if (opts.wet) {
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const r = 30 + Math.random() * 80;
      const grad = rctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(0,0,0,0.5)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      rctx.fillStyle = grad;
      rctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  noise(rctx, w, h, 20, 20, 20, 0, 1);

  const rep = opts.repeat || [2, 2];
  return new THREE.MeshStandardMaterial({
    map: toTexture(dc, rep),
    normalMap: toLinearTexture(nc, rep),
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughnessMap: toLinearTexture(rc, rep),
    roughness: opts.wet ? 0.15 : 0.75,
    metalness: opts.wet ? 0.5 : 0.05,
    envMapIntensity: opts.wet ? 1.5 : 0.3,
    color: 0xffffff
  });
}

// ── Cinder Block Wall ───────────────────────────────────────

export function cinderBlockMaterial(opts = {}) {
  const w = TEX_SIZE, h = TEX_SIZE;
  const blockW = w / 4;
  const blockH = h / 8;
  const mortarW = 4;

  // Diffuse
  const dc = createCanvas(w, h);
  const dctx = dc.getContext("2d");
  // Mortar base
  dctx.fillStyle = opts.mortarColor || "#2a2622";
  dctx.fillRect(0, 0, w, h);
  // Draw blocks
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * (blockW / 2);
    for (let col = -1; col < 5; col++) {
      const bx = col * blockW + offset + mortarW / 2;
      const by = row * blockH + mortarW / 2;
      const bw = blockW - mortarW;
      const bh = blockH - mortarW;
      // Each block slightly different shade
      const l = 22 + Math.random() * 10;
      const s = 5 + Math.random() * 5;
      dctx.fillStyle = `hsl(${opts.hue || 25}, ${s}%, ${l}%)`;
      dctx.fillRect(bx, by, bw, bh);
      // Surface texture within block
      for (let t = 0; t < 8; t++) {
        const tx = bx + Math.random() * bw;
        const ty = by + Math.random() * bh;
        const ts = 3 + Math.random() * 10;
        const tl = 18 + Math.random() * 14;
        dctx.fillStyle = `hsla(${opts.hue || 25}, 4%, ${tl}%, 0.4)`;
        dctx.fillRect(tx, ty, ts, ts * 0.6);
      }
    }
  }
  // Grime at bottom
  const grimeGrad = dctx.createLinearGradient(0, h * 0.7, 0, h);
  grimeGrad.addColorStop(0, "rgba(0,0,0,0)");
  grimeGrad.addColorStop(1, "rgba(0,0,0,0.35)");
  dctx.fillStyle = grimeGrad;
  dctx.fillRect(0, 0, w, h);
  noise(dctx, w, h, 18, 16, 14, 0, 1);

  // Normal map
  const nc = createCanvas(w, h);
  const nctx = nc.getContext("2d");
  nctx.fillStyle = "#8080ff";
  nctx.fillRect(0, 0, w, h);
  // Block edges create normals
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * (blockW / 2);
    for (let col = -1; col < 5; col++) {
      const bx = col * blockW + offset;
      const by = row * blockH;
      // Top edge (lit from above)
      nctx.fillStyle = "rgb(128, 160, 255)";
      nctx.fillRect(bx + mortarW, by + mortarW, blockW - mortarW * 2, 3);
      // Bottom edge
      nctx.fillStyle = "rgb(128, 96, 255)";
      nctx.fillRect(bx + mortarW, by + blockH - mortarW - 3, blockW - mortarW * 2, 3);
      // Left edge
      nctx.fillStyle = "rgb(160, 128, 255)";
      nctx.fillRect(bx + mortarW, by + mortarW, 3, blockH - mortarW * 2);
      // Right edge
      nctx.fillStyle = "rgb(96, 128, 255)";
      nctx.fillRect(bx + blockW - mortarW - 3, by + mortarW, 3, blockH - mortarW * 2);
    }
  }
  noise(nctx, w, h, 10, 10, 0, 0, 1);

  // Roughness
  const rc = createCanvas(w, h);
  const rctx = rc.getContext("2d");
  rctx.fillStyle = "#bbb";
  rctx.fillRect(0, 0, w, h);
  noise(rctx, w, h, 25, 25, 25, 0, 1);

  const rep = opts.repeat || [2, 2];
  return new THREE.MeshStandardMaterial({
    map: toTexture(dc, rep),
    normalMap: toLinearTexture(nc, rep),
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: toLinearTexture(rc, rep),
    roughness: 0.88,
    metalness: 0.02,
    color: 0xffffff
  });
}

// ── Corrugated Metal ────────────────────────────────────────

export function corrugatedMetalMaterial(opts = {}) {
  const w = TEX_SIZE, h = TEX_SIZE;

  // Diffuse
  const dc = createCanvas(w, h);
  const dctx = dc.getContext("2d");
  dctx.fillStyle = opts.baseColor || "#3a3e44";
  dctx.fillRect(0, 0, w, h);
  // Corrugation ridges
  const ridgeCount = 16;
  for (let i = 0; i < ridgeCount; i++) {
    const y = (i / ridgeCount) * h;
    const rh = h / ridgeCount;
    const l = i % 2 === 0 ? 28 : 22;
    dctx.fillStyle = `hsl(210, 5%, ${l}%)`;
    dctx.fillRect(0, y, w, rh);
  }
  // Rust patches
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const s = 15 + Math.random() * 40;
    dctx.fillStyle = `hsla(15, 50%, ${15 + Math.random() * 10}%, 0.4)`;
    dctx.beginPath();
    dctx.ellipse(x, y, s, s * 0.5, 0, 0, Math.PI * 2);
    dctx.fill();
  }
  // Scratches
  dctx.strokeStyle = "rgba(80,80,80,0.3)";
  dctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    dctx.beginPath();
    dctx.moveTo(Math.random() * w, Math.random() * h);
    dctx.lineTo(Math.random() * w, Math.random() * h);
    dctx.stroke();
  }
  noise(dctx, w, h, 15, 15, 15, 0, 1);

  // Normal
  const nc = createCanvas(w, h);
  const nctx = nc.getContext("2d");
  nctx.fillStyle = "#8080ff";
  nctx.fillRect(0, 0, w, h);
  for (let i = 0; i < ridgeCount; i++) {
    const y = (i / ridgeCount) * h;
    const rh = h / ridgeCount;
    nctx.fillStyle = i % 2 === 0 ? "rgb(128, 150, 255)" : "rgb(128, 106, 255)";
    nctx.fillRect(0, y, w, rh);
  }

  const rep = opts.repeat || [1, 1];
  return new THREE.MeshStandardMaterial({
    map: toTexture(dc, rep),
    normalMap: toLinearTexture(nc, rep),
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 0.55,
    metalness: 0.4,
    color: 0xffffff
  });
}

// ── Dark Oily Skin (for enemies) ────────────────────────────

export function oilySkinMaterial(opts = {}) {
  const w = 256, h = 256;

  const dc = createCanvas(w, h);
  const dctx = dc.getContext("2d");
  dctx.fillStyle = opts.baseColor || "#1a0e06";
  dctx.fillRect(0, 0, w, h);
  // Muscle/vein streaks
  for (let i = 0; i < 20; i++) {
    dctx.strokeStyle = `hsla(15, 30%, ${8 + Math.random() * 8}%, 0.5)`;
    dctx.lineWidth = 2 + Math.random() * 4;
    dctx.beginPath();
    let cx = Math.random() * w, cy = Math.random() * h;
    dctx.moveTo(cx, cy);
    for (let s = 0; s < 4; s++) {
      cx += (Math.random() - 0.5) * 40;
      cy += (Math.random() - 0.5) * 40;
      dctx.lineTo(cx, cy);
    }
    dctx.stroke();
  }
  // Oil sheen spots
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const r = 10 + Math.random() * 25;
    const grad = dctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(40,25,10,0.5)");
    grad.addColorStop(1, "rgba(10,5,2,0)");
    dctx.fillStyle = grad;
    dctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  noise(dctx, w, h, 20, 15, 10, 0, 1);

  // Normal
  const nc = createCanvas(w, h);
  const nctx = nc.getContext("2d");
  nctx.fillStyle = "#8080ff";
  nctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const s = 2 + Math.random() * 6;
    const v = 110 + Math.floor(Math.random() * 40);
    nctx.fillStyle = `rgb(${v}, ${v}, 255)`;
    nctx.beginPath();
    nctx.arc(x, y, s, 0, Math.PI * 2);
    nctx.fill();
  }

  return new THREE.MeshStandardMaterial({
    map: toTexture(dc),
    normalMap: toLinearTexture(nc),
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughness: opts.roughness ?? 0.25,
    metalness: opts.metalness ?? 0.2,
    emissive: new THREE.Color(opts.emissive || 0x0a0400),
    emissiveIntensity: opts.emissiveIntensity ?? 0.15,
    color: 0xffffff
  });
}

// ── Gunmetal (for weapon) ───────────────────────────────────

export function gunmetalMaterial(opts = {}) {
  const w = 256, h = 256;

  const dc = createCanvas(w, h);
  const dctx = dc.getContext("2d");
  dctx.fillStyle = opts.baseColor || "#1e2228";
  dctx.fillRect(0, 0, w, h);
  // Machining marks (horizontal lines)
  dctx.strokeStyle = "rgba(60,65,75,0.3)";
  dctx.lineWidth = 1;
  for (let y = 0; y < h; y += 3) {
    dctx.beginPath();
    dctx.moveTo(0, y + (Math.random() - 0.5) * 0.5);
    dctx.lineTo(w, y + (Math.random() - 0.5) * 0.5);
    dctx.stroke();
  }
  // Wear spots
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const r = 8 + Math.random() * 20;
    const grad = dctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(50,55,65,0.4)");
    grad.addColorStop(1, "rgba(30,33,40,0)");
    dctx.fillStyle = grad;
    dctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  noise(dctx, w, h, 10, 10, 12, 0, 1);

  // Normal
  const nc = createCanvas(w, h);
  const nctx = nc.getContext("2d");
  nctx.fillStyle = "#8080ff";
  nctx.fillRect(0, 0, w, h);
  // Fine machining bumps
  for (let y = 0; y < h; y += 3) {
    nctx.fillStyle = y % 6 === 0 ? "rgb(128, 134, 255)" : "rgb(128, 122, 255)";
    nctx.fillRect(0, y, w, 1);
  }

  return new THREE.MeshStandardMaterial({
    map: toTexture(dc),
    normalMap: toLinearTexture(nc),
    normalScale: new THREE.Vector2(0.4, 0.4),
    roughness: opts.roughness ?? 0.3,
    metalness: opts.metalness ?? 0.65,
    emissive: new THREE.Color(opts.emissive || 0x040608),
    emissiveIntensity: opts.emissiveIntensity ?? 0.08,
    color: 0xffffff
  });
}

// ── Wood Grain ──────────────────────────────────────────────

export function woodMaterial(opts = {}) {
  const w = 256, h = 256;

  const dc = createCanvas(w, h);
  const dctx = dc.getContext("2d");
  dctx.fillStyle = opts.baseColor || "#3a2210";
  dctx.fillRect(0, 0, w, h);
  // Grain lines
  for (let y = 0; y < h; y += 2) {
    const l = 14 + Math.sin(y * 0.08) * 5 + Math.random() * 3;
    dctx.fillStyle = `hsl(25, 35%, ${l}%)`;
    dctx.fillRect(0, y, w, 2);
  }
  // Knots
  for (let i = 0; i < 2; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const r = 8 + Math.random() * 15;
    for (let ring = 0; ring < 5; ring++) {
      dctx.strokeStyle = `hsla(20, 30%, ${12 + ring * 3}%, 0.5)`;
      dctx.lineWidth = 2;
      dctx.beginPath();
      dctx.ellipse(x, y, r + ring * 3, (r + ring * 3) * 0.6, 0, 0, Math.PI * 2);
      dctx.stroke();
    }
  }
  noise(dctx, w, h, 12, 10, 8, 0, 1);

  return new THREE.MeshStandardMaterial({
    map: toTexture(dc),
    roughness: opts.roughness ?? 0.78,
    metalness: 0.0,
    emissive: new THREE.Color(0x060300),
    emissiveIntensity: 0.05,
    color: 0xffffff
  });
}

// ── Painted Metal (for toolboxes, drums, doors) ─────────────

export function paintedMetalMaterial(opts = {}) {
  const w = 256, h = 256;
  const hue = opts.hue ?? 0;
  const sat = opts.sat ?? 60;
  const light = opts.light ?? 30;

  const dc = createCanvas(w, h);
  const dctx = dc.getContext("2d");
  dctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
  dctx.fillRect(0, 0, w, h);
  // Paint chips / wear
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const s = 3 + Math.random() * 12;
    dctx.fillStyle = `hsla(${hue}, ${sat - 10}%, ${light - 8 + Math.random() * 6}%, 0.5)`;
    dctx.fillRect(x, y, s, s * 0.7);
  }
  // Scratches
  dctx.strokeStyle = `hsla(${hue}, ${sat - 20}%, ${light + 15}%, 0.3)`;
  dctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    dctx.beginPath();
    dctx.moveTo(Math.random() * w, Math.random() * h);
    dctx.lineTo(Math.random() * w, Math.random() * h);
    dctx.stroke();
  }
  noise(dctx, w, h, 10, 8, 8, 0, 1);

  return new THREE.MeshStandardMaterial({
    map: toTexture(dc),
    roughness: opts.roughness ?? 0.4,
    metalness: opts.metalness ?? 0.35,
    emissive: new THREE.Color(opts.emissive || 0x000000),
    emissiveIntensity: opts.emissiveIntensity ?? 0.1,
    color: 0xffffff
  });
}

// ── Environment Cube Map (for reflections) ──────────────────

export function createEnvMap() {
  // Generate a simple dark garage environment cube map
  const size = 128;
  const faces = [];
  const colors = [
    "#0a0808", // px (right)
    "#0a0808", // nx (left)
    "#141210", // py (up - ceiling, slightly lighter)
    "#060504", // ny (down - floor)
    "#0c0a08", // pz (front)
    "#0c0a08"  // nz (back)
  ];

  for (let f = 0; f < 6; f++) {
    const c = createCanvas(size, size);
    const ctx = c.getContext("2d");
    ctx.fillStyle = colors[f];
    ctx.fillRect(0, 0, size, size);

    // Add some warm light spots (simulating overhead lights reflecting)
    if (f === 3 || f === 0 || f === 5) { // floor, right, back
      for (let i = 0; i < 3; i++) {
        const x = 20 + Math.random() * (size - 40);
        const y = 20 + Math.random() * (size - 40);
        const r = 15 + Math.random() * 25;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, "rgba(255, 180, 100, 0.15)");
        grad.addColorStop(0.5, "rgba(255, 100, 40, 0.05)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
      }
    }
    // Red neon reflection on ceiling face
    if (f === 2) {
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, "rgba(255, 40, 10, 0.12)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }

    noise(ctx, size, size, 8, 6, 5, 0, 1);
    faces.push(c);
  }

  const cubeTexture = new THREE.CubeTexture(faces);
  cubeTexture.needsUpdate = true;
  return cubeTexture;
}
