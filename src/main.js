import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import zona from '../data/zona-minuto.json';
import { buildAvatar, setPose, aleatorio, disposeAvatar } from './avatar.js';
import { createEditor, cargarGuardado } from './editor.js';

// =====================================================================
// Ruta Segura Bogotá · Zona 0: Minuto de Dios (prototipo)
// Mapa: OpenStreetMap (ODbL) · Arbolado: Jardín Botánico de Bogotá (CC BY 4.0)
// =====================================================================

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
const B = zona.bounds;

// ---------- Ajustes de movimiento (inspirados en la sensación de un obby) ----------
const MOV = { walk: 4.6, run: 7.2, accel: 30, air: 10, gravity: 24, jumpV: 8.2, coyote: 0.12, buffer: 0.12, radius: 0.4 };
const HOLD_TIME = 0.9; // segundos para registrar una muestra
const REACH = 3.2;     // metros para alcanzar un árbol

// ---------- Renderizador y escena ----------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const SKY = new THREE.Color('#cfe3ef');
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 90, 330);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 900);

const hemi = new THREE.HemisphereLight('#eaf4ff', '#b9a987', 1.5);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1d6', 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
const sc = sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 220;
sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);
const SUN_DIR = new THREE.Vector3(0.45, 1, 0.3).normalize();

// ---------- Utilidades de geometría ----------
const shapeFrom = (poly) => new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
function flatPoly(poly, y, mat) {
  const g = new THREE.ShapeGeometry(shapeFrom(poly));
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.y = y; m.receiveShadow = true;
  return m;
}
function pointInPoly(x, z, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}
const flatMat = (color, order = 0) => new THREE.MeshStandardMaterial({
  color, roughness: 0.95, metalness: 0, polygonOffset: true, polygonOffsetFactor: -order, polygonOffsetUnits: -order * 2,
});

// ---------- Suelo, áreas y vías ----------
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ color: '#a9b294', roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
scene.add(ground);

const AREA_COLOR = {
  grass: '#8fb466', park: '#86ad5e', grassland: '#93b56c', scrub: '#6f9450', recreation_ground: '#9cbc72',
  pitch: '#5f9e6e', university: '#b9c79a', school: '#cdbf9f', parking: '#a9a9a4', plaza: '#c0826a',
  construction: '#bfae8f', commercial: '#c4bcb0', restaurant: '#d7c9b0',
};
const AREA_ORDER = { university: 1, school: 1, construction: 1, commercial: 1, park: 2, grassland: 2, grass: 3, scrub: 3, recreation_ground: 3, parking: 3, restaurant: 3, plaza: 4, pitch: 5 };
for (const a of zona.areas) {
  const order = AREA_ORDER[a.tipo] ?? 2;
  scene.add(flatPoly(a.poly, 0.01 * order, flatMat(AREA_COLOR[a.tipo] || '#bdb7a5', order)));
}

const VIA_COLOR = { trunk: '#55575c', primary: '#5b5d62', secondary: '#606267', tertiary: '#64666b', residential: '#6c6e72', service: '#77797c',
  footway: '#d9cfbd', pedestrian: '#d9cfbd', cycleway: '#b46a5a', steps: '#c8bfae' };
