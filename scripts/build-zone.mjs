// Convierte los datos abiertos (OSM + censo de arbolado) en el archivo de zona del juego.
// Uso: node scripts/build-zone.mjs  ->  data/zona-minuto.json
import { readFileSync, writeFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync(new URL('../data/minuto.json', import.meta.url)));

// Límites jugables (metros; x = este, z = sur). Centro: 4.6989 N, -74.0898 O.
const BOUNDS = { minX: -195, maxX: 175, minZ: -185, maxZ: 195 };
const DRAW = { minX: BOUNDS.minX - 60, maxX: BOUNDS.maxX + 60, minZ: BOUNDS.minZ - 60, maxZ: BOUNDS.maxZ + 60 };
const inside = ([x, z], b = BOUNDS) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;

// ---------- Especies ----------
// Clasificación nativa/introducida y fichas: borrador para validar con el Jardín Botánico de Bogotá.
const FICHAS = {
  'Roble': { comun: 'Roble andino', cientifico: 'Quercus humboldtii', rara: true,
    ficha: 'El único roble nativo de Suramérica. En Colombia su aprovechamiento está vedado para protegerlo.' },
  'Nogal, cedro nogal, cedro negro': { comun: 'Nogal andino', cientifico: 'Juglans neotropica', rara: true,
    ficha: 'Especie amenazada por la tala: su madera es de las más valiosas de los Andes.' },
  'Palma de cera, Palma blanca': { comun: 'Palma de cera', cientifico: 'Ceroxylon quindiuense', rara: true,
    ficha: 'Árbol nacional de Colombia. En su hábitat puede superar los 45 m de altura.' },
  'Pino colombiano, pino de pacho, pino romerón': { comun: 'Pino colombiano', cientifico: 'Podocarpaceae', rara: true,
    ficha: 'Una de las pocas coníferas nativas de Colombia. No es un pino verdadero.' },
  'Chicala, chirlobirlo, flor amarillo': { comun: 'Chicalá', cientifico: 'Tecoma stans',
    ficha: 'Flores amarillas en forma de trompeta que visitan colibríes y abejas.' },
  'Caucho sabanero': { comun: 'Caucho sabanero', cientifico: 'Ficus soatensis',
    ficha: 'Árbol nativo de la sabana de Bogotá. Sus pequeños higos alimentan a muchas aves.' },
  'Cajeto, garagay, urapo': { comun: 'Cajeto', cientifico: 'Citharexylum subflavescens',
    ficha: 'Árbol del bosque andino. Sus frutos atraen aves como la mirla y el copetón.' },
  'Cajeto': { comun: 'Cajeto', cientifico: 'Citharexylum subflavescens',
    ficha: 'Árbol del bosque andino. Sus frutos atraen aves como la mirla y el copetón.' },
  'Cedro, cedro andino, cedro clavel': { comun: 'Cedro andino', cientifico: 'Cedrela montana',
    ficha: 'Árbol nativo de los Andes, muy talado por su madera fina y aromática.' },
  'Alcaparro doble': { comun: 'Alcaparro', cientifico: 'Senna viarum',
    ficha: 'Arbolito nativo de flores amarillas, muy común en parques y separadores de Bogotá.' },
  'Guayacan de Manizales': { comun: 'Guayacán de Manizales', cientifico: 'Lafoensia acuminata',
    ficha: 'Árbol andino nativo de Colombia, uno de los más sembrados en las calles de Bogotá.' },
  'Mano de oso': { comun: 'Mano de oso', cientifico: 'Oreopanax sp.',
    ficha: 'Sus hojas grandes y lobuladas parecen la huella de una mano.' },
  'Cucharo': { comun: 'Cucharo', cientifico: 'Myrsine sp.',
    ficha: 'Árbol del bosque altoandino. Sus frutos pequeños son comida para las aves.' },
  'Cariseco, Tres hojas': { comun: 'Cariseco', cientifico: 'Billia rosea',
    ficha: 'Árbol nativo del bosque andino, con hojas agrupadas de a tres.' },
  'Gaque': { comun: 'Gaque', cientifico: 'Clusia sp.',
    ficha: 'Árbol nativo de hojas gruesas y brillantes, típico del bosque altoandino.' },
  'Yarumo': { comun: 'Yarumo', cientifico: 'Cecropia sp.',
    ficha: 'Árbol pionero: es de los primeros en crecer cuando un bosque se recupera.' },
  'Dividivi de tierra fria': { comun: 'Dividivi de tierra fría', cientifico: 'Caesalpinia spinosa',
    ficha: 'Arbolito nativo de zonas secas andinas; sus vainas se usan para teñir.' },
  'Sangregado': { comun: 'Sangregao', cientifico: 'Croton sp.',
    ficha: 'Su savia es roja, por eso se llama sangregao.' },
};
// Especies elegidas como muestras de la zona (una por especie, sobre un árbol real).
const MUESTRAS = [
  'Roble', 'Nogal, cedro nogal, cedro negro', 'Palma de cera, Palma blanca', 'Pino colombiano, pino de pacho, pino romerón',
  'Chicala, chirlobirlo, flor amarillo', 'Caucho sabanero', 'Cajeto, garagay, urapo', 'Cedro, cedro andino, cedro clavel',
  'Alcaparro doble', 'Guayacan de Manizales', 'Mano de oso', 'Cucharo',
];

