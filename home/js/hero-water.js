/* ════════════════════════════════════════════════════
   EFECTO AGUA — solo hero, solo móvil, solo al tocar
   ════════════════════════════════════════════════════
   Adaptado de openghost-site/assets/js/water-effect.js:
   misma simulación de onda 2D con doble buffer, pero disparada
   por toque (pointerdown/pointermove) en vez de mousemove, y
   aplicada a dos superficies independientes — el texto del hero
   y el canvas del escáner viajero — cada una con su propia
   simulación para que el punto de contacto quede alineado en
   ambas sin pelear con sistemas de coordenadas distintos.
   ════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (!window.matchMedia('(max-width: 768px)').matches) return;

  var hero = document.getElementById('hero');
  var heroContent = document.querySelector('.hero-content');
  var scannerCanvas = document.getElementById('hero-scanner-canvas');
  if (!hero || !heroContent) return;

  var RW = 96, RH = 64;
  var DAMP = 0.95;
  var GRAD = 26;

  var svgNS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(svgNS, 'svg');
  svg.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;pointer-events:none';
  document.body.appendChild(svg);

  var uid = 0;

  function makeRipple(target, scale) {
    uid += 1;
    var filterId = 'wfx-' + uid;
    var imgId = 'wfx-img-' + uid;

    var defs = document.createElementNS(svgNS, 'defs');
    var filter = document.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-40%');
    filter.setAttribute('y', '-40%');
    filter.setAttribute('width', '180%');
    filter.setAttribute('height', '180%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    var feImage = document.createElementNS(svgNS, 'feImage');
    feImage.setAttribute('id', imgId);
    feImage.setAttribute('href', '');
    feImage.setAttribute('preserveAspectRatio', 'none');
    feImage.setAttribute('result', 'dm');

    var feDisp = document.createElementNS(svgNS, 'feDisplacementMap');
    feDisp.setAttribute('in', 'SourceGraphic');
    feDisp.setAttribute('in2', 'dm');
    feDisp.setAttribute('scale', String(scale));
    feDisp.setAttribute('xChannelSelector', 'R');
    feDisp.setAttribute('yChannelSelector', 'G');

    filter.appendChild(feImage);
    filter.appendChild(feDisp);
    defs.appendChild(filter);
    svg.appendChild(defs);

    var bufCur = new Float32Array(RW * RH);
    var bufPre = new Float32Array(RW * RH);

    var dCanvas = document.createElement('canvas');
    dCanvas.width = RW; dCanvas.height = RH;
    var dCtx = dCanvas.getContext('2d');
    var pix = dCtx.createImageData(RW, RH);
    for (var i = 0; i < pix.data.length; i += 1) pix.data[i] = i % 4 === 3 ? 255 : 128;

    function stepWave() {
      for (var y = 1; y < RH - 1; y += 1) {
        for (var x = 1; x < RW - 1; x += 1) {
          var idx = y * RW + x;
          bufPre[idx] = (bufCur[idx - 1] + bufCur[idx + 1] + bufCur[idx - RW] + bufCur[idx + RW]) * 0.5 - bufPre[idx];
          bufPre[idx] *= DAMP;
        }
      }
      var tmp = bufCur; bufCur = bufPre; bufPre = tmp;
    }

    function drop(nx, ny, strength, radius) {
      var cx = Math.round(nx * (RW - 1));
      var cy = Math.round(ny * (RH - 1));
      var dropRadius = Math.max(2, Math.min(Math.round(radius || 3), 9));
      for (var dy = -dropRadius; dy <= dropRadius; dy += 1) {
        for (var dx = -dropRadius; dx <= dropRadius; dx += 1) {
          var x = cx + dx, y = cy + dy;
          if (x < 1 || x >= RW - 1 || y < 1 || y >= RH - 1) continue;
          var d = Math.sqrt(dx * dx + dy * dy) / dropRadius;
          if (d < 1) bufCur[y * RW + x] += strength * (1 - d);
        }
      }
    }

    function hasEnergy() {
      for (var i = 0; i < bufCur.length; i += 8) {
        if (Math.abs(bufCur[i]) > 0.008) return true;
      }
      return false;
    }

    function buildDispURL() {
      var d = pix.data;
      for (var y = 1; y < RH - 1; y += 1) {
        for (var x = 1; x < RW - 1; x += 1) {
          var idx = y * RW + x, p = idx * 4;
          var gx = (bufCur[idx + 1] - bufCur[idx - 1]) * 0.5;
          var gy = (bufCur[idx + RW] - bufCur[idx - RW]) * 0.5;
          d[p] = Math.min(255, Math.max(0, gx * GRAD + 128)) | 0;
          d[p + 1] = Math.min(255, Math.max(0, gy * GRAD + 128)) | 0;
          d[p + 2] = 128;
          d[p + 3] = 255;
        }
      }
      dCtx.putImageData(pix, 0, 0);
      return dCanvas.toDataURL();
    }

    var feImgEl = document.getElementById(imgId);
    feImgEl.setAttribute('href', buildDispURL());
    target.style.filter = 'url(#' + filterId + ')';
    target.style.willChange = 'filter';

    var raf = null;

    function tick() {
      stepWave();
      feImgEl.setAttribute('href', buildDispURL());
      if (hasEnergy()) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    return {
      drop: function (nx, ny, strength, radius) {
        drop(nx, ny, strength, radius);
        if (!raf) raf = requestAnimationFrame(tick);
      },
    };
  }

  var textRipple = makeRipple(heroContent, 14);
  var canvasRipple = scannerCanvas ? makeRipple(scannerCanvas, 6) : null;

  /* ── Entrada táctil: una gota por movimiento, con la velocidad del
     dedo controlando la fuerza de la onda. Coordenadas normalizadas
     de forma independiente para cada superficie (texto vs. canvas
     de viewport completo) para que el punto de contacto coincida en
     ambas sin compartir un único espacio de coordenadas. ── */
  var px = 0, py = 0, active = false;

  function dropBoth(clientX, clientY, velocity) {
    var hr = heroContent.getBoundingClientRect();
    var tx = (clientX - hr.left) / Math.max(hr.width, 1);
    var ty = (clientY - hr.top) / Math.max(hr.height, 1);
    if (tx > -0.15 && tx < 1.15 && ty > -0.15 && ty < 1.15) {
      textRipple.drop(Math.min(Math.max(tx, 0), 1), Math.min(Math.max(ty, 0), 1), velocity * 70);
    }

    if (canvasRipple) {
      var cx = clientX / window.innerWidth;
      var cy = clientY / window.innerHeight;
      canvasRipple.drop(cx, cy, velocity * 70);
    }
  }

  /* API mínima para que hero-scanner.js pueda generar ondas desde el
     movimiento idle y desde la velocidad de scroll. La entrada táctil
     continúa usando exactamente la misma simulación. */
  window.InteriorsHeroWater = {
    dropAt: function (clientX, clientY, strength, radius) {
      var rect = hero.getBoundingClientRect();
      if (clientY < rect.top - 40 || clientY > rect.bottom + 40) return;
      if (!canvasRipple) return;
      var velocity = Math.max(0.03, Math.min(strength || 0.1, 0.8));
      canvasRipple.drop(
        Math.min(Math.max(clientX / window.innerWidth, 0), 1),
        Math.min(Math.max(clientY / window.innerHeight, 0), 1),
        velocity * 70,
        radius || 3
      );
    },
  };

  hero.addEventListener('pointerdown', function (e) {
    active = true;
    px = e.clientX; py = e.clientY;
    dropBoth(e.clientX, e.clientY, 0.6);
  }, { passive: true });

  hero.addEventListener('pointermove', function (e) {
    if (!active) return;
    var vx = e.clientX - px, vy = e.clientY - py;
    var vel = Math.min(Math.sqrt(vx * vx + vy * vy), 60) / 60;
    px = e.clientX; py = e.clientY;
    if (vel > 0.02) dropBoth(e.clientX, e.clientY, vel);
  }, { passive: true });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (name) {
    hero.addEventListener(name, function () { active = false; }, { passive: true });
  });
}());