function ribbon(line, width) {
  const pos = [], idx = [];
  const n = line.length;
  for (let i = 0; i < n; i++) {
    const p = line[i], prev = line[Math.max(0, i - 1)], next = line[Math.min(n - 1, i + 1)];
    let dx = next[0] - prev[0], dz = next[1] - prev[1];
    const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const nx = -dz * width / 2, nz = dx * width / 2;
    pos.push(p[0] + nx, 0, p[1] + nz, p[0] - nx, 0, p[1] - nz);
    if (i < n - 1) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const viaGroups = {};
for (const v of zona.vias) (viaGroups[v.tipo] ||= []).push(v);
for (const [tipo, list] of Object.entries(viaGroups)) {
  const order = /footway|cycleway|steps|pedestrian/.test(tipo) ? 7 : 6;
  const mat = flatMat(VIA_COLOR[tipo] || '#777', order);
  for (const v of list) {
    const m = new THREE.Mesh(ribbon(v.linea, v.ancho), mat);
    m.position.y = 0.01 * order; m.receiveShadow = true;
    scene.add(m);
  }
}

// ---------- Edificios (Catastro de Bogotá) ----------
const colliders = [];
function facadeTex(draw, rx = 3.2, ry = 3) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 128, 128); draw(x);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / rx, 1 / ry); t.anisotropy = 4; return t;
}
const TEX = {
  ventanas: facadeTex((x) => { x.fillStyle = '#5d6f7d'; x.fillRect(30, 26, 68, 58); x.fillStyle = '#8fa6b5'; x.fillRect(34, 30, 28, 50); x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 120, 128, 8); }),
  // Ladrillo con ventanas corridas (bloques de Uniminuto)
  ladrillo: facadeTex((x) => {
    x.fillStyle = '#b5603f'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = 'rgba(0,0,0,0.10)'; for (let y = 0; y < 128; y += 8) x.fillRect(0, y, 128, 1.5);
    x.fillStyle = '#56656f'; x.fillRect(0, 34, 128, 40); x.fillStyle = '#a9bcc6';
    for (let i = 0; i < 128; i += 32) x.fillRect(i + 3, 37, 26, 34);
  }, 4, 3.4),
  // Concreto con vidrio en retícula (torre de Uniminuto)
  vidrio: facadeTex((x) => { x.fillStyle = '#6f8592'; x.fillRect(10, 10, 108, 100); x.fillStyle = '#9fb4c0'; x.fillRect(14, 14, 48, 92); x.fillStyle = '#c9c6bf'; x.fillRect(62, 10, 4, 100); }, 3.4, 3.4),
  // Concreto en franjas horizontales (iglesia)
  concreto: facadeTex((x) => { x.fillStyle = 'rgba(0,0,0,0.13)'; x.fillRect(0, 62, 128, 3); x.fillRect(0, 126, 128, 2); }, 4, 2.6),
  liso: null,
};
const ESTILOS = {
  casa: { tex: 'ventanas', colores: ['#e6d6bd', '#d9b99a', '#c98e6e', '#b8674a', '#e8e0cf', '#cfa57f', '#d7cbb5'] },
  colegio: { tex: 'ventanas', colores: ['#c47a5a', '#b86f52', '#cf8a69'] },
  uniminuto: { tex: 'ladrillo', colores: ['#ffffff'] },
  'uniminuto-torre': { tex: 'vidrio', colores: ['#c4c2bc'] },
  museo: { tex: 'liso', colores: ['#f6f4ef'] },
  iglesia: { tex: 'concreto', colores: ['#c9c4b9'] },
  cultural: { tex: 'liso', colores: ['#e9e4da'] },
};
// Se agrupan muros y techos por estilo en pocas mallas (rinde mejor en celulares).
const buckets = {};
function sliceGroup(geo, g, color) {
  const sub = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const at = geo.attributes[name];
    sub.setAttribute(name, new THREE.BufferAttribute(at.array.slice(g.start * at.itemSize, (g.start + g.count) * at.itemSize), at.itemSize));
  }
  const col = new Float32Array(g.count * 3);
  for (let i = 0; i < g.count; i++) { col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b; }
  sub.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return sub;
}
zona.edificios.forEach((e, i) => {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of e.poly) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
  colliders.push({ poly: e.poly, minX, maxX, minZ, maxZ, h: e.altura });
  if (e.oculto) return;
  const est = ESTILOS[e.estilo] || ESTILOS.casa;
  const color = new THREE.Color(est.colores[Math.floor(hash(String(e.lote)) * est.colores.length)]);
  const g = new THREE.ExtrudeGeometry(shapeFrom(e.poly), { depth: e.altura, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const b = (buckets[e.estilo] ||= { roofs: [], walls: [] });
  for (const grp of g.groups) {
    if (grp.materialIndex === 0) b.roofs.push(sliceGroup(g, grp, color.clone().multiplyScalar(0.8)));
    else b.walls.push(sliceGroup(g, grp, color));
  }
  g.dispose();
});
const roofMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
for (const [estilo, b] of Object.entries(buckets)) {
  const tex = TEX[(ESTILOS[estilo] || ESTILOS.casa).tex];
  const wallMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: estilo === 'uniminuto-torre' ? 0.6 : 0.88, map: tex || null });
  for (const [list, mat] of [[b.walls, wallMat], [b.roofs, roofMat]]) {
    const m = new THREE.Mesh(mergeGeometries(list), mat);
    m.castShadow = true; m.receiveShadow = true; scene.add(m);
  }
}
const EXTRA_MAT = {
  iglesia: new THREE.MeshStandardMaterial({ color: '#cbc6bb', roughness: 0.92, map: TEX.concreto }),
  museo: new THREE.MeshStandardMaterial({ color: '#f7f5f0', roughness: 0.9 }),
  zocalo: new THREE.MeshStandardMaterial({ color: '#b9705a', roughness: 1 }),
};
for (const x of zona.extras || []) {
  let m = null;
  if (x.tipo === 'cilindro') {
    const g = new THREE.CylinderGeometry(x.r, x.r, x.h, 40, 1);
    // UV en metros para que la textura de franjas no se estire
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * x.r, uv.getY(i) * x.h);
    m = new THREE.Mesh(g, EXTRA_MAT[x.estilo]); m.position.set(x.p[0], x.h / 2, x.p[2]);
    colliders.push({ circle: true, x: x.p[0], z: x.p[2], r: x.r, minX: x.p[0] - x.r, maxX: x.p[0] + x.r, minZ: x.p[2] - x.r, maxZ: x.p[2] + x.r, h: x.h });
  } else if (x.tipo === 'caja') {
    m = new THREE.Mesh(new THREE.BoxGeometry(...x.s), EXTRA_MAT[x.estilo]); m.position.set(x.p[0], x.s[1] / 2, x.p[2]);
  } else if (x.tipo === 'zocalo') {
    m = new THREE.Mesh(new THREE.BoxGeometry(...x.s), EXTRA_MAT.zocalo); m.position.set(x.p[0], x.s[1] / 2, x.p[2]);
  }
  if (m) { m.castShadow = true; m.receiveShadow = true; scene.add(m); }
  if (x.tipo === 'cupula') {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(x.r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#aeb6bd', metalness: 0.6, roughness: 0.35, flatShading: true }));
    dome.scale.y = 0.55; dome.position.set(...x.p); dome.castShadow = true; scene.add(dome);
  }
}

