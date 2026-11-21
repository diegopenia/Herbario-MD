import * as THREE from 'three';
import { buildAvatar, setPose, disposeAvatar, OPCIONES, DEFAULT, ROLES_INFO, aleatorio, combinaciones } from './avatar.js';

// =====================================================================
// Editor de personaje: vista 3D + panel de opciones por categorías.
// =====================================================================
const SECCIONES = [
  { id: 'cuerpo', n: 'Cuerpo', filas: [['estatura', 'Estatura'], ['complexion', 'Complexión'], ['piel', 'Tono de piel', 'color'], ['movilidad', 'Movilidad']] },
  { id: 'cara', n: 'Cara', filas: [['ojos', 'Ojos'], ['colorOjos', 'Color de ojos', 'color'], ['cejas', 'Cejas'], ['boca', 'Expresión'], ['detalle', 'Detalles'], ['barba', 'Barba'], ['tapabocas', 'Tapabocas']] },
  { id: 'pelo', n: 'Pelo', filas: [['pelo', 'Peinado'], ['colorPelo', 'Color', 'color']] },
  { id: 'ropa', n: 'Ropa', filas: [['superior', 'Parte de arriba'], ['colorSuperior', 'Color', 'color'], ['inferior', 'Parte de abajo'], ['colorInferior', 'Color', 'color'], ['calzado', 'Calzado'], ['colorCalzado', 'Color', 'color']] },
  { id: 'accesorios', n: 'Accesorios', filas: [['cabeza', 'En la cabeza'], ['colorCabeza', 'Color', 'color'], ['gafas', 'Gafas'], ['equipo', 'Equipo'], ['colorEquipo', 'Color del equipo', 'color']] },
  { id: 'rol', n: 'Rol', filas: [['rol', 'Rol en el simulacro']] },
];
const STORE = 'ruta-segura-avatar';
export function cargarGuardado() { try { const j = JSON.parse(localStorage.getItem(STORE) || 'null'); return j && typeof j === 'object' ? { ...DEFAULT, ...j } : null; } catch (e) { return null; } }
function guardar(cfg) { try { localStorage.setItem(STORE, JSON.stringify(cfg)); } catch (e) { /* sin almacenamiento */ } }

