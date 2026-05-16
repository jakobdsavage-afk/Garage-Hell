import * as THREE from "three";

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function makeAabb(x, z, width, depth, pad = 0) {
  return {
    minX: x - width / 2 - pad,
    maxX: x + width / 2 + pad,
    minZ: z - depth / 2 - pad,
    maxZ: z + depth / 2 + pad
  };
}

export function pointInAabb(x, z, box) {
  return x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ;
}

export function circleIntersectsAabb(x, z, radius, box) {
  const cx = clamp(x, box.minX, box.maxX);
  const cz = clamp(z, box.minZ, box.maxZ);
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < radius * radius;
}

export function resolveCollisions(position, radius, colliders) {
  for (const collider of colliders) {
    if (!collider.active || !circleIntersectsAabb(position.x, position.z, radius, collider.aabb)) continue;
    const left = Math.abs(position.x - collider.aabb.minX);
    const right = Math.abs(collider.aabb.maxX - position.x);
    const top = Math.abs(position.z - collider.aabb.minZ);
    const bottom = Math.abs(collider.aabb.maxZ - position.z);
    const min = Math.min(left, right, top, bottom);

    if (min === left) position.x = collider.aabb.minX - radius;
    else if (min === right) position.x = collider.aabb.maxX + radius;
    else if (min === top) position.z = collider.aabb.minZ - radius;
    else position.z = collider.aabb.maxZ + radius;
  }
}

export function makeTextSprite(text, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = options.width ?? 512;
  canvas.height = options.height ?? 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = options.background ?? "rgba(20, 5, 2, 0.88)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = options.border ?? "rgba(255, 98, 40, 0.9)";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  ctx.fillStyle = options.color ?? "#fff2d7";
  ctx.font = `800 ${options.fontSize ?? 42}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(options.scaleX ?? 4, options.scaleY ?? 1, 1);
  return sprite;
}

export function flashMesh(mesh, color = 0xffffff, duration = 90) {
  if (!mesh?.material) return;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const originals = materials.map((mat) => mat.color?.clone());
  materials.forEach((mat) => mat.color?.setHex(color));
  setTimeout(() => {
    materials.forEach((mat, index) => {
      if (originals[index]) mat.color.copy(originals[index]);
    });
  }, duration);
}