// ---------- Árboles (datos reales del censo) ----------
const especies = zona.especies;
const arboles = zona.arboles;
const leafColor = (esp) => {
  const r = hash(esp.censo);
  const c = new THREE.Color().setHSL(0.24 + r * 0.12, 0.32 + hash(esp.censo + 's') * 0.25, 0.27 + hash(esp.censo + 'l') * 0.12);
  if (/Cayeno/.test(esp.censo)) c.lerp(new THREE.Color('#b24a3e'), 0.25);
  if (/Chicala, chirlo/.test(esp.censo)) c.lerp(new THREE.Color('#d9b630'), 0.35);
  if (/Acacia morada/.test(esp.censo)) c.lerp(new THREE.Color('#8a5aa8'), 0.3);
  if (/Alcaparro/.test(esp.censo)) c.lerp(new THREE.Color('#d6b82e'), 0.3);
  return c;
};
function palmCrown() {
  const parts = [new THREE.IcosahedronGeometry(0.28, 0)];
  for (let k = 0; k < 7; k++) {
    const leaf = new THREE.BoxGeometry(0.32, 0.05, 1.5).toNonIndexed();
    leaf.translate(0, 0, 0.75); leaf.rotateX(0.45 + (k % 2) * 0.2); leaf.rotateY(k * Math.PI * 2 / 7);
    parts.push(leaf);
  }
  for (const p of parts) p.deleteAttribute('uv');
  return mergeGeometries(parts);
}
const counts = { copa: 0, conifera: 0, palma: 0 };
arboles.forEach(a => counts[especies[a.esp].forma]++);
const trunkMat = new THREE.MeshStandardMaterial({ color: '#6b5440', roughness: 1 });
const leafMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true });
const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.7, 1, 1, 6).translate(0, 0.5, 0), trunkMat, arboles.length);
const crowns = {
  copa: new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), leafMat, counts.copa),
  conifera: new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), leafMat, counts.conifera),
  palma: new THREE.InstancedMesh(palmCrown(), leafMat, counts.palma),
};
for (const m of [trunks, ...Object.values(crowns)]) { m.castShadow = true; m.receiveShadow = true; scene.add(m); }
const ci = { copa: 0, conifera: 0, palma: 0 };
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
const treeTop = [];
arboles.forEach((a, i) => {
  const esp = especies[a.esp]; const h = a.h; const rot = hash(i + 'r') * Math.PI * 2;
  Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
  let trunkH, trunkR, top;
  if (esp.forma === 'palma') {
    trunkH = h; trunkR = 0.12 + h * 0.01;
    P.set(a.x, h, a.z); S.set(1.3 + h * 0.06, 1.3 + h * 0.06, 1.3 + h * 0.06);
    M.compose(P, Q, S); crowns.palma.setMatrixAt(ci.palma, M); crowns.palma.setColorAt(ci.palma++, leafColor(esp));
    top = h + 0.6;
  } else if (esp.forma === 'conifera') {
    trunkH = h * 0.3; trunkR = 0.1 + h * 0.012;
    const cr = clamp(h * 0.2, 0.4, 3.2);
    P.set(a.x, h * 0.22, a.z); S.set(cr, h * 0.8, cr);
    M.compose(P, Q, S); crowns.conifera.setMatrixAt(ci.conifera, M); crowns.conifera.setColorAt(ci.conifera++, leafColor(esp));
    top = h;
  } else {
    const cr = clamp(h * 0.3, 0.45, 5.2);
    trunkH = Math.max(0.4, h - cr * 1.3); trunkR = 0.08 + h * 0.014;
    P.set(a.x, h - cr * 0.85, a.z); S.set(cr, cr * 0.9, cr);
    M.compose(P, Q, S); crowns.copa.setMatrixAt(ci.copa, M); crowns.copa.setColorAt(ci.copa++, leafColor(esp));
    top = h;
  }
  P.set(a.x, 0, a.z); S.set(trunkR, trunkH, trunkR);
  M.compose(P, Q, S); trunks.setMatrixAt(i, M);
  treeTop[i] = top;
  a.trunkR = trunkR;
});

// ---------- Rótulos y sprites ----------
function textSprite(text, { size = 44, color = '#1d2a33', bg = 'rgba(255,255,255,0.88)', scale = 0.03, border = null } = {}) {
  const c = document.createElement('canvas'); const ctx = c.getContext('2d');
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + size; const h = Math.ceil(size * 1.6);
  c.width = w; c.height = h;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(0, 0, w, h, h / 2); ctx.fill();
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 5; ctx.stroke(); }
  ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(w * scale, h * scale, 1);
  return s;
}
for (const r of zona.rotulos) { const s = textSprite(r.texto); s.position.set(...r.p); scene.add(s); }
for (const x of zona.extras || []) if (x.tipo === 'letrero') {
  const s = textSprite(x.texto, { size: 64, color: '#ffffff', bg: 'rgba(160,80,50,0.0)', scale: 0.05 }); s.position.set(...x.p); scene.add(s);
}

function leafIcon(color) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(64, 64, 58, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = color; ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(64, 22); ctx.bezierCurveTo(108, 44, 100, 94, 64, 106); ctx.bezierCurveTo(28, 94, 20, 44, 64, 22); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(64, 34); ctx.lineTo(64, 100); ctx.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const ICON_COMUN = leafIcon('#2f9e5b'), ICON_RARA = leafIcon('#d39b12');

// ---------- Muestras: anillos sobre árboles reales ----------
const muestras = zona.muestras.map((m) => {
  const a = arboles[m.arbol];
  const color = m.rara ? '#f2b705' : '#35c46d';
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(a.x, 0.25, a.z);
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: m.rara ? ICON_RARA : ICON_COMUN, transparent: true, depthWrite: false }));
  icon.scale.set(1.6, 1.6, 1);
  const iy = treeTop[m.arbol] + 1.6; icon.position.set(a.x, iy, a.z);
  scene.add(ring, icon);
  return { ...m, esp: a.esp, ring, icon, iy, done: false };
});

// ---------- Punto de encuentro ----------
const pe = zona.puntoEncuentro;
const peDisc = new THREE.Mesh(new THREE.CircleGeometry(pe.r, 48), new THREE.MeshBasicMaterial({ color: '#2fae66', transparent: true, opacity: 0.28, depthWrite: false }));
peDisc.rotation.x = -Math.PI / 2; peDisc.position.set(pe.p[0], 0.12, pe.p[2]);
const peRing = new THREE.Mesh(new THREE.RingGeometry(pe.r - 0.25, pe.r, 64), new THREE.MeshBasicMaterial({ color: '#1f8a4c' }));
peRing.rotation.x = -Math.PI / 2; peRing.position.set(pe.p[0], 0.13, pe.p[2]);
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2), new THREE.MeshStandardMaterial({ color: '#555' }));
pole.position.set(pe.p[0] + pe.r - 0.6, 1.6, pe.p[2]);
const peSign = textSprite('PUNTO DE ENCUENTRO', { color: '#ffffff', bg: '#1f8a4c', size: 48, scale: 0.022 });
peSign.position.set(pe.p[0] + pe.r - 0.6, 3.8, pe.p[2]);
scene.add(peDisc, peRing, pole, peSign);