const forma = (n) => /palma/i.test(n) ? 'palma' : /(pino|cipr|araucaria|criptomeria)/i.test(n) ? 'conifera' : 'copa';

const alturas = {};
raw.T.forEach(([x, z, h, s]) => { if (inside([x, z])) (alturas[s] ||= []).push(h); });

const especies = raw.sp.map((nombre, i) => {
  const f = FICHAS[nombre];
  const hs = alturas[i] || [];
  const media = hs.length ? Math.round(hs.reduce((a, b) => a + b, 0) / hs.length * 10) / 10 : null;
  return {
    censo: nombre,
    comun: f ? f.comun : nombre.split(',')[0].trim(),
    cientifico: f ? f.cientifico : null,
    nativa: !!f,
    rara: !!(f && f.rara),
    ficha: f ? f.ficha : 'Especie introducida: no es nativa de la sabana de Bogotá. Queda registrada, pero no suma puntos.',
    forma: forma(nombre),
    enZona: hs.length,
    alturaMedia: media,
  };
});
// Árboles altos introducidos: mensaje de riesgo sísmico.
for (const e of especies) {
  if (!e.nativa && e.alturaMedia && e.alturaMedia >= 12) {
    e.ficha = `Especie introducida que aquí mide en promedio ${String(e.alturaMedia).replace('.', ',')} m. En un sismo, aléjate de árboles altos: pueden caer ramas.`;
    e.riesgo = true;
  }
}

// ---------- Geometría ----------
const area2 = (p) => p.reduce((a, [x, z], i) => { const [x2, z2] = p[(i + 1) % p.length]; return a + x * z2 - x2 * z; }, 0) / 2;
const closeRing = (p) => { const r = p.slice(); const a = r[0], b = r[r.length - 1]; if (a[0] === b[0] && a[1] === b[1]) r.pop(); return r; };
const centroid = (p) => { let x = 0, z = 0; p.forEach(q => { x += q[0]; z += q[1]; }); return [Math.round(x / p.length), Math.round(z / p.length)]; };
const anyInside = (p) => p.some(q => inside(q, DRAW));
const pointInPoly = (x, z, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };

