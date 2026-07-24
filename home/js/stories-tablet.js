/* ============================================================
   TABLET VIAJERA · TECH -> STORIE -> GALLERIA (solo móvil)

   IMPORTANTE:
   - Usa el mismo #canvas-tablet y el mismo GLB de tech-models.js.
   - No hay una segunda tablet, crossfade ni cambios de opacidad.
   - TABLET_CFG conserva la entrada original de "Due tecnologie".
   - Las variables del recorrido nuevo están agrupadas aquí.
   ============================================================ */
(function () {
  'use strict';

  if (!window.matchMedia('(max-width: 768px)').matches) return;

  /* ── VARIABLES EDITABLES DEL RECORRIDO ─────────────────────
     offsetX / offsetY mueven el rectángulo del canvas en px.
     canvasScale cambia su tamaño visual sin redimensionar WebGL.
     pose.pos / pose.rot / pose.scale ajustan el modelo dentro
     del canvas; rot está expresado en radianes. */
  var TABLET_JOURNEY_CFG = {
    /*
     * Primer estado posterior a la animación original.
     * Se alcanza mientras Storie se acerca al viewport.
     */
    intermediate: {
      selector: '#stories',
      corner: 'top-right',
      offsetX: 18,
      offsetY: -185,
      canvasScale: 1.05,
      pose: {
        pos: [0.20, 0.30, 0],
        /* Frente neutro del GLB: sin inclinación hacia atrás ni roll. */
        rot: [Math.PI * 0.50, Math.PI * -0.50, 0],
        scale: 6.20,
        fov: 50,
        camZ: 12
      }
    },

    /*
     * Estado inicial dentro de Storie di Successo.
     */
    storiesIn: {
      selector: '#stories .stories-header',
      corner: 'top-right',
      offsetX: 22,
      offsetY: 58,
      canvasScale: 1.07,
      pose: {
        pos: [0.08, 0.32, 0],
        /* Frente neutro del GLB: sin inclinación hacia atrás ni roll. */
        rot: [Math.PI * 0.50, Math.PI * -0.50, 0],
        scale: 6.05,
        fov: 50,
        camZ: 12
      }
    },

    /*
     * Estado final. offsetX = 0 alinea el borde derecho del
     * canvas con el borde derecho de la caja de la galería.
     */
    galleryEnd: {
      selector: '.stories-gallery-cta',
      corner: 'top-right',
      offsetX: 36,
      offsetY: -80,
      canvasScale: 0.88,
      pose: {
        pos: [0.05, 0.7, 0],
        /* Frente neutro del GLB: sin inclinación hacia atrás ni roll. */
        rot: [Math.PI * 0.50, Math.PI * -0.50, 0],
        scale: 5.45,
        fov: 50,
        camZ: 12
      }
    },

    /*
     * Cuándo se alcanza cada estado, expresado como fracción
     * de la altura visible antes de que el elemento llegue arriba.
     */
    timing: {
      /* Px que la tablet espera inmóvil al terminar la animación original. */
      handoffDelayPx: 540,
      intermediateViewportLead: 0.92,
      storiesViewportLead: 0.48,
      galleryViewportLead: 0.64,
      smoothing: 0.075
    }
  };

  var source = window.Interiors3DTabletJourneySource;
  var canvas = document.getElementById('canvas-tablet');
  var placeholder = canvas && canvas.parentElement;
  var techSection = document.getElementById('tech');
  var storiesSection = document.getElementById('stories');
  var gallery = document.querySelector('.stories-gallery-cta');

  if (
    !source ||
    !source.viewer ||
    !source.cfg ||
    !canvas ||
    !placeholder ||
    !techSection ||
    !storiesSection ||
    !gallery
  ) {
    return;
  }

  var viewer = source.viewer;
  var originalCfg = source.cfg;
  var timeline = [];
  var currentPlayhead = 0;
  var targetPlayhead = 0;
  var initialized = false;
  var previousTimestamp = 0;
  var layoutDirty = true;
  var layout = {
    tech: null,
    placeholder: null
  };
  var reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /*
   * El canvas sale de la columna de #tech una sola vez. La columna
   * permanece como placeholder y conserva exactamente su layout.
   */
  document.body.appendChild(canvas);
  canvas.classList.add('tablet-journey-canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.opacity = '1';

  function number(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(a, b, progress) {
    return a + (b - a) * progress;
  }

  function smoothstep(progress) {
    var safe = clamp(progress, 0, 1);
    return safe * safe * (3 - 2 * safe);
  }

  function pageRect(element) {
    var rect = element.getBoundingClientRect();
    var scrollX = window.scrollX || window.pageXOffset || 0;
    var scrollY = window.scrollY || window.pageYOffset || 0;

    return {
      left: rect.left + scrollX,
      top: rect.top + scrollY,
      right: rect.right + scrollX,
      bottom: rect.bottom + scrollY,
      width: rect.width,
      height: rect.height
    };
  }

  function poseFromOriginalEnd() {
    return {
      pos: [
        number(originalCfg.endPosX, originalCfg.startPosX),
        number(originalCfg.endPosY, originalCfg.startPosY),
        number(originalCfg.endPosZ, originalCfg.startPosZ)
      ],
      rot: [
        number(originalCfg.endRotX, originalCfg.startRotX),
        number(originalCfg.endRotY, originalCfg.startRotY),
        number(originalCfg.endRotZ, originalCfg.startRotZ)
      ],
      scale: number(originalCfg.endScale, originalCfg.startScale),
      fov: number(originalCfg.endFov, originalCfg.startFov),
      camZ: number(originalCfg.endCamZ, originalCfg.startCamZ)
    };
  }

  function anchorRect(anchor) {
    var element = document.querySelector(anchor.selector);
    if (!element) return null;

    var rect = pageRect(element);
    var baseWidth = layout.placeholder
      ? layout.placeholder.width
      : 210;
    var baseHeight = layout.placeholder
      ? layout.placeholder.height
      : 290;
    var canvasScale = number(anchor.canvasScale, 1);
    var width = baseWidth * canvasScale;
    var height = baseHeight * canvasScale;
    var left = rect.left + number(anchor.offsetX, 0);
    var top = rect.top + number(anchor.offsetY, 0);

    if (anchor.corner === 'top-right') {
      left = rect.right - width + number(anchor.offsetX, 0);
    } else if (anchor.corner === 'bottom-right') {
      left = rect.right - width + number(anchor.offsetX, 0);
      top = rect.bottom - height + number(anchor.offsetY, 0);
    } else if (anchor.corner === 'bottom-left') {
      top = rect.bottom - height + number(anchor.offsetY, 0);
    }

    return {
      left: left,
      top: top,
      width: width,
      height: height,
      canvasScale: canvasScale
    };
  }

  function techRect(progress) {
    var rect = layout.placeholder || pageRect(placeholder);
    var startY = number(originalCfg.startY, 0);
    var endY = number(originalCfg.endY, 0);

    return {
      left: rect.left,
      top: rect.top + lerp(startY, endY, progress),
      width: rect.width,
      height: rect.height,
      canvasScale: 1
    };
  }

  function measureTimeline() {
    var viewportHeight = Math.max(window.innerHeight, 1);
    var tech = pageRect(techSection);
    var placeholderRect = pageRect(placeholder);
    var stories = pageRect(storiesSection);
    var galleryRect = pageRect(gallery);
    var triggerEnd = number(originalCfg.triggerEnd, 1);

    layout.tech = tech;
    layout.placeholder = placeholderRect;

    /*
     * Resolución algebraica del mismo progreso global utilizado por
     * tech-models.js. Así el handoff ocurre justo donde TABLET_CFG
     * alcanzaría progress === 1, sin una cifra duplicada a ojo.
     */
    var handoffY =
      tech.top -
      viewportHeight +
      triggerEnd * (viewportHeight + tech.height);

    var journeyStartY =
      handoffY +
      number(TABLET_JOURNEY_CFG.timing.handoffDelayPx, 0);

    var intermediateY = Math.max(
      journeyStartY + 1,
      stories.top -
        viewportHeight *
          TABLET_JOURNEY_CFG.timing.intermediateViewportLead
    );

    var storiesY = Math.max(
      intermediateY + 1,
      stories.top -
        viewportHeight *
          TABLET_JOURNEY_CFG.timing.storiesViewportLead
    );

    var galleryY = Math.max(
      storiesY + 1,
      galleryRect.top -
        viewportHeight *
          TABLET_JOURNEY_CFG.timing.galleryViewportLead
    );

    var techEndRect = techRect(1);
    var intermediateRect = anchorRect(TABLET_JOURNEY_CFG.intermediate);
    var storiesInRect = anchorRect(TABLET_JOURNEY_CFG.storiesIn);
    var galleryEndRect = anchorRect(TABLET_JOURNEY_CFG.galleryEnd);

    if (!intermediateRect || !storiesInRect || !galleryEndRect) return;

    timeline = [
      {
        y: journeyStartY,
        rect: techEndRect,
        pose: poseFromOriginalEnd()
      },
      {
        y: intermediateY,
        rect: intermediateRect,
        pose: TABLET_JOURNEY_CFG.intermediate.pose
      },
      {
        y: storiesY,
        rect: storiesInRect,
        pose: TABLET_JOURNEY_CFG.storiesIn.pose
      },
      {
        y: galleryY,
        rect: galleryEndRect,
        pose: TABLET_JOURNEY_CFG.galleryEnd.pose
      }
    ];

    layoutDirty = false;
  }

  function originalProgress(scrollY) {
    var viewportHeight = Math.max(window.innerHeight, 1);
    var tech = layout.tech || pageRect(techSection);
    var globalProgress = clamp(
      (viewportHeight - (tech.top - scrollY)) /
        (viewportHeight + tech.height),
      0,
      1
    );
    var start = number(originalCfg.triggerStart, 0);
    var end = number(originalCfg.triggerEnd, 1);
    var range = end - start;

    if (Math.abs(range) < 0.000001) {
      return globalProgress >= end ? 1 : 0;
    }

    return clamp((globalProgress - start) / range, 0, 1);
  }

  function playheadForScroll(scrollY) {
    if (timeline.length < 4) return originalProgress(scrollY);
    if (scrollY <= timeline[0].y) return originalProgress(scrollY);

    for (var index = 0; index < timeline.length - 1; index += 1) {
      var from = timeline[index];
      var to = timeline[index + 1];

      if (scrollY <= to.y) {
        var range = Math.max(to.y - from.y, 1);
        return 1 + index + clamp((scrollY - from.y) / range, 0, 1);
      }
    }

    return timeline.length;
  }

  function interpolateArray(from, to, progress) {
    return [
      lerp(number(from[0], 0), number(to[0], 0), progress),
      lerp(number(from[1], 0), number(to[1], 0), progress),
      lerp(number(from[2], 0), number(to[2], 0), progress)
    ];
  }

  function interpolatePose(from, to, progress) {
    return {
      pos: interpolateArray(from.pos, to.pos, progress),
      rot: interpolateArray(from.rot, to.rot, progress),
      scale: lerp(from.scale, to.scale, progress),
      fov: lerp(from.fov, to.fov, progress),
      camZ: lerp(from.camZ, to.camZ, progress)
    };
  }

  function interpolateRect(from, to, progress) {
    return {
      left: lerp(from.left, to.left, progress),
      top: lerp(from.top, to.top, progress),
      width: lerp(from.width, to.width, progress),
      height: lerp(from.height, to.height, progress),
      canvasScale: lerp(
        number(from.canvasScale, 1),
        number(to.canvasScale, 1),
        progress
      )
    };
  }

  function sampleJourney(playhead) {
    var segment = clamp(Math.floor(playhead - 1), 0, timeline.length - 2);
    var progress = smoothstep(playhead - (segment + 1));
    var from = timeline[segment];
    var to = timeline[segment + 1];

    return {
      rect: interpolateRect(from.rect, to.rect, progress),
      pose: interpolatePose(from.pose, to.pose, progress)
    };
  }

  function placeCanvas(rect) {
    var scrollX = window.scrollX || window.pageXOffset || 0;
    var scrollY = window.scrollY || window.pageYOffset || 0;
    var dpr = window.devicePixelRatio || 1;
    var left = Math.round((rect.left - scrollX) * dpr) / dpr;
    var top = Math.round((rect.top - scrollY) * dpr) / dpr;
    var baseWidth = Math.max(
      1,
      layout.placeholder
        ? layout.placeholder.width
        : rect.width
    );
    var baseHeight = Math.max(
      1,
      layout.placeholder
        ? layout.placeholder.height
        : rect.height
    );
    var canvasScale = number(rect.canvasScale, 1);

    canvas.style.width = baseWidth.toFixed(2) + 'px';
    canvas.style.height = baseHeight.toFixed(2) + 'px';
    canvas.style.transformOrigin = '0 0';
    canvas.style.transform =
      'translate3d(' + left + 'px,' + top + 'px,0) ' +
      'scale(' + canvasScale.toFixed(5) + ')';
  }

  function renderState(playhead) {
    if (playhead <= 1 || timeline.length < 4) {
      var techProgress = clamp(playhead, 0, 1);
      viewer.setJourneyPose(null);
      viewer.setProgress(techProgress);
      placeCanvas(techRect(techProgress));
      return;
    }

    var journey = sampleJourney(playhead);
    viewer.setProgress(1);
    viewer.setJourneyPose(journey.pose);
    placeCanvas(journey.rect);
  }

  function markLayoutDirty() {
    layoutDirty = true;
  }

  window.addEventListener('resize', markLayoutDirty, { passive: true });
  window.addEventListener('orientationchange', markLayoutDirty, {
    passive: true
  });
  window.addEventListener('load', markLayoutDirty);

  if (typeof ResizeObserver !== 'undefined') {
    var observer = new ResizeObserver(markLayoutDirty);
    observer.observe(placeholder);
    observer.observe(techSection);
    observer.observe(storiesSection);
    observer.observe(gallery);
  }

  function tick(timestamp) {
    if (layoutDirty || timeline.length < 4) {
      measureTimeline();
    }

    targetPlayhead = playheadForScroll(
      window.scrollY || window.pageYOffset || 0
    );

    if (!initialized) {
      currentPlayhead = targetPlayhead;
      initialized = true;
    } else if (reducedMotion) {
      currentPlayhead = targetPlayhead;
    } else {
      var delta = previousTimestamp
        ? Math.min((timestamp - previousTimestamp) / 1000, 0.05)
        : 1 / 60;
      var speed = clamp(
        number(TABLET_JOURNEY_CFG.timing.smoothing, 0.075),
        0,
        1
      );
      var frameAlpha = 1 - Math.pow(1 - speed, delta * 60);

      currentPlayhead +=
        (targetPlayhead - currentPlayhead) * frameAlpha;

      if (Math.abs(targetPlayhead - currentPlayhead) < 0.0001) {
        currentPlayhead = targetPlayhead;
      }
    }

    previousTimestamp = timestamp;
    renderState(currentPlayhead);
  }

  measureTimeline();
  viewer.setFrameUpdater(tick);
}());