// ---------- Personajes ----------
const player = new THREE.Group();
scene.add(player);
let playerAv = null, playerCfg = null;
function setPlayerAvatar(cfg) {
  if (playerAv) { player.remove(playerAv); disposeAvatar(playerAv); }
  playerCfg = cfg; playerAv = buildAvatar(cfg); player.add(playerAv);
}
setPlayerAvatar(cargarGuardado() || aleatorio());

const npcs = zona.npcs.map(n => {
  const g = new THREE.Group();
  g.add(buildAvatar({ estatura: 3, complexion: 1, piel: 6, pelo: 9, colorPelo: 0, ojos: 2, boca: 1, superior: 1, colorSuperior: 11, inferior: 1, colorInferior: 0,
    calzado: 1, colorCalzado: 14, cabeza: 5, rol: 1, equipo: 2, colorEquipo: 7 }));
  g.position.set(n.p[0], 0, n.p[2]);
  const label = textSprite(n.nombre, { size: 40, scale: 0.011 }); label.position.set(0, 2.35, 0); g.add(label);
  scene.add(g);
  colliders.push({ poly: [[n.p[0] - 0.4, n.p[2] - 0.4], [n.p[0] + 0.4, n.p[2] - 0.4], [n.p[0] + 0.4, n.p[2] + 0.4], [n.p[0] - 0.4, n.p[2] + 0.4]],
    minX: n.p[0] - 0.4, maxX: n.p[0] + 0.4, minZ: n.p[2] - 0.4, maxZ: n.p[2] + 0.4, h: 2 });
  return { ...n, g, av: g.children[0] };
});

// ---------- Vecinos generados con el mismo sistema de avatar ----------
let vseed = 20261120; const vrng = () => (vseed = (vseed * 16807) % 2147483647) / 2147483647;
const vecinos = [];
for (let tries = 0; vecinos.length < 16 && tries < 600; tries++) {
  const x = -78 + vrng() * 120, z = -22 + vrng() * 95;
  if (insideCollider(x, 1, z) || insideCollider(x + 0.8, 1, z) || insideCollider(x, 1, z + 0.8)) continue;
  if (arboles.some(a => Math.hypot(a.x - x, a.z - z) < 1.6)) continue;
  if (Math.hypot(x - zona.spawn.p[0], z - zona.spawn.p[2]) < 6 || npcs.some(n => Math.hypot(x - n.p[0], z - n.p[2]) < 4)) continue;
  if (vecinos.some(v => Math.hypot(v.x - x, v.z - z) < 5)) continue;
  const av = buildAvatar(aleatorio(vrng)); av.position.set(x, 0, z); av.rotation.y = vrng() * Math.PI * 2;
  scene.add(av);
  colliders.push({ circle: true, x, z, r: 0.35, minX: x - 0.35, maxX: x + 0.35, minZ: z - 0.35, maxZ: z + 0.35, h: 1.8 });
  vecinos.push({ x, z, av, off: vrng() * 10, saluda: 0 });
}

// ---------- Estado de juego ----------
const st = {
  started: false, finished: false, paused: true,
  pos: new THREE.Vector3(zona.spawn.p[0], 0, zona.spawn.p[2]), vel: new THREE.Vector3(), yaw: zona.spawn.yaw, face: zona.spawn.yaw,
  grounded: true, coyote: 0, buffer: 0,
  camYaw: zona.spawn.yaw + Math.PI, camPitch: 0.38, camDist: 9,
  time: 0, score: 0, registradas: new Set(), nativas: 0, raras: 0,
  hold: 0, holdTarget: -1, dialog: null, ficha: null, muted: false,
};
const nativeGuided = new Set(muestras.map(m => m.esp));
const totalNativasZona = new Set(arboles.filter(a => especies[a.esp].nativa).map(a => a.esp)).size;

// ---------- Entrada ----------
const keys = new Set();
const input = { x: 0, z: 0, run: false, jump: false, act: false };
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  keys.add(e.code);
  if (e.code === 'Space') { st.buffer = MOV.buffer; e.preventDefault(); }
  if (e.code === 'KeyE' || e.code === 'Enter') onActionPress();
  if (e.code === 'KeyH') toggleHerbario();
  if (e.code === 'KeyM') toggleMute();
});
addEventListener('keyup', (e) => keys.delete(e.code));

// Puntero: arrastrar para girar la cámara; en táctil, mitad izquierda = joystick.
const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
const look = { id: null, x: 0, y: 0 };
const joyEl = $('joy'), joyKnob = $('joy-knob');
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.45 && joy.id === null) {
    Object.assign(joy, { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 });
    joyEl.style.left = (e.clientX - 60) + 'px'; joyEl.style.top = (e.clientY - 60) + 'px'; joyEl.classList.add('on');
  } else if (look.id === null) {
    Object.assign(look, { id: e.pointerId, x: e.clientX, y: e.clientY });
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId === joy.id) {
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const L = Math.hypot(dx, dy), R = 50;
    if (L > R) { dx *= R / L; dy *= R / L; }
    joy.x = dx / R; joy.y = dy / R;
    joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  } else if (e.pointerId === look.id) {
    const k = e.pointerType === 'touch' ? 0.006 : 0.005;
    st.camYaw -= (e.clientX - look.x) * k;
    st.camPitch = clamp(st.camPitch + (e.clientY - look.y) * k, 0.08, 1.25);
    look.x = e.clientX; look.y = e.clientY;
  }
});
const endPointer = (e) => {
  if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; joyKnob.style.transform = ''; joyEl.classList.remove('on'); }
  if (e.pointerId === look.id) look.id = null;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => { st.camDist = clamp(st.camDist + e.deltaY * 0.01, 4, 22); e.preventDefault(); }, { passive: false });