// ---------- Edificios: Catastro de Bogotá (construcciones con número de pisos) ----------
const catastro = readFileSync(new URL('../data/catastro.txt', import.meta.url), 'utf8').split(';').map(r => {
  const v = r.split(',').map(Number);
  const pts = [[v[2], v[3]]];
  for (let i = 4; i < v.length; i += 2) { const [x, z] = pts[pts.length - 1]; pts.push([x + v[i], z + v[i + 1]]); }
  return { pisos: v[0], lote: v[1], poly: pts };
});
// Polígonos de referencia de OpenStreetMap para reconocer los edificios emblemáticos.
const osmArea = (name) => { const a = raw.A.find(a => a[1] === name); return a ? closeRing(a[2]) : null; };
const osmBuilding = (name) => { const b = raw.B.find(b => b[1] === name); return b ? closeRing(b[3]) : null; };
const REF = {
  museo: osmBuilding('Museo de Arte Contemporáneo'),
  iglesia: osmArea('iglesia minuto de Dios'),
  teatro: osmArea('Teatro minuto de Dios'),
  biblioteca: osmArea('Biblioteca Rafael Garcia Herreros'),
  colegio: osmArea('Colegio El Minuto de Dios'),
  uniminuto: osmArea('Uniminuto'),
};
const LOTE_UNIMINUTO = 211;
const edificios = [];
for (const c of catastro) {
  if (!anyInside(c.poly) || Math.abs(area2(c.poly)) < 4) continue;
  const [cx, cz] = centroid(c.poly);
  let estilo = 'casa';
  if (c.lote === LOTE_UNIMINUTO) estilo = c.pisos >= 8 ? 'uniminuto-torre' : 'uniminuto';
  else if (REF.museo && pointInPoly(cx, cz, REF.museo)) estilo = 'museo';
  else if (REF.iglesia && pointInPoly(cx, cz, REF.iglesia)) estilo = 'iglesia';
  else if (REF.teatro && pointInPoly(cx, cz, REF.teatro)) estilo = 'teatro';
  else if (REF.biblioteca && pointInPoly(cx, cz, REF.biblioteca)) estilo = 'biblioteca';
  else if (REF.colegio && pointInPoly(cx, cz, REF.colegio)) estilo = 'colegio';
  else if (REF.uniminuto && pointInPoly(cx, cz, REF.uniminuto)) estilo = 'uniminuto';
  if (estilo === 'casa' && c.lote === 216) estilo = 'cultural'; // teatro y biblioteca del mismo lote del museo
  const piso = estilo.startsWith('uniminuto') ? 3.4 : 3;
  let altura = c.pisos * piso + (estilo === 'museo' ? 2 : 0);
  if (estilo === 'iglesia') altura = Math.max(altura, 11); // nave de un solo piso de doble altura (estimada)
  edificios.push({ estilo, pisos: c.pisos, altura: Math.round(altura * 10) / 10, lote: c.lote, poly: c.poly });
}
// Formas curvas inspiradas en las fotos del equipo (aproximadas dentro de la huella del catastro).
const extras = [];
const bbox = (list) => { const xs = list.flatMap(e => e.poly.map(p => p[0])), zs = list.flatMap(e => e.poly.map(p => p[1])); return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; };
const igl = edificios.filter(e => e.estilo === 'iglesia');
if (igl.length) {
  igl.forEach(e => { e.oculto = true; });
  const b = bbox(igl), cx = (b.x0 + b.x1) / 2, w = b.x1 - b.x0;
  const r1 = Math.min(w / 2, 6.5), r2 = Math.min(w * 0.4, 5);
  extras.push({ tipo: 'cilindro', estilo: 'iglesia', p: [cx, 0, b.z0 + r1 + 0.5], r: r1, h: 12 });
  extras.push({ tipo: 'cupula', p: [cx, 12, b.z0 + r1 + 0.5], r: r1 * 0.82 });
  extras.push({ tipo: 'cilindro', estilo: 'iglesia', p: [cx, 0, b.z1 - r2 - 0.5], r: r2, h: 9 });
  extras.push({ tipo: 'caja', estilo: 'iglesia', p: [cx, 0, (b.z0 + b.z1) / 2], s: [w * 0.75, 8, (b.z1 - b.z0) * 0.45] });
  extras.push({ tipo: 'cilindro', estilo: 'iglesia', p: [b.x0 + 3, 0, b.z1 - 3], r: 3, h: 5 });
}
const mus = edificios.filter(e => e.estilo === 'museo');
if (mus.length) {
  const b = bbox(mus), cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  extras.push({ tipo: 'cilindro', estilo: 'museo', p: [cx + 1, 0, cz], r: 7.5, h: 13 });
  extras.push({ tipo: 'zocalo', p: [cx, 0, cz], s: [b.x1 - b.x0 + 6, 0.8, b.z1 - b.z0 + 6] });
}
const bloque7 = edificios.find(e => e.estilo === 'uniminuto' && e.pisos === 7);
if (bloque7) { const [x, z] = centroid(bloque7.poly); extras.push({ tipo: 'letrero', texto: 'UNIMINUTO', p: [x, bloque7.altura + 2.2, z] }); }
const areas = [];
for (const [tipo, name, g] of raw.A) {
  const poly = closeRing(g); if (!anyInside(poly)) continue;
  areas.push({ tipo, nombre: name || null, poly });
}

const ANCHO = { trunk: 14, primary: 12, secondary: 10, tertiary: 9, residential: 7, service: 4.5, pedestrian: 4, footway: 2.4, cycleway: 2.6, steps: 2.4 };
const vias = [];
for (const [tipo, name, isArea, g] of raw.H) {
  if (isArea) { areas.push({ tipo: 'plaza', nombre: name || null, poly: closeRing(g) }); continue; }
  // Partir la línea en tramos que caen dentro del área de dibujo.
  let run = [];
  const flush = () => { if (run.length > 1) vias.push({ tipo, nombre: name || null, ancho: ANCHO[tipo] || 4, linea: run }); run = []; };
  for (const q of g) { if (inside(q, DRAW)) run.push(q); else flush(); }
  flush();
}

// Árboles
const arboles = raw.T.filter(([x, z]) => inside([x, z])).map(([x, z, h, s]) => ({ x, z, h: Math.max(0.8, h), esp: s }));

