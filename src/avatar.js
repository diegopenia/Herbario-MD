import * as THREE from 'three';

// =====================================================================
// Avatar por piezas: cuerpo articulado + cara + pelo + ropa + accesorios.
// Todo se construye con primitivas, sin modelos externos.
// =====================================================================

// ---------- Paletas ----------
export const PIEL = [
  { n: 'Porcelana', c: '#f6d7c3' }, { n: 'Clara', c: '#eec1a2' }, { n: 'Clara cálida', c: '#e0a982' }, { n: 'Trigueña clara', c: '#c98e66' },
  { n: 'Trigueña', c: '#b5774f' }, { n: 'Canela', c: '#9a5f3d' }, { n: 'Morena', c: '#7d4a2e' }, { n: 'Morena oscura', c: '#633a24' },
  { n: 'Ébano', c: '#4e2d1c' }, { n: 'Ébano profundo', c: '#3b2116' },
];
export const PELO_COLOR = [
  { n: 'Negro', c: '#1c1612' }, { n: 'Castaño oscuro', c: '#3b2a1e' }, { n: 'Castaño', c: '#5a3c27' }, { n: 'Castaño claro', c: '#7a5232' },
  { n: 'Rubio oscuro', c: '#9c7a4a' }, { n: 'Rubio', c: '#d1aa68' }, { n: 'Pelirrojo', c: '#a2452a' }, { n: 'Canoso', c: '#9e9e9e' },
  { n: 'Blanco', c: '#ececec' }, { n: 'Azul', c: '#2f6bd9' }, { n: 'Rosado', c: '#e26aa8' }, { n: 'Verde', c: '#3fae6b' }, { n: 'Morado', c: '#7d4fc2' },
];
export const ROPA_COLOR = [
  { n: 'Azul marino', c: '#1f2a44' }, { n: 'Azul', c: '#3d7bd9' }, { n: 'Celeste', c: '#7cc4f2' }, { n: 'Verde', c: '#2f9e5b' },
  { n: 'Verde lima', c: '#a7d36b' }, { n: 'Amarillo', c: '#f2c230' }, { n: 'Naranja', c: '#f08a24' }, { n: 'Rojo', c: '#d6453d' },
  { n: 'Vinotinto', c: '#8e2742' }, { n: 'Rosado', c: '#e781b0' }, { n: 'Morado', c: '#8a5ac2' }, { n: 'Blanco', c: '#f4f4f2' },
  { n: 'Gris claro', c: '#c9c9c9' }, { n: 'Gris', c: '#5b5f66' }, { n: 'Negro', c: '#1d1d1f' }, { n: 'Café', c: '#8b5e3c' }, { n: 'Beige', c: '#d9c4a3' },
];
export const OJOS_COLOR = [
  { n: 'Café oscuro', c: '#2b1a10' }, { n: 'Café', c: '#5a3a1e' }, { n: 'Miel', c: '#a8742c' }, { n: 'Verde', c: '#4f7d3a' },
  { n: 'Azul', c: '#3f78b5' }, { n: 'Gris', c: '#7b858c' },
];

// ---------- Opciones (lo que muestra el editor) ----------
const L = (...n) => n.map((x, i) => ({ id: i, n: x }));
export const OPCIONES = {
  estatura: L('Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'),
  complexion: L('Delgada', 'Media', 'Robusta'),
  piel: PIEL.map((p, i) => ({ id: i, n: p.n, c: p.c })),
  movilidad: L('Caminando', 'Silla de ruedas'),
  ojos: L('Redondos', 'Grandes', 'Alegres', 'Almendrados'),
  colorOjos: OJOS_COLOR.map((p, i) => ({ id: i, n: p.n, c: p.c })),
  cejas: L('Normales', 'Gruesas', 'Finas', 'Arqueadas'),
  boca: L('Sonrisa', 'Gran sonrisa', 'Tranquila', 'Sorpresa'),
  detalle: L('Ninguno', 'Pecas', 'Rubor', 'Lunar', 'Curita'),
  barba: L('Sin barba', 'Bigote', 'Barba corta', 'Barba completa', 'Chivera'),
  pelo: L('Corto', 'Rapado', 'Calvo', 'Con flequillo', 'Afro', 'Rizos cortos', 'Bob', 'Largo liso', 'Largo ondulado', 'Cola de caballo', 'Dos colitas', 'Moño', 'Dos moños', 'Trenzas', 'Cresta'),
  colorPelo: PELO_COLOR.map((p, i) => ({ id: i, n: p.n, c: p.c })),
  superior: L('Camiseta', 'Manga larga', 'Buzo con capota', 'Chaqueta', 'Uniforme escolar', 'Ruana', 'Camiseta a rayas', 'Overol', 'Vestido'),
  colorSuperior: ROPA_COLOR.map((p, i) => ({ id: i, n: p.n, c: p.c })),
  inferior: L('Jean', 'Pantalón', 'Sudadera', 'Shorts', 'Falda', 'Falda escolar', 'Leggings'),
  colorInferior: ROPA_COLOR.map((p, i) => ({ id: i, n: p.n, c: p.c })),
  calzado: L('Tenis', 'Botas', 'Zapatos colegiales', 'Sandalias', 'Botas de caucho'),
  colorCalzado: ROPA_COLOR.map((p, i) => ({ id: i, n: p.n, c: p.c })),
  cabeza: L('Nada', 'Gorra', 'Gorra al revés', 'Sombrero vueltiao', 'Gorro de lana', 'Casco de brigada', 'Balaca', 'Audífonos'),
  colorCabeza: ROPA_COLOR.map((p, i) => ({ id: i, n: p.n, c: p.c })),
  gafas: L('Sin gafas', 'Redondas', 'Cuadradas', 'De sol', 'Deportivas'),
  tapabocas: L('Sin tapabocas', 'Con tapabocas'),
  equipo: L('Nada', 'Mochila de emergencia', 'Mochila y pito', 'Linterna', 'Botiquín'),
  colorEquipo: ROPA_COLOR.map((p, i) => ({ id: i, n: p.n, c: p.c })),
  rol: L('Sin rol', 'Brigadista', 'Líder de fila', 'Apoyo a compañeros'),
};
export const ROLES_INFO = [
  '', 'Chaleco naranja: guía la evacuación y revisa que nadie se quede.',
  'Chaleco amarillo: va adelante de su fila y lleva el conteo.',
  'Brazalete verde: acompaña a quien necesita ayuda o se asusta.',
];