const btnJump = $('btn-jump'), btnAct = $('btn-act');
let actHeld = false;
btnJump.addEventListener('pointerdown', (e) => { e.preventDefault(); st.buffer = MOV.buffer; });
btnAct.addEventListener('pointerdown', (e) => { e.preventDefault(); actHeld = true; onActionPress(); });
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) btnAct.addEventListener(ev, () => { actHeld = false; });
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');

// ---------- Audio (Web Audio, sin archivos) ----------
let actx = null;
function beep(freqs, dur = 0.12, type = 'sine', gain = 0.12) {
  if (st.muted) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    let t = actx.currentTime;
    for (const f of freqs) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur); t += dur * 0.8;
    }
  } catch (e) { /* sin audio */ }
}
function toggleMute() { st.muted = !st.muted; $('btn-mute').textContent = st.muted ? 'Sonido: no' : 'Sonido: sí'; }
$('btn-mute').addEventListener('click', toggleMute);

// ---------- Colisiones ----------
function resolveCollisions(p) {
  const r = MOV.radius;
  for (const c of colliders) {
    if (p.x < c.minX - r || p.x > c.maxX + r || p.z < c.minZ - r || p.z > c.maxZ + r) continue;
    if (p.y > c.h - 0.05) continue;
    if (c.circle) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), R = c.r + r; if (d < R && d > 1e-6) { p.x = c.x + dx / d * R; p.z = c.z + dz / d * R; } continue; }
    const poly = c.poly; let best = Infinity, cx = 0, cz = 0;
    for (let i = 0; i < poly.length; i++) {
      const [ax, az] = poly[i], [bx, bz] = poly[(i + 1) % poly.length];
      const dx = bx - ax, dz = bz - az; const L2 = dx * dx + dz * dz || 1;
      const t = clamp(((p.x - ax) * dx + (p.z - az) * dz) / L2, 0, 1);
      const qx = ax + t * dx, qz = az + t * dz; const d = (p.x - qx) ** 2 + (p.z - qz) ** 2;
      if (d < best) { best = d; cx = qx; cz = qz; }
    }
    const d = Math.sqrt(best);
    if (pointInPoly(p.x, p.z, poly)) {
      const nx = (cx - p.x) / (d || 1), nz = (cz - p.z) / (d || 1);
      p.x = cx + nx * r; p.z = cz + nz * r;
    } else if (d < r) {
      const nx = (p.x - cx) / (d || 1), nz = (p.z - cz) / (d || 1);
      p.x = cx + nx * r; p.z = cz + nz * r;
    }
  }
  // Troncos de árboles grandes
  for (const a of arboles) {
    if (a.h < 3) continue;
    const dx = p.x - a.x, dz = p.z - a.z, R = r + a.trunkR;
    const d2 = dx * dx + dz * dz;
    if (d2 < R * R && d2 > 1e-6) { const d = Math.sqrt(d2); p.x = a.x + dx / d * R; p.z = a.z + dz / d * R; }
  }
  p.x = clamp(p.x, B.minX, B.maxX); p.z = clamp(p.z, B.minZ, B.maxZ);
}

// ---------- Interacción: registrar muestras, hablar ----------
function nearestTree() {
  let best = -1, bd = REACH;
  for (let i = 0; i < arboles.length; i++) {
    const a = arboles[i]; const d = Math.hypot(st.pos.x - a.x, st.pos.z - a.z) - a.trunkR;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function nearNpc() { return npcs.find(n => Math.hypot(st.pos.x - n.p[0], st.pos.z - n.p[2]) < 3.2); }

function onActionPress() {
  if (!st.started || st.finished) return;
  if (st.ficha) { closeFicha(); return; }
  if (st.dialog) { advanceDialog(); return; }
  const n = nearNpc();
  if (n) { openDialog(n); return; }
}
function actionHeld() { return keys.has('KeyE') || actHeld; }

function openDialog(n) { st.dialog = { n, i: 0 }; showDialog(); }
function showDialog() {
  const { n, i } = st.dialog;
  $('dialog-name').textContent = n.nombre;
  $('dialog-text').textContent = n.dice[i].es;
  $('dialog-next').textContent = i < n.dice.length - 1 ? 'Siguiente (E)' : 'Cerrar (E)';
  $('dialog').classList.add('on');
}
function advanceDialog() {
  st.dialog.i++;
  if (st.dialog.i >= st.dialog.n.dice.length) { st.dialog = null; $('dialog').classList.remove('on'); return; }
  showDialog();
}
$('dialog').addEventListener('click', () => { if (st.dialog) advanceDialog(); });

function registrar(i) {
  const a = arboles[i]; const esp = especies[a.esp];
  const nueva = !st.registradas.has(a.esp);
  let puntos = 0;
  if (nueva) {
    st.registradas.add(a.esp);
    if (esp.nativa) {
      st.nativas++; if (esp.rara) st.raras++;
      puntos = esp.rara ? zona.puntaje.muestraRara : zona.puntaje.muestra;
      st.score += puntos;
      for (const m of muestras) if (m.esp === a.esp && !m.done) { m.done = true; m.ring.material.color.set('#9aa3a8'); m.ring.material.opacity = 0.35; m.icon.visible = false; }
      if ([...nativeGuided].every(s => st.registradas.has(s)) && !st.coleccion) {
        st.coleccion = true; st.score += zona.puntaje.coleccionCompleta;
        toast(`Colección completa: +${zona.puntaje.coleccionCompleta}`);
      }
    }
  }
  beep(esp.nativa ? (nueva ? [660, 880, 1175] : [660]) : [440, 330], 0.12, 'triangle');
  openFicha(esp, nueva, puntos);
  updateHud();
}
function openFicha(esp, nueva, puntos) {
  st.ficha = esp;
  $('ficha-tag').textContent = esp.nativa ? (esp.rara ? 'Nativa · rara' : 'Nativa') : (esp.riesgo ? 'Introducida · árbol alto' : 'Introducida');
  $('ficha-tag').className = 'tag ' + (esp.nativa ? (esp.rara ? 'rara' : 'nativa') : (esp.riesgo ? 'riesgo' : 'intro'));
  $('ficha-name').textContent = esp.comun;
  $('ficha-sci').textContent = esp.cientifico || esp.censo;
  $('ficha-text').textContent = esp.ficha;
  $('ficha-data').textContent = `En esta zona hay ${esp.enZona} ${esp.enZona === 1 ? 'árbol' : 'árboles'} de esta especie; altura media ${String(esp.alturaMedia).replace('.', ',')} m (censo del arbolado).`;
  $('ficha-points').textContent = !nueva ? 'Ya la tenías en tu herbario.' : (puntos ? `+${puntos} puntos · nueva muestra en tu herbario` : 'Registrada en tu herbario (no suma puntos).');
  $('ficha').classList.add('on');
}
function closeFicha() { st.ficha = null; $('ficha').classList.remove('on'); }
$('ficha-close').addEventListener('click', closeFicha);

function toggleHerbario() {
  const el = $('herbario');
  if (el.classList.contains('on')) { el.classList.remove('on'); return; }
  const list = [...st.registradas].map(i => especies[i]).sort((a, b) => (b.nativa - a.nativa) || a.comun.localeCompare(b.comun));
  $('herbario-list').innerHTML = list.length ? list.map(e => `<li><b>${e.comun}</b> <span class="tag ${e.nativa ? (e.rara ? 'rara' : 'nativa') : 'intro'}">${e.nativa ? (e.rara ? 'rara' : 'nativa') : 'introducida'}</span></li>`).join('') : '<li>Aún no has registrado muestras.</li>';
  const faltan = [...nativeGuided].filter(s => !st.registradas.has(s)).map(s => especies[s].comun);
  $('herbario-faltan').textContent = faltan.length ? `Por encontrar (anillos en el mapa): ${faltan.join(', ')}.` : 'Encontraste todas las especies guiadas.';
  el.classList.add('on');
}
$('btn-herbario').addEventListener('click', toggleHerbario);
$('herbario-close').addEventListener('click', toggleHerbario);

let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); toastT = 2.6; }