export function createEditor({ renderer, onDone }) {
  const $ = (id) => document.getElementById(id);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dfe9ef');
  scene.add(new THREE.HemisphereLight('#ffffff', '#c7b79a', 1.5));
  const key = new THREE.DirectionalLight('#fff4e0', 2.3); key.position.set(2, 4, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2 });
  const rim = new THREE.DirectionalLight('#cfe6ff', 1.2); rim.position.set(-3, 2, -3);
  scene.add(key, rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.4, 48), new THREE.MeshStandardMaterial({ color: '#c0826a', roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.48, 64), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; scene.add(ring);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);

  let cfg = cargarGuardado() || aleatorio(Math.random, { nombre: '' });
  let avatar = null, yaw = 0.35, open = false, tab = 'cuerpo', zoom = 0, waveT = 0, practicar = false, spin = 0;
  const history = [];

  function rebuild() {
    if (avatar) { scene.remove(avatar); disposeAvatar(avatar); }
    avatar = buildAvatar(cfg); scene.add(avatar);
    avatar.traverse(o => { if (o.isMesh) o.castShadow = true; });
    $('ed-count').textContent = `${fmtGrande(combinaciones())} combinaciones posibles`;
    $('ed-rol-info').textContent = ROLES_INFO[cfg.rol] || 'Sin rol: participa como cualquier persona del simulacro.';
    $('ed-rol-info').style.display = tab === 'rol' ? 'block' : 'none';
  }
  function fmtGrande(n) {
    if (n >= 1e18) return 'Más de ' + Math.floor(n / 1e18).toLocaleString('es-CO') + ' trillones de';
    if (n >= 1e12) return 'Más de ' + Math.floor(n / 1e12).toLocaleString('es-CO') + ' billones de';
    return n.toLocaleString('es-CO');
  }
  function set(k, v) {
    if (cfg[k] === v) return;
    history.push({ ...cfg }); if (history.length > 60) history.shift();
    cfg = { ...cfg, [k]: v };
    if (k === 'superior' && v === 8) cfg.inferior = 4;
    if (k === 'inferior' && cfg.superior === 8 && v !== 4) cfg.superior = 0;
    waveT = 0.9; rebuild(); renderPanel();
  }
  function renderTabs() {
    $('ed-tabs').innerHTML = SECCIONES.map(s => `<button class="ed-tab${s.id === tab ? ' on' : ''}" data-tab="${s.id}" type="button">${s.n}</button>`).join('');
  }
  function renderPanel() {
    renderTabs();
    const sec = SECCIONES.find(s => s.id === tab);
    $('ed-body').innerHTML = sec.filas.map(([k, label, kind]) => {
      const disabled = k === 'colorInferior' && cfg.superior === 8;
      const opts = OPCIONES[k].map(o => kind === 'color'
        ? `<button type="button" class="sw${cfg[k] === o.id ? ' on' : ''}" data-k="${k}" data-v="${o.id}" title="${o.n}" aria-label="${o.n}" style="--c:${o.c}"></button>`
        : `<button type="button" class="chip${cfg[k] === o.id ? ' on' : ''}" data-k="${k}" data-v="${o.id}">${o.n}</button>`).join('');
      const actual = OPCIONES[k][cfg[k]]?.n || '';
      return `<div class="ed-row${disabled ? ' off' : ''}"><div class="ed-label">${label}${kind === 'color' ? ` <span>${actual}</span>` : ''}</div><div class="${kind === 'color' ? 'swatches' : 'chips'}">${opts}</div></div>`;
    }).join('');
    $('ed-rol-info').style.display = tab === 'rol' ? 'block' : 'none';
    $('ed-undo').disabled = !history.length;
    // Enfoque de cámara según la categoría
    zoom = (tab === 'cara' || tab === 'pelo') ? 1 : 0;
  }
  $('ed-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; renderPanel(); $('ed-body').scrollTop = 0; } });
  $('ed-body').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) set(b.dataset.k, Number(b.dataset.v)); });
  $('ed-random').addEventListener('click', () => { history.push({ ...cfg }); cfg = aleatorio(Math.random, { nombre: cfg.nombre }); waveT = 0.9; spin = Math.PI * 2; rebuild(); renderPanel(); });
  $('ed-undo').addEventListener('click', () => { if (!history.length) return; cfg = history.pop(); rebuild(); renderPanel(); });
  $('ed-name').addEventListener('input', (e) => { cfg.nombre = e.target.value.slice(0, 18); });
  $('ed-wave').addEventListener('click', () => { waveT = 2.2; });
  $('ed-practice').addEventListener('click', () => { practicar = !practicar; $('ed-practice').classList.toggle('on', practicar); });
  $('ed-done').addEventListener('click', () => {
    cfg.nombre = ($('ed-name').value || '').trim().slice(0, 18);
    guardar(cfg); close(); onDone({ ...cfg });
  });
  // Girar el personaje arrastrando sobre la vista
  const view = $('ed-view'); let drag = null;
  view.addEventListener('pointerdown', (e) => { drag = e.clientX; view.setPointerCapture(e.pointerId); });
  view.addEventListener('pointermove', (e) => { if (drag !== null) { yaw += (e.clientX - drag) * 0.012; drag = e.clientX; } });
  for (const ev of ['pointerup', 'pointercancel']) view.addEventListener(ev, () => { drag = null; });
  view.addEventListener('wheel', (e) => { zoom = e.deltaY < 0 ? 1 : 0; e.preventDefault(); }, { passive: false });

  function show(withCfg) {
    if (withCfg) cfg = { ...withCfg };
    open = true; $('editor').classList.add('on'); $('ed-name').value = cfg.nombre || '';
    rebuild(); renderPanel(); waveT = 1.6;
  }
  function close() { open = false; $('editor').classList.remove('on'); renderer.setViewport(0, 0, innerWidth, innerHeight); }

  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  function render(dt, t) {
    if (!open || !avatar) return false;
    const w = innerWidth, h = innerHeight;
    // En pantallas anchas el panel va a la derecha; en celular, abajo.
    const wide = w >= 760;
    const panel = $('ed-panel').getBoundingClientRect();
    const vx = 0, vy = 0, vw = wide ? Math.max(200, w - panel.width) : w, vh = wide ? h : Math.max(180, h - panel.height);
    renderer.setScissorTest(false);
    renderer.setViewport(vx, h - vh, vw, vh);
    cam.aspect = vw / vh;
    const H = avatar.userData.rig.H;
    const aspect = vw / vh;
    const focusY = zoom ? 1.38 * H : 0.98 * H;
    const dist = zoom ? 2.1 * Math.max(1, 1.1 / aspect) : Math.max(4.4, 4.9 / Math.min(1, aspect)) * Math.max(0.92, H);
    camLook.lerp(new THREE.Vector3(0, focusY, 0), Math.min(1, dt * 6));
    camPos.lerp(new THREE.Vector3(0, focusY + (zoom ? 0.08 : 0.3), dist), Math.min(1, dt * 6));
    cam.position.copy(camPos); cam.lookAt(camLook); cam.updateProjectionMatrix();
    if (spin > 0) { const k = Math.min(spin, dt * 12); spin -= k; yaw += k; }
    avatar.rotation.y = yaw;
    waveT = Math.max(0, waveT - dt);
    setPose(avatar, { t, saludo: waveT > 0 && !practicar, cubrirse: practicar });
    renderer.render(scene, cam);
    return true;
  }
  // Primer cuadro: cámara ya en su sitio
  camPos.set(0, 1.25, 4); camLook.set(0, 0.9, 0);
  return { show, close, render, get open() { return open; }, get cfg() { return { ...cfg }; } };
}