export const DEFAULT = {
  nombre: '', estatura: 2, complexion: 1, piel: 4, movilidad: 0, ojos: 0, colorOjos: 1, cejas: 0, boca: 0, detalle: 0, barba: 0,
  pelo: 0, colorPelo: 0, superior: 0, colorSuperior: 1, inferior: 0, colorInferior: 0, calzado: 0, colorCalzado: 11,
  cabeza: 0, colorCabeza: 7, gafas: 0, tapabocas: 0, equipo: 1, colorEquipo: 3, rol: 0,
};

export function combinaciones() { return Object.values(OPCIONES).reduce((a, o) => a * o.length, 1); }

// Aleatorio con sentido: colores de pelo naturales casi siempre, barba poco frecuente, etc.
export function aleatorio(rng = Math.random, base = {}) {
  const pick = (k) => Math.floor(rng() * OPCIONES[k].length);
  const c = { ...DEFAULT };
  for (const k of Object.keys(OPCIONES)) c[k] = pick(k);
  c.colorPelo = rng() < 0.88 ? Math.floor(rng() * 9) : 9 + Math.floor(rng() * 4);
  c.barba = rng() < 0.75 ? 0 : 1 + Math.floor(rng() * 4);
  c.detalle = rng() < 0.6 ? 0 : c.detalle;
  c.cabeza = rng() < 0.55 ? 0 : c.cabeza;
  c.gafas = rng() < 0.7 ? 0 : c.gafas;
  c.tapabocas = rng() < 0.9 ? 0 : 1;
  c.movilidad = rng() < 0.9 ? 0 : 1;
  c.rol = rng() < 0.7 ? 0 : c.rol;
  if (c.superior === 8) c.inferior = 4; // vestido + falda
  return { ...c, ...base };
}