// ---------- HUD y minimapa ----------
function fmtTime(s) { const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${String(r).padStart(2, '0')}`; }
function updateHud() {
  $('hud-muestras').textContent = `${st.nativas}`;
  $('hud-meta').textContent = `/ ${zona.meta.muestrasMinimas}`;
  $('hud-raras').textContent = `${st.raras} / ${muestras.filter(m => m.rara).length}`;
  $('hud-score').textContent = st.score;
}
const mini = $('minimap'), mctx = mini.getContext('2d');
const MW = B.maxX - B.minX, MH = B.maxZ - B.minZ;
const mBase = document.createElement('canvas');
function drawMiniBase() {
  const s = mini.width / Math.max(MW, MH);
  mBase.width = mini.width; mBase.height = mini.height;
  const c = mBase.getContext('2d');
  const tx = (x) => (x - B.minX) * s, tz = (z) => (z - B.minZ) * s;
  c.fillStyle = '#e9e4d6'; c.fillRect(0, 0, mBase.width, mBase.height);
  const poly = (p, fill) => { c.beginPath(); p.forEach(([x, z], i) => i ? c.lineTo(tx(x), tz(z)) : c.moveTo(tx(x), tz(z))); c.closePath(); c.fillStyle = fill; c.fill(); };
  for (const a of zona.areas) poly(a.poly, AREA_COLOR[a.tipo] || '#d7d0bf');
  c.lineCap = 'round';
  for (const v of zona.vias) { c.strokeStyle = /footway|cycleway|steps/.test(v.tipo) ? '#fff6e6' : '#8a8c90'; c.lineWidth = Math.max(1, v.ancho * s); c.beginPath(); v.linea.forEach(([x, z], i) => i ? c.lineTo(tx(x), tz(z)) : c.moveTo(tx(x), tz(z))); c.stroke(); }
  for (const e of zona.edificios) poly(e.poly, '#b07a62');
  mini._s = s; mini._tx = tx; mini._tz = tz;
}
function drawMini() {
  const { _tx: tx, _tz: tz } = mini;
  mctx.drawImage(mBase, 0, 0);
  for (const m of muestras) {
    if (m.done) continue; const a = arboles[m.arbol];
    mctx.fillStyle = m.rara ? '#e3a400' : '#1f9a52'; mctx.beginPath(); mctx.arc(tx(a.x), tz(a.z), m.rara ? 4.5 : 3.5, 0, Math.PI * 2); mctx.fill();
    mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.2; mctx.stroke();
  }
  mctx.strokeStyle = '#1f8a4c'; mctx.lineWidth = 2.5; mctx.beginPath(); mctx.arc(tx(pe.p[0]), tz(pe.p[2]), 6, 0, Math.PI * 2); mctx.stroke();
  // Jugador: flecha
  const px = tx(st.pos.x), pz = tz(st.pos.z);
  mctx.save(); mctx.translate(px, pz); mctx.rotate(-st.face + Math.PI);
  mctx.fillStyle = '#1f5fd1'; mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.5;
  mctx.beginPath(); mctx.moveTo(0, -7); mctx.lineTo(5, 5); mctx.lineTo(0, 2.5); mctx.lineTo(-5, 5); mctx.closePath(); mctx.fill(); mctx.stroke();
  mctx.restore();
}

// ---------- Pistas por cercanía ----------
function updateHint() {
  let txt = '';
  if (!st.dialog && !st.ficha) {
    const tIdx = nearestTree();
    if (tIdx >= 0) {
      const esp = especies[arboles[tIdx].esp];
      const ya = st.registradas.has(arboles[tIdx].esp);
      txt = `${ya ? 'Ya registraste' : 'Mantén Registrar (E) para tomar la muestra de'} este árbol${ya ? ': ' + esp.comun : ''}`;
    } else if (nearNpc()) {
      txt = 'Pulsa E para hablar con la brigadista';
    } else {
      for (const p of zona.pistas) if (Math.hypot(st.pos.x - p.p[0], st.pos.z - p.p[2]) < p.r) { txt = p.texto.es; break; }
    }
  }
  const el = $('hint');
  if (el.textContent !== txt) el.textContent = txt;
  el.classList.toggle('on', !!txt);
}

// ---------- Fin de la zona ----------
function checkFinish() {
  if (st.finished) return;
  const d = Math.hypot(st.pos.x - pe.p[0], st.pos.z - pe.p[2]);
  if (d > pe.r) { st.warnedPe = false; return; }
  if (st.nativas < zona.meta.muestrasMinimas) {
    if (!st.warnedPe) { toast(`Te faltan ${zona.meta.muestrasMinimas - st.nativas} muestras nativas para reportarte.`); beep([330], 0.15); st.warnedPe = true; }
    return;
  }
  st.finished = true;
  const llegada = zona.puntaje.llegada;
  const bono = clamp(Math.round((zona.par - st.time) * zona.puntaje.bonoPorSegundo), 0, zona.puntaje.bonoMax);
  st.score += llegada + bono;
  const guiadas = [...nativeGuided].filter(s => st.registradas.has(s)).length;
  const medalla = guiadas >= nativeGuided.size ? 'Oro' : guiadas >= 10 ? 'Plata' : 'Bronce';
  $('end-medal').textContent = `Medalla de ${medalla}`;
  $('end-medal').className = 'medal ' + medalla.toLowerCase();
  $('end-stats').innerHTML = `
    <li>Muestras nativas: <b>${st.nativas}</b> (raras: ${st.raras})</li>
    <li>Especies en tu herbario: <b>${st.registradas.size}</b> de ${new Set(arboles.map(a => a.esp)).size} que hay en la zona</li>
    <li>Tiempo: <b>${fmtTime(st.time)}</b> (objetivo ${fmtTime(zona.par)}) · bono +${bono}</li>
    <li>Llegada al punto de encuentro: +${llegada}</li>
    <li>Puntaje total: <b>${st.score}</b></li>`;
  $('end-title').textContent = playerCfg.nombre ? `¡Inventario completo, ${playerCfg.nombre}!` : '¡Inventario completo!';
  $('end').classList.add('on');
  updateHud(); $('hint').classList.remove('on');
  beep([523, 659, 784, 1046], 0.16, 'triangle');
}

// ---------- Cámara: acercarla si hay un edificio detrás ----------
function insideCollider(x, y, z) {
  for (const c of colliders) {
    if (x < c.minX || x > c.maxX || z < c.minZ || z > c.maxZ || y > c.h + 0.3) continue;
    if (c.circle ? Math.hypot(x - c.x, z - c.z) < c.r : pointInPoly(x, z, c.poly)) return true;
  }
  return false;
}
function cameraClear(t, off, dist) {
  const steps = Math.ceil(dist / 0.6);
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    if (insideCollider(t.x + off.x * k, t.y + off.y * k, t.z + off.z * k)) return Math.max(1.2, dist * k - 0.8);
  }
  return dist;
}

// ---------- Bucle principal ----------
const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3(), tmp = new THREE.Vector3();
let last = performance.now(), walkPhase = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (editor.render(dt, now / 1000)) { requestAnimationFrame(frame); return; }
  renderer.setViewport(0, 0, innerWidth, innerHeight);
  const active = st.started && !st.finished && !st.ficha && !st.dialog && !editor.open;
  if (st.started && !st.finished) st.time += dt;

  // Entrada → dirección relativa a la cámara
  let ix = 0, iz = 0;
  if (active) {
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    if (joy.id !== null) { ix += joy.x; iz += joy.y; }
  }
  const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
  const running = keys.has('ShiftLeft') || keys.has('ShiftRight') || (joy.id !== null && Math.hypot(joy.x, joy.y) > 0.95);
  const speed = running ? MOV.run : MOV.walk;
  const cy = Math.cos(st.camYaw), sy = Math.sin(st.camYaw);
  // Adelante = alejándose de la cámara
  const wx = (ix * cy + iz * sy) * speed, wz = (-ix * sy + iz * cy) * speed;
  const acc = (st.grounded ? MOV.accel : MOV.air) * dt;
  st.vel.x += clamp(wx - st.vel.x, -acc, acc);
  st.vel.z += clamp(wz - st.vel.z, -acc, acc);
  if (il > 0.1) st.face = Math.atan2(st.vel.x, st.vel.z);

  // Salto con coyote time y buffer
  st.coyote = st.grounded ? MOV.coyote : Math.max(0, st.coyote - dt);
  st.buffer = Math.max(0, st.buffer - dt);
  if (active && st.buffer > 0 && st.coyote > 0 && !playerCfg.movilidad) { st.vel.y = MOV.jumpV; st.grounded = false; st.coyote = 0; st.buffer = 0; beep([520], 0.06, 'square', 0.04); }
  st.vel.y -= MOV.gravity * dt;
  st.pos.addScaledVector(st.vel, dt);
  if (st.pos.y <= 0) { st.pos.y = 0; st.vel.y = 0; st.grounded = true; } else st.grounded = false;
  resolveCollisions(st.pos);

  // Registrar (mantener)
  const tIdx = active ? nearestTree() : -1;
  if (tIdx >= 0 && actionHeld() && !nearNpc()) {
    if (st.holdTarget !== tIdx) { st.holdTarget = tIdx; st.hold = 0; }
    st.hold += dt;
    if (st.hold >= HOLD_TIME) { st.hold = 0; st.holdTarget = -1; keys.delete('KeyE'); actHeld = false; registrar(tIdx); }
  } else { st.hold = Math.max(0, st.hold - dt * 2); if (st.hold === 0) st.holdTarget = -1; }
  const prog = $('progress');
  prog.style.setProperty('--p', (st.hold / HOLD_TIME * 100).toFixed(1));
  prog.classList.toggle('on', st.hold > 0.02);

  // Personaje
  player.position.copy(st.pos);
  let dy = st.face - player.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  player.rotation.y += dy * Math.min(1, dt * 12);
  const hs = Math.hypot(st.vel.x, st.vel.z);
  walkPhase += hs * dt * 2.3; st.dist = (st.dist || 0) + hs * dt;
  setPose(playerAv, { t: now / 1000, speed: hs, phase: walkPhase, aire: !st.grounded, dist: st.dist });

  // NPC mira al jugador si está cerca
  for (const n of npcs) { const d = Math.hypot(st.pos.x - n.p[0], st.pos.z - n.p[2]); if (d < 12) n.g.rotation.y = Math.atan2(st.pos.x - n.p[0], st.pos.z - n.p[2]); setPose(n.av, { t: now / 1000 + 3, saludo: d < 6 && !st.dialog && (now / 1000) % 6 < 1.5 }); }
  for (const v of vecinos) {
    const d = Math.hypot(st.pos.x - v.x, st.pos.z - v.z);
    if (d < 7 && v.saluda <= 0 && !v.yaSaludo) { v.saluda = 1.8; v.yaSaludo = true; }
    if (d > 14) v.yaSaludo = false;
    v.saluda -= dt;
    if (d < 9) { const want = Math.atan2(st.pos.x - v.x, st.pos.z - v.z); let dd = want - v.av.rotation.y; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); v.av.rotation.y += dd * Math.min(1, dt * 3); }
    if (d < 60) setPose(v.av, { t: now / 1000 + v.off, saludo: v.saluda > 0 });
  }

  // Muestras: anillos e íconos animados
  const t = now / 1000;
  for (const m of muestras) {
    if (m.done) continue;
    const k = 1 + Math.sin(t * 3 + m.arbol) * 0.08; m.ring.scale.set(k, k, k);
    m.icon.position.y = m.iy + Math.sin(t * 2 + m.arbol) * 0.25;
  }
  peRing.material.color.setHSL(0.4, 0.6, st.nativas >= zona.meta.muestrasMinimas ? 0.35 + Math.sin(t * 4) * 0.1 : 0.32);

  // Cámara en órbita detrás del jugador
  camTarget.set(st.pos.x, st.pos.y + 1.5, st.pos.z);
  const cp = Math.cos(st.camPitch);
  tmp.set(Math.sin(st.camYaw) * cp, Math.sin(st.camPitch), Math.cos(st.camYaw) * cp).multiplyScalar(st.camDist);
  camPos.copy(camTarget).add(tmp);
  const free = cameraClear(camTarget, tmp, st.camDist);
  if (free < st.camDist) camPos.copy(camTarget).addScaledVector(tmp, free / st.camDist);
  if (camPos.y < 0.6) camPos.y = 0.6;
  camera.position.lerp(camPos, st.started ? Math.min(1, dt * 10) : 1);
  camera.lookAt(camTarget);

  // Sombra que sigue al jugador
  sun.position.copy(st.pos).addScaledVector(SUN_DIR, 110);
  sun.target.position.copy(st.pos);

  if (st.started && !st.finished) { updateHint(); checkFinish(); }
  $('hud-time').textContent = fmtTime(st.time);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('on'); }
  drawMini();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 72 : 60; camera.updateProjectionMatrix();
  if (w < h && !st.started) st.camDist = 11;
  const m = Math.round(Math.min(190, Math.max(120, Math.min(w, h) * 0.26)));
  mini.width = m; mini.height = Math.round(m * MH / MW); drawMiniBase();
}
addEventListener('resize', resize);
resize();

// ---------- Inicio ----------
$('intro-credits').innerHTML = zona.creditos.map(c => `<li>${c}</li>`).join('');
$('end-credits').innerHTML = zona.creditos.map(c => `<li>${c}</li>`).join('');
$('intro-count').textContent = `${zona.edificios.length} edificios del catastro · ${arboles.length} árboles reales de ${new Set(arboles.map(a => a.esp)).size} especies · ${totalNativasZona} especies nativas por descubrir`;
const editor = createEditor({ renderer, onDone: (cfg) => {
  document.body.classList.remove('editing');
  setPlayerAvatar(cfg);
  const saludo = cfg.nombre ? `¡Hola, ${cfg.nombre}! ` : '¡Hola! ';
  npcs[0].dice[0] = { es: saludo + 'Hoy hacemos el inventario verde del Minuto de Dios con el Jardín Botánico.' };
  $('hud-name').textContent = cfg.nombre || 'Tu personaje';
  if (!st.started) { st.started = true; st.paused = false; beep([523, 784], 0.1); openDialog(npcs[0]); }
} });
function openEditor() { document.body.classList.add('editing'); editor.show(playerCfg); }
$('btn-start').addEventListener('click', () => { $('intro').classList.remove('on'); openEditor(); });
$('btn-avatar').addEventListener('click', () => { if (!st.finished && !st.ficha) openEditor(); });
$('btn-again').addEventListener('click', () => location.reload());
updateHud();
requestAnimationFrame(frame);

// Gancho de pruebas
window.__game = { st, zona, muestras, registrar, nearestTree, editor, vecinos, get playerCfg() { return playerCfg; } };
