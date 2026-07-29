/* ════════════════════════════════════════════════════
   ESCÁNER VIAJERO — solo móvil (<=768px)
   ════════════════════════════════════════════════════
   Un único modelo 3D que recorre la página siguiendo el scroll:
   hero -> cards (Soluzioni) -> panel "Scanner 3D" de #tech.
   El canvas permanece siempre fijo y a pantalla completa; únicamente
   cambia la pose del modelo dentro de él. Así no hay reparentados,
   cambios de aspect ratio ni fotogramas donde el escáner desaparezca.
   #canvas-scanner (el visor propio de #tech en tech-models.js) queda
   oculto en móvil porque este mismo objeto ocupa su lugar.

   Para ajustar posición/rotación/escala de cada parada, edita
   ANCHORS aquí abajo. DOCK_TARGET controla la pose final dentro
   del panel. Todo lo demás (medición de secciones, interpolación,
   redimensionado del canvas, animación idle) es el motor y no
   hace falta tocarlo para retocar el recorrido.
   ════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (!window.matchMedia('(max-width: 768px)').matches) return;
  if (typeof THREE === 'undefined') return;

  var canvas = document.getElementById('hero-scanner-canvas');
  if (!canvas) return;

  var heroSection = document.getElementById('hero');
  /* El canvas ya vive directamente en <body>, antes de las secciones. Nunca
     se cambia de padre: el orden visual se resuelve exclusivamente por CSS. */

  /* Hueco real del panel "Scanner 3D" de #tech (lado izquierdo, no el de
     la tablet). El canvas nunca se mueve al DOM ahí dentro — solo leemos
     su posición en pantalla para saber dónde "aterrizar". */
  var dockAnchor = document.querySelector('.tech-panel-wrap:not(.right) .tech-img-col');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ASSET_BASE = (document.body && document.body.dataset.assetBase) || '';
  /* Variante móvil: misma apariencia y textura, con geometría ligeramente
     simplificada y cuantizada para reducir transferencia y memoria. */
  var MODEL_PATH = ASSET_BASE + 'assets/models/scanner_hunyuan-mobile.glb?v=20260723-opt2';

  /* ════════════════════════════════════════════════════
     ANCLAS — posición/rotación (unidades de mundo Three.js)
     y escala (multiplicador) por parada. opacity 0 = oculto.
     ════════════════════════════════════════════════════ */
  /* Giro completo durante el trayecto hero -> cards. La orientación final
     apunta el frente del escáner hacia el carrusel situado a su derecha. */
  var CARD_FULL_TURN = Math.PI * 2;

  /* CONTROLES DEL RECORRIDO HERO -> CARDS
     HERO_ANIMATION_START: espera inicial en píxeles. En 0, el modelo empieza
     a transformarse desde el primer píxel de scroll.
     TRANSITION_BEFORE_SOLUTIONS: distancia antes de Soluzioni donde llega
     al estado compacto intermedio.
     Desde ese punto comienza directamente el viaje hacia tecnología. */
  var HERO_ANIMATION_START = -3;
  var TRANSITION_BEFORE_SOLUTIONS = 400;

  /* El estado final queda listo cuando el hueco de tecnología alcanza
     aproximadamente el 46% del viewport. En un iPhone 14 Pro Max son unos
     429px: coincide con el punto donde el parallax negro ya entró, pero las
     cards blancas todavía siguen visibles arriba. */
  var DOCK_ARRIVE_VIEWPORT_RATIO = 0.72;
  /* El acople empieza antes de que el fondo negro cubra por completo las
     cards. Esto reduce pronto el modelo y lo conduce por el margen izquierdo,
     evitando que el mango atraviese el contenido de tecnologías. */
  var DOCK_TRAVEL_BEFORE_TECH = 760;
  /* El estado intermedio sucede en la mitad visual de Soluciones. Para ese
     punto completa solo el 58% del cambio: el resto se reparte sobre un tramo
     de scroll amplio hasta tecnología, sin acelerón en los últimos píxeles. */
  var DOCK_APPROACH_SCROLL_RATIO = 0.38;
  var DOCK_APPROACH_POSE_RATIO = 0.58;
  /* Porcentaje de la altura del hueco de tecnología que ocupa el escáner.
     Se convierte a unidades Three.js manteniendo el canvas fullscreen. */
  /* Ajustes exclusivos del estado final dentro de "Due tecnologie".
     1.025 = 0.82 * 1.25, por lo que el modelo queda 25% más grande. */
  var DOCK_MODEL_HEIGHT_RATIO = 1.025;
  var DOCK_MODEL_Y_OFFSET_PX = 18;

  var ANCHORS = {
    hero:      { pos: [0.55, 0.45, 0], rot: [-0.40, -0.35, 0.1], scale: 2.2, opacity: 0.92 },
    transition:{ pos: [-1, -.5, 0], rot: [0.1, 0.20, 0], scale: 0.80, opacity: 0.98 },
    /* Pose final, ya encogido dentro del hueco de 160x250 del panel de
       tech. Coincide con la pose de reposo que tenía el visor propio de
       #tech (SCANNER_CFG, progreso 1) para que se sienta como el mismo
       lugar de siempre. Ajustar "scale" aquí si se ve grande/chico dentro
       del hueco. */
    /* Se conserva la vuelta completa en el valor Y para que la interpolación
       desde la transición tome el camino corto, aunque visualmente sea el mismo
       ángulo que Math.PI * 0.15. */
    dock:      { pos: [-0.65, 0.15, 0], rot: [0.02, Math.PI * 0.15 - CARD_FULL_TURN, 0], scale: 1.05, opacity: 1 },
  };

  /* ════════════════════════════════════════════════════
     Motor Three.js — igual de sencillo que tech-models.js
     ════════════════════════════════════════════════════ */

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2));
  if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  if ('outputColorSpace' in renderer && typeof THREE.SRGBColorSpace !== 'undefined') {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.01, 200);
  camera.position.set(0, 0, 5);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  var key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2, 3, 3);
  scene.add(key);
  var fill = new THREE.DirectionalLight(0x00bfc4, 0.5);
  fill.position.set(-3, -1, -2);
  scene.add(fill);

  var modelRoot = new THREE.Group();
  scene.add(modelRoot);

  var model = null;
  var normalizedBaseScale = 1;
  var solutionsTitleLayer = document.querySelector('.solutions-title-top-layer');

  function updateSolutionsTitleLayerVisibility() {
    if (!solutionsTitleLayer) return;
    var title = solutionsTitleLayer.querySelector('.section-title');
    var tech = document.getElementById('tech');
    if (!title || !tech) return;

    solutionsTitleLayer.style.visibility = (
      tech.getBoundingClientRect().top <= title.getBoundingClientRect().bottom
    ) ? 'hidden' : 'visible';
  }

  updateSolutionsTitleLayerVisibility();
  window.addEventListener('scroll', updateSolutionsTitleLayerVisibility, {
    passive: true
  });
  window.addEventListener('resize', updateSolutionsTitleLayerVisibility, {
    passive: true
  });

  /* Máscara de oclusión de cards.
     #solutions usa position:sticky y por ello crea un stacking context
     completo. Un z-index interno no puede superar limpiamente al canvas fijo
     externo sin subir también el fondo blanco. La máscara conserva el canvas
     global, pero perfora exactamente las cards que están visibles, haciendo
     que el mismo escáner parezca pasar por detrás de ellas. */
  function clearScannerBehindVisibleCards() {
    var cards = document.querySelectorAll('#solutions .sol-card');
    if (!cards.length) return;

    var viewportW = window.innerWidth;
    var viewportH = window.innerHeight;
    var tech = document.getElementById('tech');
    var techTop = tech ? tech.getBoundingClientRect().top : viewportH;
    var visibleCardsBottom = clamp(techTop, 0, viewportH);
    var hasScissor = false;

    function clearViewportRect(rect, paddingX, paddingY) {
      var left = Math.max(0, rect.left - paddingX);
      var right = Math.min(viewportW, rect.right + paddingX);
      var top = Math.max(0, rect.top - paddingY);
      var bottom = Math.min(viewportH, rect.bottom + paddingY, visibleCardsBottom);
      if (right <= left || bottom <= top) return;

      renderer.setScissor(
        Math.floor(left),
        Math.floor(viewportH - bottom),
        Math.ceil(right - left),
        Math.ceil(bottom - top)
      );
      renderer.setScissorTest(true);
      renderer.clear(true, true, true);
      hasScissor = true;
    }

    for (var i = 0; i < cards.length; i += 1) {
      clearViewportRect(cards[i].getBoundingClientRect(), 0, 0);
    }

    if (hasScissor) renderer.setScissorTest(false);
  }

  var modelLoader = new THREE.GLTFLoader();
  if (typeof MeshoptDecoder !== 'undefined' && modelLoader.setMeshoptDecoder) {
    modelLoader.setMeshoptDecoder(MeshoptDecoder);
  }
  modelLoader.load(
    MODEL_PATH,
    function (gltf) {
      model = gltf.scene;
      var box = new THREE.Box3().setFromObject(model);
      var size = box.getSize(new THREE.Vector3());
      var center = box.getCenter(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z);
      normalizedBaseScale = maxDim > 0 ? 1 / maxDim : 1;
      model.position.set(-center.x, -center.y, -center.z);
      modelRoot.add(model);
      canvas.style.opacity = '0';
      applyFrame();
    },
    undefined,
    function (error) {
      console.error('[hero-scanner] Error cargando modelo:', MODEL_PATH, error);
    }
  );

  /* ════════════════════════════════════════════════════
     Canvas fullscreen estable durante todo el recorrido.
     ════════════════════════════════════════════════════ */

  function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function fullscreenRect() {
    return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  }

  /* Debe empezar en cero. Si se inicializa con innerWidth/innerHeight,
     applyRect cree que el canvas ya está dimensionado y deja la cámara con
     aspect=1 y el buffer WebGL en 300x150. Ese era el bug que aplastaba el
     escáner hasta que el primer resize provocado por el scroll lo corregía. */
  var currentRectW = 0;
  var currentRectH = 0;

  function applyRect(rect) {
    var dpr = window.devicePixelRatio || 1;
    var left = Math.round(rect.left * dpr) / dpr;
    var top = Math.round(rect.top * dpr) / dpr;
    canvas.style.left = left + 'px';
    canvas.style.top = top + 'px';
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    if (Math.abs(rect.width - currentRectW) > 0.5 || Math.abs(rect.height - currentRectH) > 0.5) {
      currentRectW = rect.width;
      currentRectH = rect.height;
      var ratio = renderer.getPixelRatio();
      renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false);
      camera.aspect = Math.max(rect.width, 1) / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
      void ratio;
    }
  }

  function worldSizeAtModelPlane() {
    var distance = Math.abs(camera.position.z);
    var worldHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
    return {
      width: worldHeight * camera.aspect,
      height: worldHeight,
    };
  }

  function dockPoseFromScreenRect(rect) {
    var world = worldSizeAtModelPlane();
    var centerX = rect.left + rect.width * 0.5;
    var centerY = rect.top + rect.height * 0.5 + DOCK_MODEL_Y_OFFSET_PX;
    return {
      pos: [
        (centerX / Math.max(window.innerWidth, 1) - 0.5) * world.width,
        (0.5 - centerY / Math.max(window.innerHeight, 1)) * world.height,
        0,
      ],
      scale: Math.max(
        0.55,
        (rect.height * DOCK_MODEL_HEIGHT_RATIO / Math.max(window.innerHeight, 1)) * world.height
      ),
    };
  }

  /* Fuerza desde el primer frame el tamaño real del buffer y el aspect ratio
     correcto de la cámara. */
  applyRect(fullscreenRect());

  window.addEventListener('resize', function () {
    applyRect(fullscreenRect());
    measureTimeline();
  }, { passive: true });

  /* ════════════════════════════════════════════════════
     Timeline — puntos de scroll (px, documento) construidos
     a partir de las secciones reales, recalculados en resize.
     ════════════════════════════════════════════════════ */

  var timeline = [];
  var dockTravelStartY = 0;
  var dockApproachY = 0;
  var dockY = 0;

  function measureTimeline() {
    var hero = document.getElementById('hero');
    var solutions = document.getElementById('solutions');
    var tech = document.getElementById('tech');
    if (!hero || !solutions || !tech) return;

    var solTop = solutions.offsetTop;
    var techTop = tech.offsetTop;
    var heroMotionStart = Math.max(0, HERO_ANIMATION_START);
    var transitionArrive = Math.max(heroMotionStart + 1, solTop - TRANSITION_BEFORE_SOLUTIONS);
    dockTravelStartY = Math.max(
      heroMotionStart + 1,
      Math.min(transitionArrive, techTop - DOCK_TRAVEL_BEFORE_TECH)
    );

    /* Posición real (absoluta en el documento) del hueco del panel. */
    var dockAnchorDocTop = techTop + 128;
    var dockViewportOffset = window.innerHeight * DOCK_ARRIVE_VIEWPORT_RATIO;
    if (dockAnchor) {
      var currentScrollY = window.scrollY || window.pageYOffset || 0;
      var measuredDockRect = dockAnchor.getBoundingClientRect();
      dockAnchorDocTop = measuredDockRect.top + currentScrollY;
      var arrivalPose = dockPoseFromScreenRect({
        left: measuredDockRect.left,
        top: dockViewportOffset,
        width: measuredDockRect.width,
        height: measuredDockRect.height,
      });
      ANCHORS.dock.pos = arrivalPose.pos;
      ANCHORS.dock.scale = arrivalPose.scale;
    }
    dockY = Math.max(dockTravelStartY + 1, dockAnchorDocTop - dockViewportOffset);
    dockApproachY = lerp(dockTravelStartY, dockY, DOCK_APPROACH_SCROLL_RATIO);

    var approachPose = {
      pos: [
        lerp(ANCHORS.transition.pos[0], ANCHORS.dock.pos[0], DOCK_APPROACH_POSE_RATIO),
        lerp(ANCHORS.transition.pos[1], ANCHORS.dock.pos[1], DOCK_APPROACH_POSE_RATIO),
        lerp(ANCHORS.transition.pos[2], ANCHORS.dock.pos[2], DOCK_APPROACH_POSE_RATIO),
      ],
      rot: [
        lerp(ANCHORS.transition.rot[0], ANCHORS.dock.rot[0], DOCK_APPROACH_POSE_RATIO),
        lerp(ANCHORS.transition.rot[1], ANCHORS.dock.rot[1], DOCK_APPROACH_POSE_RATIO),
        lerp(ANCHORS.transition.rot[2], ANCHORS.dock.rot[2], DOCK_APPROACH_POSE_RATIO),
      ],
      scale: lerp(ANCHORS.transition.scale, ANCHORS.dock.scale, DOCK_APPROACH_POSE_RATIO),
      opacity: lerp(ANCHORS.transition.opacity, ANCHORS.dock.opacity, DOCK_APPROACH_POSE_RATIO),
    };

    /* Entramos antes al contexto de Soluzioni: la banda de logos oculta el
       cuerpo central, pero la cola ya puede seguir viéndose por debajo. */
    timeline = [
      { y: 0, a: ANCHORS.hero },
      { y: heroMotionStart, a: ANCHORS.hero },
      { y: dockTravelStartY, a: ANCHORS.transition },
      { y: dockApproachY, a: approachPose },
      { y: dockY, a: ANCHORS.dock },
    ];
  }
  measureTimeline();
  window.addEventListener('resize', measureTimeline, { passive: true });
  window.addEventListener('load', measureTimeline);
  /* Red de seguridad: si el evento 'load' ya se disparó antes de que este
     script (cargado al final del body) llegara a suscribirse, o si algo
     de arriba (imágenes, fuentes) todavía reflowea el layout después,
     medimos otra vez un poco más tarde para no quedarnos con posiciones
     provisionales del primer parseo. */
  setTimeout(measureTimeline, 600);
  setTimeout(measureTimeline, 1500);

  var current = {
    pos: ANCHORS.hero.pos.slice(),
    rot: ANCHORS.hero.rot.slice(),
    scale: ANCHORS.hero.scale,
    opacity: ANCHORS.hero.opacity,
  };
  var firstModelFrame = true;

  function sampleTimeline(scrollY) {
    if (timeline.length < 2) return ANCHORS.hero;
    var i = 0;
    while (i < timeline.length - 2 && scrollY > timeline[i + 1].y) i += 1;
    var k1 = timeline[i];
    var k2 = timeline[i + 1];
    var range = k2.y - k1.y;
    var t = range > 0.0001 ? Math.min(Math.max((scrollY - k1.y) / range, 0), 1) : 1;
    return {
      pos: [lerp(k1.a.pos[0], k2.a.pos[0], t), lerp(k1.a.pos[1], k2.a.pos[1], t), lerp(k1.a.pos[2], k2.a.pos[2], t)],
      rot: [lerp(k1.a.rot[0], k2.a.rot[0], t), lerp(k1.a.rot[1], k2.a.rot[1], t), lerp(k1.a.rot[2], k2.a.rot[2], t)],
      scale: lerp(k1.a.scale, k2.a.scale, t),
      opacity: lerp(k1.a.opacity, k2.a.opacity, t),
    };
  }

  /* ════════════════════════════════════════════════════
     Idle: flotación muy discreta, solo cuando el usuario
     está quieto (sin scroll reciente) y todavía no está
     acoplado en el panel — una vez enganchado, se queda quieto.
     ════════════════════════════════════════════════════ */

  var lastScrollTs = 0;
  var lastScrollY = window.scrollY || window.pageYOffset || 0;
  var scrollWaveStrength = 0;
  var lastWaterDropTs = 0;
  var lastIdleDropTs = 0;
  var dockProgress = 0;

  /* El efecto de agua (hero-water.js) le pone al canvas un filtro SVG de
     desplazamiento pensado para su tamaño de pantalla completa en el hero.
     Si ese filtro se queda puesto mientras el canvas se encoge al hueco
     del panel de tech, el desplazamiento queda desproporcionado y el
     modelo se vuelve invisible. Lo guardamos una vez y lo quitamos al
     empezar el tramo de acople; si el usuario vuelve a subir al hero, se
     restaura. */
  var savedWaterFilter = null;
  window.addEventListener('scroll', function () {
    var nextY = window.scrollY || window.pageYOffset || 0;
    scrollWaveStrength = Math.min(1, scrollWaveStrength + Math.abs(nextY - lastScrollY) / 85);
    lastScrollY = nextY;
    lastScrollTs = performance.now();
  }, { passive: true });

  var SMOOTH = 0.06;

  function applyFrame() {
    if (!model) return;

    var scrollY = window.scrollY || window.pageYOffset || 0;
    var target = sampleTimeline(scrollY);

    /* Tramo final: del estado compacto a "dock" (hueco del
       panel de tech). dockProgress 0 = todavía pantalla completa;
       1 = ya encajado y quieto. */
    var rawDockT = dockY > dockTravelStartY ? (scrollY - dockTravelStartY) / (dockY - dockTravelStartY) : (scrollY >= dockY ? 1 : 0);
    dockProgress = clamp(rawDockT, 0, 1);

    /* Una vez acoplado, la pose sigue el rect real del hueco mientras #tech
       recorre la pantalla. El modelo sale naturalmente del viewport junto con
       su sección, sin cambiar de canvas ni alterar su opacidad. */
    var isDocked = scrollY >= dockY && !!dockAnchor;
    if (isDocked) {
      var liveDockPose = dockPoseFromScreenRect(dockAnchor.getBoundingClientRect());
      target = {
        pos: liveDockPose.pos,
        rot: ANCHORS.dock.rot,
        scale: liveDockPose.scale,
        opacity: ANCHORS.dock.opacity,
      };
    }

    if (firstModelFrame || isDocked) {
      current.pos = target.pos.slice();
      current.rot = target.rot.slice();
      current.scale = target.scale;
      current.opacity = target.opacity;
      firstModelFrame = false;
    } else {
      var lockT = clamp(dockProgress / 0.85, 0, 1);
      lockT = lockT * lockT * (3 - 2 * lockT);
      var followStrength = lerp(SMOOTH, 1, lockT);
      current.pos[0] += (target.pos[0] - current.pos[0]) * followStrength;
      current.pos[1] += (target.pos[1] - current.pos[1]) * followStrength;
      current.pos[2] += (target.pos[2] - current.pos[2]) * followStrength;
      current.rot[0] += (target.rot[0] - current.rot[0]) * followStrength;
      current.rot[1] += (target.rot[1] - current.rot[1]) * followStrength;
      current.rot[2] += (target.rot[2] - current.rot[2]) * followStrength;
      current.scale += (target.scale - current.scale) * followStrength;
      current.opacity += (target.opacity - current.opacity) * followStrength;
    }

    if (dockProgress > 0) {
      if (canvas.style.filter && canvas.style.filter !== 'none') {
        savedWaterFilter = canvas.style.filter;
        canvas.style.filter = 'none';
      }
    } else if (savedWaterFilter) {
      canvas.style.filter = savedWaterFilter;
    }

    var idle = !reduceMotion && dockProgress < 1 && performance.now() - lastScrollTs > 220;
    var t = performance.now() * 0.001;
    var floatY = idle ? Math.sin(t * 0.9) * 0.035 : 0;
    var floatRotZ = idle ? Math.sin(t * 0.6) * 0.02 : 0;

    modelRoot.position.set(current.pos[0], current.pos[1] + floatY, current.pos[2]);
    modelRoot.rotation.set(current.rot[0], current.rot[1], current.rot[2] + floatRotZ);
    modelRoot.scale.setScalar(normalizedBaseScale * current.scale);

    canvas.style.opacity = String(Math.max(0, Math.min(1, current.opacity)));

    /* El agua del hero también reacciona al movimiento real del modelo.
       Proyectamos el centro del escáner a coordenadas de pantalla para que
       cada onda nazca sobre el objeto, no en una posición decorativa fija. */
    var now = performance.now();
    var water = window.InteriorsHeroWater;
    if (water && heroSection) {
      var heroRect = heroSection.getBoundingClientRect();
      var heroVisible = heroRect.bottom > 0 && heroRect.top < window.innerHeight;
      if (heroVisible) {
        modelRoot.updateMatrixWorld(true);
        var projected = modelRoot.position.clone().project(camera);
        /* El origen visual del modelo no coincide exactamente con su pivote:
           lo desplazamos hacia el cabezal/lente, donde el usuario percibe
           que el escáner toca el agua. */
        var waterX = (projected.x * 0.5 + 0.5) * window.innerWidth + window.innerWidth * 0.08;
        var waterY = (-projected.y * 0.5 + 0.5) * window.innerHeight - window.innerHeight * 0.07;
        waterX = Math.min(Math.max(waterX, 24), window.innerWidth - 24);
        waterY = Math.min(Math.max(waterY, 24), window.innerHeight - 24);

        if (scrollWaveStrength > 0.06 && now - lastWaterDropTs > 82) {
          water.dropAt(waterX, waterY, 0.24 + scrollWaveStrength * 0.56, 7);
          scrollWaveStrength *= 0.54;
          lastWaterDropTs = now;
        } else if (idle && now - lastIdleDropTs > 1050) {
          water.dropAt(waterX + Math.sin(t * 0.7) * 24, waterY + 14, 0.14, 5);
          lastIdleDropTs = now;
        }
      }
    }
  }

  function tick() {
    requestAnimationFrame(tick);
    applyFrame();
    renderer.render(scene, camera);
    clearScannerBehindVisibleCards();
  }
  tick();

  window.__scannerDebug = function () {
    return {
      hasModel: !!model,
      dockProgress: dockProgress,
      current: current,
      normalizedBaseScale: normalizedBaseScale,
      canvasStyle: { w: canvas.style.width, h: canvas.style.height, l: canvas.style.left, t: canvas.style.top, op: canvas.style.opacity },
      canvasAttr: { w: canvas.width, h: canvas.height },
      cameraAspect: camera.aspect,
      dockAnchorRect: dockAnchor ? dockAnchor.getBoundingClientRect() : null,
      dockY: dockY,
      dockTravelStartY: dockTravelStartY,
      dockApproachY: dockApproachY,
      rendererInfo: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles },
      contextLost: renderer.getContext().isContextLost(),
      modelVisible: model ? model.visible : null,
      modelRootVisible: modelRoot.visible,
      modelChildrenCount: model ? model.children.length : 0,
      cameraNear: camera.near,
      cameraFar: camera.far,
      cameraPos: camera.position.toArray(),
      modelRootPos: modelRoot.position.toArray(),
      modelRootScale: modelRoot.scale.toArray(),
    };
  };

}());