// Elegir un árbol real por especie de muestra: el más cercano al centro de la zona.
const CENTRO = [-10, 0];
const enEdificio = (x, z) => edificios.some(e => pointInPoly(x, z, e.poly));
const muestras = [];
for (const nombre of MUESTRAS) {
  const s = raw.sp.indexOf(nombre);
  let best = -1, bd = Infinity;
  arboles.forEach((a, i) => {
    if (a.esp !== s || enEdificio(a.x, a.z)) return;
    const d = Math.hypot(a.x - CENTRO[0], a.z - CENTRO[1]);
    if (d < bd) { bd = d; best = i; }
  });
  if (best < 0) throw new Error('Sin árbol para ' + nombre);
  muestras.push({ arbol: best, rara: especies[s].rara });
}

const zona = {
  id: 0,
  key: 'minuto-de-dios',
  name: { es: 'Minuto de Dios: inventario verde' },
  par: 300,
  ritmo: 'libre',
  bounds: BOUNDS,
  origen: { lat: 4.6989, lon: -74.0898 },
  spawn: { p: [22, 0, 40], yaw: -Math.PI * 0.75 },
  puntoEncuentro: { p: [-52, 0, 28], r: 6, nombre: 'Punto de encuentro: Plaza Minuto de Dios' },
  meta: { muestrasMinimas: 8 },
  puntaje: { muestra: 10, muestraRara: 50, coleccionCompleta: 250, llegada: 500, bonoPorSegundo: 5, bonoMax: 400 },
  edificios, extras, vias, areas, arboles, especies, muestras,
  rotulos: [
    { texto: 'Iglesia Minuto de Dios', p: [-36, 30, -75] },
    { texto: 'Museo de Arte Contemporáneo', p: [-84, 15, 26] },
    { texto: 'Teatro Minuto de Dios', p: [-105, 15, 18] },
    { texto: 'Biblioteca Rafael García Herreros', p: [-82, 11, -22] },
    { texto: 'Plaza Minuto de Dios', p: [-52, 7, 28] },
    { texto: 'Colegio El Minuto de Dios', p: [-150, 12, -40] },
  ],
  pistas: [
    { p: [22, 0, 40], r: 9, texto: { es: 'Muévete con W A S D o el joystick. Arrastra la pantalla para mirar.' } },
    { p: [5, 0, 30], r: 9, texto: { es: 'Los árboles con un anillo verde son nativos. Acércate y mantén Registrar (E).' } },
    { p: [-12, 0, 62], r: 12, texto: { es: 'Estos urapanes miden más de 20 m. En un sismo, aléjate de árboles altos y postes.' } },
    { p: [-52, 0, 28], r: 10, texto: { es: 'La plaza es un espacio abierto: buen punto de encuentro, lejos de fachadas y árboles altos.' } },
  ],
  npcs: [
    { quien: 'brigadista', nombre: 'Brigadista Paola', p: [18, 0, 36], dice: [
      { es: '¡Hola! Hoy hacemos el inventario verde del Minuto de Dios con el Jardín Botánico.' },
      { es: 'Registra al menos 8 muestras de árboles nativos. Los raros valen más: roble, nogal, palma de cera y pino colombiano.' },
      { es: 'Cuando termines, repórtate en el punto de encuentro de la plaza.' },
    ] },
  ],
  creditos: [
    'Datos del mapa: © OpenStreetMap (ODbL)',
    'Construcciones y número de pisos: Catastro de Bogotá, UAECD (CC BY 4.0)',
    'Arbolado: Censo del Arbolado Urbano, Jardín Botánico de Bogotá (CC BY 4.0), consultado el 20 nov. 2026',
    'Alturas estimadas a partir del número de pisos; fichas de especies en borrador para validar con el Jardín Botánico',
  ],
};

writeFileSync(new URL('../data/zona-minuto.json', import.meta.url), JSON.stringify(zona));
const libre = (x, z, r = 1) => !edificios.some(e => pointInPoly(x, z, e.poly) || e.poly.some(([px, pz]) => Math.hypot(px - x, pz - z) < r));
for (const [nombre, p] of [['spawn', zona.spawn.p], ['npc', zona.npcs[0].p], ['encuentro', zona.puntoEncuentro.p], ...zona.pistas.map((h, i) => ['pista' + i, h.p])]) console.log(nombre, p[0], p[2], libre(p[0], p[2]) ? 'libre' : 'DENTRO DE EDIFICIO');
const estilos = {}; edificios.forEach(e => estilos[e.estilo] = (estilos[e.estilo] || 0) + 1); console.log('estilos', JSON.stringify(estilos), 'extras', JSON.stringify(extras));
console.log('edificios', edificios.length, 'vias', vias.length, 'areas', areas.length, 'arboles', arboles.length);
console.log('muestras:', muestras.map(m => { const a = arboles[m.arbol]; return `${especies[a.esp].comun}${m.rara ? '*' : ''} (${a.x},${a.z})`; }).join(' | '));
console.log('riesgo:', especies.filter(e => e.riesgo).map(e => `${e.comun} ${e.alturaMedia}m`).join(', '));