// ---------- Texturas de tela (blancas para que el color las tiña) ----------
function tex(draw, rx = 1, ry = 1) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 64); draw(x);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t;
}
let TX = null;
function texturas() {
  if (TX) return TX;
  TX = {
    rayas: tex((x) => { x.fillStyle = '#8a8a8a'; for (let y = 0; y < 64; y += 16) x.fillRect(0, y, 64, 7); }, 1, 3),
    cuadros: tex((x) => { x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, 26, 64, 12); x.fillRect(26, 0, 12, 64); x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(0, 31, 64, 2); x.fillRect(31, 0, 2, 64); }, 4, 2),
    ruana: tex((x) => { x.fillStyle = 'rgba(0,0,0,0.22)'; for (let i = 0; i < 64; i += 16) x.fillRect(i, 0, 5, 64); x.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 8; i < 64; i += 16) x.fillRect(i, 0, 2, 64); }, 3, 1),
    jean: tex((x) => { for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`; x.fillRect(Math.random() * 64, Math.random() * 64, 2, 1); } }, 2, 2),
    reflectivo: tex((x) => { x.fillStyle = '#e8e8e8'; x.fillRect(0, 20, 64, 8); x.fillRect(0, 44, 64, 8); x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 28, 64, 2); }, 1, 1),
    sudadera: tex((x) => { x.fillStyle = '#e6e6e6'; x.fillRect(4, 0, 6, 64); }, 1, 1),
  };
  return TX;
}

// ---------- Construcción ----------
const mats = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(Object.keys(opts).map(k => k + (opts[k]?.uuid || opts[k])));
  if (!opts.map && mats.has(key)) return mats.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...opts });
  if (!opts.map) mats.set(key, m);
  return m;
}
const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 12);
const sphere = (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);
function add(parent, geo, material, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }
const pivot = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

const ESTATURA = [0.84, 0.92, 1, 1.06, 1.12];
const ANCHO = [0.86, 1, 1.2];

export function buildAvatar(cfgIn) {
  const c = { ...DEFAULT, ...cfgIn };
  const T = texturas();
  const H = ESTATURA[c.estatura] ?? 1, W = ANCHO[c.complexion] ?? 1;
  const skin = mat(PIEL[c.piel].c);
  const topC = ROPA_COLOR[c.colorSuperior].c, botC = ROPA_COLOR[c.colorInferior].c, shoeC = ROPA_COLOR[c.colorCalzado].c;
  const hairM = mat(PELO_COLOR[c.colorPelo].c, { roughness: 0.95 });

  // Qué cubre cada prenda
  const sup = c.superior;
  const mangaLarga = [1, 2, 3, 4, 5].includes(sup);
  let topMat = mat(topC);
  if (sup === 6) topMat = mat(topC, { map: T.rayas });
  if (sup === 4) topMat = mat('#f4f4f2'); // camisa blanca del uniforme
  const armTop = mangaLarga ? (sup === 4 ? mat(topC) : topMat) : skin;
  const inf = sup === 8 ? 4 : c.inferior; // el vestido lleva falda del mismo color
  const botColor = sup === 8 ? topC : botC;
  let legMat = mat(botColor, inf === 0 ? { map: T.jean } : inf === 2 ? { map: T.sudadera } : {});
  if (sup === 7) legMat = mat(topC); // overol
  const thighM = [3, 4, 5].includes(inf) ? skin : legMat;
  const shinM = [3, 4].includes(inf) ? skin : inf === 5 ? mat('#f4f4f2') : legMat;

  const root = new THREE.Group();
  root.userData.cfg = c;
  const scale = new THREE.Group(); scale.scale.setScalar(H); root.add(scale);
  const silla = c.movilidad === 1;

  const legLen = 0.78, thighL = 0.4, shinL = 0.36;
  const hips = pivot(scale, 0, silla ? 0.56 : legLen, 0);
  // Piernas
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = pivot(hips, s * 0.095 * W, 0, 0);
    add(hip, capsule(0.075 * W, thighL - 0.1), thighM, 0, -thighL / 2, 0);
    const knee = pivot(hip, 0, -thighL, 0);
    add(knee, capsule(0.062 * W, shinL - 0.08), shinM, 0, -shinL / 2, 0);
    const ankle = pivot(knee, 0, -shinL, 0);
    // Calzado
    const zc = c.calzado;
    const shoeCol = zc === 4 ? mat('#f2c230') : zc === 2 ? mat('#1d1d1f') : mat(shoeC);
    if (zc === 1 || zc === 4) add(ankle, new THREE.CylinderGeometry(0.075, 0.08, 0.2, 10), shoeCol, 0, 0.03, 0.01);
    if (zc === 3) { add(ankle, new THREE.BoxGeometry(0.11, 0.025, 0.24), mat('#8b5e3c'), 0, -0.04, 0.05); add(ankle, new THREE.BoxGeometry(0.11, 0.02, 0.03), shoeCol, 0, -0.02, 0.09); }
    else {
      add(ankle, new THREE.BoxGeometry(0.11, 0.08, 0.24), shoeCol, 0, -0.035, 0.05);
      if (zc === 0) add(ankle, new THREE.BoxGeometry(0.115, 0.025, 0.25), mat('#f4f4f2'), 0, -0.07, 0.05);
    }
    legs.push({ hip, knee });
  }
  // Falda
  if ([4, 5].includes(inf)) {
    const skirtMat = inf === 5 ? mat(botColor, { map: T.cuadros }) : mat(botColor);
    const sk = add(hips, new THREE.CylinderGeometry(0.17 * W, 0.26 * W, 0.34, 18, 1, true), skirtMat, 0, -0.12, 0);
    sk.material = sk.material.clone(); sk.material.side = THREE.DoubleSide;
  }
  // Torso
  const torso = pivot(hips, 0, 0, 0);
  const body = add(torso, capsule(0.16, 0.3), topMat, 0, 0.27, 0);
  body.scale.set(1.22 * W, 1, 0.82 * W);
  add(torso, capsule(0.13, 0.04), legMat, 0, 0.04, 0).scale.set(1.25 * W, 1, 0.85 * W); // cadera / cinturón
  if (sup === 4) { // uniforme: saco de color encima y corbata
    const v = add(torso, new THREE.CylinderGeometry(0.205 * W, 0.2 * W, 0.4, 16, 1, true), mat(topC, { side: THREE.DoubleSide }), 0, 0.27, 0); v.scale.z = 0.86;
    add(torso, new THREE.BoxGeometry(0.06, 0.2, 0.02), mat('#1f2a44'), 0, 0.36, 0.17 * W);
  }
  if (sup === 3) { // chaqueta abierta: franja de la camiseta interior
    add(torso, new THREE.BoxGeometry(0.1, 0.38, 0.02), mat('#f4f4f2'), 0, 0.29, 0.135 * W);
  }
  if (sup === 7) { // overol: peto y tirantes sobre camiseta blanca
    body.material = mat('#f4f4f2');
    add(torso, new THREE.BoxGeometry(0.26 * W, 0.24, 0.03), legMat, 0, 0.22, 0.13 * W);
    for (const s of [-1, 1]) add(torso, new THREE.BoxGeometry(0.04, 0.3, 0.3 * W), legMat, s * 0.1 * W, 0.36, 0);
  }
  if (sup === 2) { // capota
    const hood = add(torso, new THREE.TorusGeometry(0.13, 0.05, 8, 16), topMat, 0, 0.52, -0.06); hood.rotation.x = Math.PI / 2.4;
    add(torso, new THREE.BoxGeometry(0.2 * W, 0.1, 0.02), topMat, 0, 0.18, 0.135 * W);
  }
  if (sup === 5) { // ruana bogotana
    const r = add(torso, new THREE.CylinderGeometry(0.13, 0.42 * W, 0.42, 20, 1, true), mat(topC, { map: T.ruana, side: THREE.DoubleSide }), 0, 0.3, 0);
    r.scale.z = 0.7;
  }
  if (sup === 8) { // vestido: el torso y la falda del mismo color
    body.material = mat(topC);
  }
  // Chaleco o brazalete según el rol
  if (c.rol === 1 || c.rol === 2) {
    const vc = c.rol === 1 ? '#ff7a1a' : '#f2d40f';
    const vm = mat(vc, { map: T.reflectivo, side: THREE.DoubleSide });
    if (sup === 5) { const v = add(torso, new THREE.CylinderGeometry(0.15, 0.36 * W, 0.3, 20, 1, true), vm, 0, 0.36, 0); v.scale.z = 0.74; } // chaleco encima de la ruana
    else { const v = add(torso, new THREE.CylinderGeometry(0.215 * W, 0.21 * W, 0.36, 16, 1, true), vm, 0, 0.27, 0); v.scale.z = 0.88; }
  }
  // Brazos
  const shoulderY = 0.47, upperL = 0.27, foreL = 0.25;
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = pivot(torso, s * (0.2 * W + 0.05), shoulderY, 0);
    add(sh, capsule(0.055 * W, upperL - 0.08), armTop, 0, -upperL / 2, 0);
    const el = pivot(sh, 0, -upperL, 0);
    add(el, capsule(0.048 * W, foreL - 0.07), mangaLarga ? armTop : skin, 0, -foreL / 2, 0);
    const hand = pivot(el, 0, -foreL, 0);
    add(hand, sphere(0.05, 10, 8), skin, 0, -0.02, 0);
    if (c.rol === 3 && s === -1) add(sh, new THREE.CylinderGeometry(0.065 * W, 0.065 * W, 0.07, 12), mat('#2fae66'), 0, -0.1, 0);
    arms.push({ sh, el, hand });
  }
  // Equipo
  if (c.equipo === 1 || c.equipo === 2) {
    const bag = add(torso, new THREE.BoxGeometry(0.3 * W, 0.36, 0.16), mat(ROPA_COLOR[c.colorEquipo].c), 0, 0.27, -0.2 * W);
    add(bag, new THREE.BoxGeometry(0.22 * W, 0.12, 0.04), mat('#ffffff'), 0, -0.06, -0.09); // bolsillo
    add(bag, new THREE.BoxGeometry(0.08, 0.025, 0.045), mat('#d6453d'), 0, -0.06, -0.11);   // cruz roja
    add(bag, new THREE.BoxGeometry(0.025, 0.08, 0.045), mat('#d6453d'), 0, -0.06, -0.11);
    for (const s of [-1, 1]) add(torso, new THREE.BoxGeometry(0.035, 0.36, 0.03), mat('#333'), s * 0.11 * W, 0.3, 0.14 * W);
    if (c.equipo === 2) { // pito colgado
      add(torso, new THREE.TorusGeometry(0.07, 0.006, 6, 20), mat('#222'), 0, 0.42, 0.1).rotation.x = Math.PI / 2.3;
      add(torso, new THREE.CylinderGeometry(0.018, 0.018, 0.06, 8), mat('#f2c230'), 0, 0.33, 0.15 * W).rotation.z = Math.PI / 2;
    }
  }
  if (c.equipo === 3) { // linterna en la mano derecha
    const f = add(arms[1].hand, new THREE.CylinderGeometry(0.025, 0.035, 0.16, 10), mat('#2b2b2b'), 0, -0.04, 0.06); f.rotation.x = Math.PI / 2;
    add(arms[1].hand, new THREE.CircleGeometry(0.033, 12), new THREE.MeshBasicMaterial({ color: '#fff7c2' }), 0, -0.04, 0.141);
  }
  if (c.equipo === 4) { // botiquín en la mano
    add(arms[1].hand, new THREE.BoxGeometry(0.2, 0.14, 0.08), mat('#f4f4f2'), 0, -0.1, 0);
    add(arms[1].hand, new THREE.BoxGeometry(0.06, 0.02, 0.085), mat('#d6453d'), 0, -0.1, 0);
    add(arms[1].hand, new THREE.BoxGeometry(0.02, 0.06, 0.085), mat('#d6453d'), 0, -0.1, 0);
  }

  // Cabeza
  const neck = pivot(torso, 0, 0.55, 0);
  add(neck, new THREE.CylinderGeometry(0.05, 0.055, 0.08, 10), skin, 0, 0.02, 0);
  const head = pivot(neck, 0, 0.16, 0);
  const R = 0.14;
  const skull = add(head, sphere(R, 24, 18), skin); skull.scale.set(1, 1.08, 1);
  for (const s of [-1, 1]) add(head, sphere(0.032, 10, 8), skin, s * R * 0.98, -0.005, 0).scale.set(0.55, 1, 0.8);
  add(head, sphere(0.022, 10, 8), skin, 0, -0.015, R * 0.98);
  // Ojos
  const eyes = new THREE.Group(); head.add(eyes);
  const eyeR = [0.022, 0.028, 0.022, 0.024][c.ojos];
  const iris = mat(OJOS_COLOR[c.colorOjos].c);
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * 0.05, 0.018, R * 0.9); eyes.add(e);
    const white = add(e, sphere(eyeR, 12, 10), mat('#fbfbf8')); white.scale.set(c.ojos === 3 ? 1.25 : 1, c.ojos === 2 ? 0.55 : 1, 0.55);
    add(e, new THREE.CircleGeometry(eyeR * 0.62, 14), iris, 0, c.ojos === 2 ? -0.002 : 0, eyeR * 0.56);
    add(e, new THREE.CircleGeometry(eyeR * 0.3, 10), mat('#0d0d0d'), 0, 0, eyeR * 0.565);
    add(e, new THREE.CircleGeometry(eyeR * 0.14, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), eyeR * 0.2, eyeR * 0.22, eyeR * 0.57);
    // Cejas
    const bw = [0.045, 0.05, 0.042, 0.046][c.cejas], bh = [0.009, 0.016, 0.005, 0.009][c.cejas];
    const brow = add(head, new THREE.BoxGeometry(bw, bh, 0.01), hairM, s * 0.05, 0.058, R * 0.93);
    brow.rotation.z = c.cejas === 3 ? -s * 0.28 : -s * 0.06;
  }
  // Boca
  const mouthM = mat('#7a2b2b');
  if (c.boca === 0) { const m = add(head, new THREE.TorusGeometry(0.03, 0.006, 6, 16, Math.PI), mouthM, 0, -0.052, R * 0.94); m.rotation.z = Math.PI; }
  if (c.boca === 1) { const m = add(head, new THREE.CircleGeometry(0.036, 16, Math.PI, Math.PI), mouthM, 0, -0.045, R * 0.975); add(head, new THREE.BoxGeometry(0.05, 0.008, 0.005), mat('#ffffff'), 0, -0.05, R * 0.985); m.rotation.x = -0.1; }
  if (c.boca === 2) add(head, new THREE.BoxGeometry(0.045, 0.007, 0.01), mouthM, 0, -0.055, R * 0.94);
  if (c.boca === 3) add(head, new THREE.CircleGeometry(0.016, 12), mouthM, 0, -0.058, R * 0.965);
  // Detalles de la cara
  if (c.detalle === 1) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) add(head, new THREE.CircleGeometry(0.0045, 6), mat('#8a5236'), s * (0.045 + (k % 2) * 0.016), -0.012 - Math.floor(k / 2) * 0.012, R * 0.955).lookAt(s * 3, 0, 4);
  if (c.detalle === 2) for (const s of [-1, 1]) add(head, new THREE.CircleGeometry(0.02, 12), new THREE.MeshStandardMaterial({ color: '#e8748a', transparent: true, opacity: 0.45 }), s * 0.068, -0.025, R * 0.92).lookAt(s * 3, 0, 4);
  if (c.detalle === 3) add(head, new THREE.CircleGeometry(0.006, 8), mat('#2b1a10'), 0.05, -0.05, R * 0.935).lookAt(1, 0, 4);
  if (c.detalle === 4) { const b = add(head, new THREE.BoxGeometry(0.05, 0.018, 0.005), mat('#e9c49a'), -0.06, -0.01, R * 0.93); b.rotation.set(0, -0.4, 0.5); }
  // Barba
  const bM = hairM;
  if (c.barba === 1) add(head, new THREE.BoxGeometry(0.075, 0.016, 0.02), bM, 0, -0.035, R * 0.95);
  if (c.barba === 2 || c.barba === 3) {
    const b = add(head, new THREE.SphereGeometry(R * 1.02, 20, 12, Math.PI * 1.15, Math.PI * 0.7, Math.PI * 0.55, Math.PI * 0.3), bM, 0, 0, 0);
    b.scale.set(1, c.barba === 3 ? 1.25 : 1.08, 1.02);
    if (c.barba === 3) add(head, new THREE.BoxGeometry(0.075, 0.018, 0.02), bM, 0, -0.035, R * 0.96);
  }
  if (c.barba === 4) add(head, new THREE.ConeGeometry(0.025, 0.05, 8), bM, 0, -0.105, R * 0.75).rotation.x = Math.PI;
  // Tapabocas
  if (c.tapabocas) { const m = add(head, new THREE.SphereGeometry(R * 1.03, 20, 10, Math.PI * 1.2, Math.PI * 0.6, Math.PI * 0.5, Math.PI * 0.27), mat('#bfe0f2')); m.scale.y = 1.08; }

  // Pelo
  buildHair(head, c.pelo, hairM, R);
  // Gafas
  if (c.gafas) {
    const gm = mat(c.gafas === 3 ? '#1d1d1f' : c.gafas === 4 ? '#d6453d' : '#2b2b2b');
    for (const s of [-1, 1]) {
      if (c.gafas === 1) add(head, new THREE.TorusGeometry(0.028, 0.004, 6, 16), gm, s * 0.05, 0.018, R * 1.0);
      if (c.gafas === 2) add(head, new THREE.BoxGeometry(0.058, 0.04, 0.006), new THREE.MeshStandardMaterial({ color: '#2b2b2b', transparent: true, opacity: 0.35 }), s * 0.05, 0.018, R * 1.0);
      if (c.gafas === 3) add(head, new THREE.BoxGeometry(0.06, 0.036, 0.008), gm, s * 0.05, 0.018, R * 1.0);
      if (c.gafas === 2) add(head, new THREE.BoxGeometry(0.06, 0.006, 0.008), gm, s * 0.05, 0.04, R * 1.0);
      add(head, new THREE.BoxGeometry(0.006, 0.006, 0.12), gm, s * R * 0.98, 0.02, R * 0.45);
    }
    if (c.gafas === 4) add(head, new THREE.BoxGeometry(0.17, 0.035, 0.01), new THREE.MeshStandardMaterial({ color: '#5a8fd6', metalness: 0.4, roughness: 0.2 }), 0, 0.02, R * 1.0);
    add(head, new THREE.BoxGeometry(0.03, 0.005, 0.006), gm, 0, 0.024, R * 1.0);
  }
  // Cabeza: accesorios
  buildHeadwear(head, c.cabeza, mat(ROPA_COLOR[c.colorCabeza].c), R);

  // Silla de ruedas
  let chair = null;
  if (silla) {
    chair = new THREE.Group(); scale.add(chair);
    const frame = mat('#3a3f45', { metalness: 0.5, roughness: 0.4 });
    add(chair, new THREE.BoxGeometry(0.44, 0.05, 0.42), mat('#1f2a44'), 0, 0.5, 0.02);
    add(chair, new THREE.BoxGeometry(0.44, 0.4, 0.04), mat('#1f2a44'), 0, 0.72, -0.2);
    const wheels = [];
    for (const s of [-1, 1]) {
      const w = add(chair, new THREE.TorusGeometry(0.28, 0.025, 8, 28), frame, s * 0.27, 0.3, -0.02); w.rotation.y = Math.PI / 2;
      for (let k = 0; k < 3; k++) { const sp = add(w, new THREE.BoxGeometry(0.012, 0.54, 0.012), frame); sp.rotation.z = k * Math.PI / 3; }
      wheels.push(w);
      add(chair, sphere(0.045, 8, 6), mat('#222'), s * 0.18, 0.045, 0.3);
      add(chair, new THREE.BoxGeometry(0.02, 0.45, 0.02), frame, s * 0.18, 0.27, 0.28);
    }
    add(chair, new THREE.BoxGeometry(0.36, 0.02, 0.12), frame, 0, 0.06, 0.42);
    chair.userData.wheels = wheels;
  }

  root.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  root.userData.rig = { hips, torso, neck, head, legs, arms, eyes, chair, silla, H, scale };
  setPose(root, { t: 0 });
  return root;
}

function buildHair(head, estilo, m, R) {
  const capGeo = (tl = 0.55, extra = 1.07) => new THREE.SphereGeometry(R * extra, 24, 14, 0, Math.PI * 2, 0, Math.PI * tl);
  const cap = (tilt = -0.35, tl = 0.55, extra = 1.07) => { const c = add(head, capGeo(tl, extra), m); c.rotation.x = tilt; c.scale.y = 1.08; return c; };
  const back = (h, w = R * 2, y = -h / 2 + 0.04, z = -R * 0.55, d = 0.09) => add(head, new THREE.BoxGeometry(w, h, d), m, 0, y, z);
  switch (estilo) {
    case 0: cap(-0.35, 0.56); break;                                          // corto
    case 1: cap(-0.25, 0.5, 1.02); break;                                     // rapado
    case 2: break;                                                            // calvo
    case 3: cap(-0.35, 0.56); { const f = add(head, new THREE.CapsuleGeometry(0.022, R * 1.3, 4, 8), m, 0.01, 0.092, R * 0.84); f.rotation.z = Math.PI / 2 + 0.15; f.scale.z = 1.3; } break; // flequillo
    case 4: { const a = add(head, new THREE.IcosahedronGeometry(R * 1.5, 1), m, 0, 0.1, -0.06); a.scale.set(1.02, 0.82, 0.88); cap(-0.3, 0.52, 1.08); } break; // afro
    case 5: cap(-0.3, 0.56); for (let i = 0; i < 14; i++) { const t = i / 14 * Math.PI * 2; add(head, sphere(0.035, 8, 6), m, Math.cos(t) * R * 0.85, 0.07 + Math.sin(i * 1.7) * 0.03, Math.sin(t) * R * 0.85 - 0.02); } break; // rizos cortos
    case 6: cap(-0.35, 0.6); for (const s of [-1, 1]) { const b = add(head, new THREE.CapsuleGeometry(0.03, 0.12, 4, 8), m, s * R * 0.96, -0.03, -0.01); b.scale.z = 2.6; } back(0.16, R * 1.95, -0.02, -R * 0.62, 0.1); break; // bob
    case 7: cap(-0.35, 0.6); back(0.42, R * 2.0, -0.13, -R * 0.58); for (const s of [-1, 1]) { const b = add(head, new THREE.CapsuleGeometry(0.028, 0.26, 4, 8), m, s * R * 0.97, -0.08, -0.03); b.scale.z = 2.2; } break; // largo liso
    case 8: cap(-0.35, 0.58); for (let i = 0; i < 6; i++) for (const s of [-1, 0, 1]) add(head, sphere(0.055, 8, 6), m, s * 0.09 + Math.sin(i) * 0.01, 0.02 - i * 0.065, -R * 0.62 - Math.abs(s) * -0.02); break; // largo ondulado
    case 9: { cap(-0.35, 0.56); const t = add(head, new THREE.CapsuleGeometry(0.045, 0.22, 4, 8), m, 0, -0.06, -R * 1.15); t.rotation.x = 0.35; add(head, new THREE.TorusGeometry(0.03, 0.01, 6, 12), mat('#d6453d'), 0, 0.06, -R * 1.02).rotation.x = 1.2; } break; // cola de caballo
    case 10: cap(-0.35, 0.56); for (const s of [-1, 1]) { const t = add(head, new THREE.CapsuleGeometry(0.04, 0.16, 4, 8), m, s * R * 1.15, -0.03, -0.03); t.rotation.z = s * 0.4; } break; // dos colitas
    case 11: cap(-0.35, 0.56); add(head, sphere(0.07, 12, 10), m, 0, 0.15, -0.06); break; // moño
    case 12: cap(-0.35, 0.56); for (const s of [-1, 1]) add(head, sphere(0.055, 12, 10), m, s * 0.09, 0.14, -0.02); break; // dos moños
    case 13: cap(-0.35, 0.56); for (const s of [-1, 1]) for (let i = 0; i < 6; i++) add(head, sphere(0.03 - i * 0.002, 8, 6), m, s * (R * 0.95 + i * 0.004), -0.06 - i * 0.05, 0.02); break; // trenzas
    case 14: cap(-0.2, 0.5, 1.01); for (let i = 0; i < 6; i++) add(head, new THREE.BoxGeometry(0.03, 0.08 + (i % 2) * 0.02, 0.05), m, 0, R * 1.08 + 0.02, R * 0.5 - i * 0.05).rotation.x = -0.2; break; // cresta
  }
}

function buildHeadwear(head, tipo, m, R) {
  if (tipo === 1 || tipo === 2) { // gorra / al revés
    const g = new THREE.Group(); head.add(g); if (tipo === 2) g.rotation.y = Math.PI;
    const crown = add(g, new THREE.SphereGeometry(R * 1.1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), m, 0, 0.02, 0); crown.scale.y = 0.95;
    add(g, new THREE.BoxGeometry(R * 1.5, 0.012, 0.12), m, 0, 0.03, R * 1.05);
  }
  if (tipo === 3) { // sombrero vueltiao (rayas blancas y negras)
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const x = cv.getContext('2d');
    x.fillStyle = '#f1e6cc'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#1d1d1f'; for (let i = 0; i < 64; i += 10) x.fillRect(0, i, 64, 4);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const sm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
    add(head, new THREE.CylinderGeometry(R * 0.95, R * 1.08, 0.13, 20), sm, 0, 0.12, 0);
    add(head, new THREE.CylinderGeometry(R * 2.1, R * 2.1, 0.012, 28), sm, 0, 0.06, 0);
  }
  if (tipo === 4) { // gorro de lana
    const g = add(head, new THREE.SphereGeometry(R * 1.12, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), m, 0, 0.01, 0); g.scale.y = 1.15;
    add(head, new THREE.TorusGeometry(R * 1.03, 0.025, 8, 24), m, 0, 0.015, 0).rotation.x = Math.PI / 2;
    add(head, sphere(0.04, 10, 8), mat('#ffffff'), 0, R * 1.25, 0);
  }
  if (tipo === 5) { // casco de brigada
    const hm = mat('#f2c230', { roughness: 0.4 });
    add(head, new THREE.SphereGeometry(R * 1.16, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hm, 0, 0.02, 0);
    add(head, new THREE.CylinderGeometry(R * 1.32, R * 1.32, 0.012, 24), hm, 0, 0.03, 0.01);
    add(head, new THREE.BoxGeometry(0.03, 0.025, R * 2.1), hm, 0, R * 1.18, 0);
  }
  if (tipo === 6) { const b = add(head, new THREE.TorusGeometry(R * 1.03, 0.012, 6, 24, Math.PI), m, 0, 0.06, -0.01); b.rotation.y = Math.PI / 2; b.rotation.z = -0.25; } // balaca
  if (tipo === 7) { // audífonos
    const b = add(head, new THREE.TorusGeometry(R * 1.12, 0.012, 6, 24, Math.PI), m, 0, 0.0, 0); b.rotation.y = Math.PI / 2;
    for (const s of [-1, 1]) add(head, new THREE.CylinderGeometry(0.045, 0.045, 0.03, 14), m, s * R * 1.1, 0, 0).rotation.z = Math.PI / 2;
  }
}

// ---------- Animación procedural ----------
// estado: { t, speed (m/s), aire, saludo, cubrirse, parpadeo }
export function setPose(av, s) {
  const r = av.userData.rig; if (!r) return;
  const t = s.t || 0, v = Math.min(1, (s.speed || 0) / 4.5), run = Math.max(0, ((s.speed || 0) - 4.6) / 2.6);
  const ph = s.phase ?? t * 6;
  const [lL, lR] = r.legs, [aL, aR] = r.arms;
  if (r.silla) {
    for (const l of r.legs) { l.hip.rotation.x = -Math.PI / 2; l.knee.rotation.x = Math.PI / 2; }
    const push = v > 0.05 ? Math.sin(ph) * 0.5 : 0;
    for (const a of r.arms) { a.sh.rotation.x = -0.3 + push; a.el.rotation.x = -0.5; a.sh.rotation.z = 0; }
    if (r.chair) for (const w of r.chair.userData.wheels) w.rotation.x = -(s.dist || 0) / 0.28;
    r.torso.rotation.x = v * 0.12; r.hips.position.y = 0.56;
  } else {
    const swing = Math.sin(ph) * (0.55 * v + 0.25 * run);
    lL.hip.rotation.x = swing; lR.hip.rotation.x = -swing;
    lL.knee.rotation.x = Math.max(0, -Math.sin(ph + 0.6)) * 0.9 * v; lR.knee.rotation.x = Math.max(0, Math.sin(ph + 0.6)) * 0.9 * v;
    aL.sh.rotation.x = -swing * 0.9; aR.sh.rotation.x = swing * 0.9;
    aL.el.rotation.x = -0.25 - 0.4 * v; aR.el.rotation.x = -0.25 - 0.4 * v;
    aL.sh.rotation.z = -0.08; aR.sh.rotation.z = 0.08;
    r.hips.position.y = 0.78 + Math.abs(Math.sin(ph)) * 0.035 * v - 0.01 * v;
    r.torso.rotation.x = 0.06 * v + 0.1 * run;
    if (s.aire) { lL.hip.rotation.x = -0.6; lL.knee.rotation.x = 0.9; lR.hip.rotation.x = 0.2; lR.knee.rotation.x = 0.4; aL.sh.rotation.x = -2.2; aR.sh.rotation.x = -2.2; aL.sh.rotation.z = -0.4; aR.sh.rotation.z = 0.4; }
  }
  // Respiración y mirada
  r.torso.scale.y = 1 + Math.sin(t * 2.2) * 0.008;
  r.neck.rotation.y = Math.sin(t * 0.6) * 0.12 * (1 - v);
  // Saludo con la mano derecha
  if (s.saludo) { aR.sh.rotation.z = 2.6; aR.sh.rotation.x = 0; aR.el.rotation.z = 0; aR.el.rotation.x = 0; aR.sh.rotation.y = 0; aR.el.rotation.x = Math.sin(t * 9) * 0.35 - 0.2; }
  // Agacharse, cubrirse y agarrarse (para la etapa "Durante el temblor")
  if (s.cubrirse && !r.silla) {
    r.hips.position.y = 0.36; r.torso.rotation.x = 0.9;
    for (const l of r.legs) { l.hip.rotation.x = -1.9; l.knee.rotation.x = 2.3; }
    aL.sh.rotation.x = -2.6; aR.sh.rotation.x = -2.6; aL.el.rotation.x = -1.9; aR.el.rotation.x = -1.9;
    aL.sh.rotation.z = -0.5; aR.sh.rotation.z = 0.5; r.neck.rotation.x = 0.5;
  } else r.neck.rotation.x = 0;
  // Parpadeo
  const blink = (t % 4.2) < 0.12;
  r.eyes.scale.y = blink ? 0.1 : 1;
}

export function disposeAvatar(av) {
  av.traverse(o => { if (o.isMesh) { o.geometry.dispose(); } });
}
