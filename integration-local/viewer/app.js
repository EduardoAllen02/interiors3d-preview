// Visor 360 de megapanorámicas con lupa. Arrastrar = girar, rueda / pellizco = zoom, cursor encima = lupa
// (en celular: mantener el dedo). Un menú arriba a la derecha cambia de panorámica sin recargar la página.
// Parámetros opcionales en la URL:
//   ?pano=eur|val   panorámica inicial (el menú la mantiene actualizada para poder compartir el enlace)
//   &mag=4          aumento máximo de la lupa (se reduce solo si la pano no tiene más detalle real)
//   &size=260       diámetro fijo de la lupa en px (por defecto se calcula según el tamaño de pantalla)
//   &base=https://cdn.ejemplo.com/tiles   dónde viven los tiles (por defecto ./tiles); requiere CORS si es otro dominio
import { Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';

const q = new URLSearchParams(location.search);
const data = await (await fetch(`panos.json?v=${q.get('v') ?? '2'}`)).json();
const { page = {}, panos } = data;
const ids = Object.keys(panos);
let pid = panos[q.get('pano')] ? q.get('pano') : ids[0];
let cur = panos[pid];
const tilesBase = (q.get('base') ?? 'tiles').replace(/\/$/, '');

const panoramaOf = (id) => ({
  baseUrl: `${tilesBase}/${id}/base.jpg`,
  levels: panos[id].levels,
  tileUrl: (col, row, level) => `${tilesBase}/${id}/L${level}_${col}_${row}.jpg`,
});

const MAIN_FOV = { min: 35, max: 85 }; // FOV vertical (PSV)
const LENS_FOV = { min: 1, max: 100 }; // PSV recorta minFov a 1°
const fovToZoom = (fov, r) => Math.max(0, Math.min(100, ((r.max - fov) / (r.max - r.min)) * 100));
const DEFAULT_ZOOM = fovToZoom(65, MAIN_FOV);

const $ = (id) => document.getElementById(id);
const lensEl = $('lens');
const mainEl = $('main');

// --- Encabezado (título + descripción) -------------------------------------------------------
$('title').textContent = page.title ?? '';
$('desc').textContent = page.description ?? '';
const intro = $('intro');
if (!page.title && !page.description) intro.style.display = 'none';
// En pantallas chicas la descripción va recortada; tocar el encabezado la abre / cierra.
intro.addEventListener('click', () => {
  if (matchMedia('(max-width: 640px)').matches) intro.classList.toggle('open');
});
const markMore = () => {
  const d = $('desc');
  const clamped = matchMedia('(max-width: 640px)').matches && !intro.classList.contains('open') && d.scrollHeight > d.clientHeight + 1;
  intro.classList.toggle('has-more', matchMedia('(max-width: 640px)').matches && (clamped || intro.classList.contains('open')));
};

// --- Estado y tamaño responsivo de la lupa ---------------------------------------------------
const st = {
  lensOn: true,
  mag: Math.max(1, +(q.get('mag') ?? 4)),
  fixedSize: q.get('size') ? +q.get('size') : null,
  size: 260,
  pointer: null,
  dirty: false,
  lastLensFov: 0,
  lastMag: 0,
  switching: false,
};

// La lupa escala con la pantalla: ~22% del lado útil, entre 120 y 280 px (escritorio ~260, celular ~120-130).
function computeLensSize() {
  const w = mainEl.clientWidth, h = mainEl.clientHeight;
  if (st.fixedSize) return st.fixedSize;
  // En pantallas táctiles la lupa es más chica (celular ~100 px); con mouse, entre 120 y 280 px.
  const touch = matchMedia('(pointer: coarse)').matches;
  return Math.round(Math.max(touch ? 100 : 120, Math.min(touch ? 200 : 280, Math.min(w, h * 2) * (touch ? 0.18 : 0.22))));
}
function applyLensSize() {
  st.size = computeLensSize();
  lensEl.style.width = lensEl.style.height = st.size + 'px';
}

// --- Visores ---------------------------------------------------------------------------------
const adapter = [EquirectangularTilesAdapter, { showErrorTile: false, baseBlur: false }];

const main = new Viewer({
  container: mainEl,
  adapter,
  panorama: panoramaOf(pid),
  navbar: false,
  minFov: MAIN_FOV.min,
  maxFov: MAIN_FOV.max,
  defaultZoomLvl: DEFAULT_ZOOM,
  touchmoveTwoFingers: false,
  loadingTxt: '',
});

const lens = new Viewer({
  container: $('lens-view'),
  adapter,
  panorama: panoramaOf(pid),
  navbar: false,
  minFov: LENS_FOV.min,
  maxFov: LENS_FOV.max,
  mousemove: false,
  mousewheel: false,
  touchmoveTwoFingers: false,
  keyboard: false,
  loadingTxt: '',
  loadingImg: null,
  moveInertia: false,
  rendererParameters: { alpha: false },
});

applyLensSize();

function updateLens() {
  st.dirty = false;
  const p = st.pointer;
  if (!st.lensOn || st.switching || !p || !p.visible || !main.state.ready) { lensEl.style.display = 'none'; return; }
  const rect = mainEl.getBoundingClientRect();
  const vx = p.x - rect.left, vy = p.y - rect.top;

  let sph;
  try { sph = main.dataHelper.viewerCoordsToSphericalCoords({ x: vx, y: vy }); } catch (e) { sph = null; }
  if (!sph) { lensEl.style.display = 'none'; return; }

  let lx = vx, ly = vy;
  if (p.touch) {
    // Con el dedo la lupa va arriba y a la izquierda del punto tocado, para que el dedo no la tape;
    // siempre del mismo lado aunque se corte en el borde (voltearla hacía que brincara al mover el dedo). Con mouse va centrada.
    const k = st.size / 2 + Math.max(12, st.size * 0.14);
    lx = vx - k; ly = vy - k;
  }
  lensEl.style.transform = `translate(${lx - st.size / 2}px, ${ly - st.size / 2}px)`;
  lensEl.style.display = 'block';
  lens.resize({ width: st.size, height: st.size });

  // Proyección rectilínea: px por radián en el centro = (W/2)/tan(fov/2).
  const tanMain = Math.tan((main.state.hFov * Math.PI) / 360);
  // Aumento real = el pedido, pero sin pasar del detalle nativo de la pano (si no, solo se vería borroso).
  const nativeDegPerPx = 360 / cur.sourceWidth;
  const mainDegPerPx = (2 * Math.atan(tanMain) * 180 / Math.PI) / mainEl.clientWidth;
  const capMag = Math.max(1.3, mainDegPerPx / (nativeDegPerPx * 0.8));
  const mag = Math.min(st.mag, capMag);
  const lensFov = Math.max(LENS_FOV.min, Math.min(LENS_FOV.max,
    (2 * Math.atan((st.size / mainEl.clientWidth) * tanMain / mag) * 180) / Math.PI));
  lens.zoom(fovToZoom(lensFov, LENS_FOV));
  lens.rotate({ yaw: sph.yaw, pitch: sph.pitch });
  st.lastLensFov = lensFov; st.lastMag = mag;
}
const schedule = () => { if (!st.dirty) { st.dirty = true; requestAnimationFrame(updateLens); } };

const setPointer = (e) => { st.pointer = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch', visible: true }; schedule(); };
mainEl.addEventListener('pointermove', setPointer);
mainEl.addEventListener('pointerdown', setPointer);
mainEl.addEventListener('pointerleave', () => { if (st.pointer) st.pointer.visible = false; schedule(); });
mainEl.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch' && st.pointer) { st.pointer.visible = false; schedule(); } });
mainEl.addEventListener('pointercancel', () => { if (st.pointer) st.pointer.visible = false; schedule(); });
// Con el mouse quieto, arrastrar o hacer zoom cambia lo que hay bajo el cursor.
for (const ev of ['position-updated', 'zoom-updated', 'ready']) main.addEventListener(ev, schedule);
main.addEventListener('size-updated', () => { applyLensSize(); schedule(); markMore(); });
window.addEventListener('resize', () => { applyLensSize(); markMore(); schedule(); });

// --- Menú de panorámicas ---------------------------------------------------------------------
const nav = $('switch');
const tabs = {};
for (const id of ids) {
  const b = document.createElement('button');
  b.type = 'button'; b.role = 'tab'; b.dataset.pano = id;
  b.textContent = panos[id].title ?? id;
  b.setAttribute('aria-selected', String(id === pid));
  b.addEventListener('click', () => switchTo(id));
  nav.appendChild(b); tabs[id] = b;
}
if (ids.length < 2) nav.style.display = 'none';
const markActive = () => { for (const id of ids) tabs[id].setAttribute('aria-selected', String(id === pid)); };

// Las bases (≈240 KB) de las otras panorámicas se precargan: el cambio se siente casi instantáneo.
const prefetch = () => { for (const id of ids) if (id !== pid) new Image().src = `${tilesBase}/${id}/base.jpg`; };
main.addEventListener('ready', prefetch, { once: true });

async function switchTo(id) {
  if (id === pid || st.switching || !panos[id]) return;
  st.switching = true;
  lensEl.style.display = 'none';
  pid = id; cur = panos[id]; markActive();
  const u = new URL(location.href); u.searchParams.set('pano', id); history.replaceState(null, '', u);
  mainEl.classList.add('fading');
  await new Promise((r) => setTimeout(r, 220));
  const opts = { transition: false, position: { yaw: 0, pitch: 0 }, zoom: DEFAULT_ZOOM };
  try {
    await main.setPanorama(panoramaOf(id), { ...opts, showLoader: true });
    lens.setPanorama(panoramaOf(id), { ...opts, showLoader: false }).catch(() => {});
  } catch (e) { console.error('No se pudo cambiar de panorámica', e); }
  mainEl.classList.remove('fading');
  st.switching = false;
  schedule();
}

markMore();

// Para pruebas funcionales
window.app = { main, lens, st, panos, switchTo, updateLens, get pid() { return pid; }, get cfg() { return cur; } };
