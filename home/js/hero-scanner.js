/* ════════════════════════════════════════════════════
   ESCÁNER VIAJERO — solo móvil (<=768px)
   ════════════════════════════════════════════════════
   Un único modelo 3D que recorre la página seguendo el scroll:
   hero -> cards (Soluzioni) -> oculto detrás de "due tecnologie"
   (esa sección conserva su propio escáner y malla, sin tocar) ->
   reaparece en "storie di successo" -> desaparece antes del footer.

   Para ajustar posición/rotación/escala de cada parada, edita
   ANCHORS aquí abajo. Todo lo demás (medición de secciones,
   interpolación, animación idle) es el motor y no hace falta
   tocarlo para retocar el recorrido.
   ════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (!window.matchMedia('(max-width: 768px)').matches) return;
  if (typeof THREE === 'undefined') return;

  var canvas = document.getElementById('hero-scanner-canvas');
  if (!canvas) return;

  var solutionsSection = document.getElementById('solutions');
  var heroSection = document.getElementById('hero');
  /* Se coloca una sola vez antes de cargar el GLB. El canvas permanece fixed:
     detrás de la banda de logos y el título, pero delante de las cards, sin
     reparentados durante el scroll ni fotogramas vacíos. */
  if (solutionsSection && canvas.parentNode !== solutionsSection) {
    solutionsSection.insertBefore(canvas, solutionsSection.firstChild);
  }

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
  var CARD_FACING_Y = 0.58;

  /* CONTROLES DEL RECORRIDO HERO -> CARDS
     HERO_ANIMATION_START: espera inicial en píxeles. En 0, el modelo empieza
     a transformarse desde el primer píxel de scroll.
     TRANSITION_BEFORE_SOLUTIONS: distancia antes de Soluzioni donde llega
     al estado compacto intermedio.
     CARDS_IN_BEFORE_SOLUTIONS: distancia antes de Soluzioni donde llega
     completamente a cardsIn. */
  var HERO_ANIMATION_START = -3;
  var TRANSITION_BEFORE_SOLUTIONS = 400;
  var CARDS_IN_BEFORE_SOLUTIONS = 210;

  var ANCHORS = {
    hero:      { pos: [0.55, 0.45, 0], rot: [-0.40, -0.35, 0.1], scale: 2.2, opacity: 0.92 },
    transition:{ pos: [-0.3, 1.3, 0], rot: [0.1, 0.20, 0], scale: 0.80, opacity: 0.98 },
    cardsIn:   { pos: [-1, 0.0, 0], rot: [0.30, CARD_FACING_Y - CARD_FULL_TURN, -0.03], scale: 1.78, opacity: 0.98 },
    cardsHold: { pos: [-0.44, 0.0, 0], rot: [-0.9, CARD_FACING_Y - CARD_FULL_TURN, -0.03], scale: 1.88, opacity: 1 },
    techIn:    { pos: [0.15,  0.10, 0], rot: [0.80, 0, 0], scale: 1.70, opacity: 0 },
    techOut:   { pos: [-0.40, 0.15, 0], rot: [0.10,  0.55, 0], scale: 1.70, opacity: 0 },
    stories:   { pos: [-0.42, 0.42, 0], rot: [0.10,  0.55, 0], scale: 1.30, opacity: 0.5 },
    gone:      { pos: [-0.42, 0.60, 0], rot: [0.10,  0.55, 0], scale: 1.15, opacity: 0 },
  };

  /* Distancia (px) de desvanecido al entrar/salir de una parada. */
  var FADE = 130;

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

  function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var ratio = renderer.getPixelRatio();
    if (canvas.width !== Math.floor(w * ratio) || canvas.height !== Math.floor(h * ratio)) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  /* ════════════════════════════════════════════════════
     Timeline — puntos de scroll (px, documento) construidos
     a partir de las secciones reales, recalculados en resize.
     ════════════════════════════════════════════════════ */

  var timeline = [];

  function measureTimeline() {
    var hero = document.getElementById('hero');
    var solutions = document.getElementById('solutions');
    var tech = document.getElementById('tech');
    var stories = document.getElementById('stories');
    if (!hero || !solutions || !tech || !stories) return;

    var solTop = solutions.offsetTop;
    var solBottom = solutions.offsetTop + solutions.offsetHeight;
    var techTop = tech.offsetTop;
    var techBottom = tech.offsetTop + tech.offsetHeight;
    var storiesTop = stories.offsetTop;
    var storiesBottom = stories.offsetTop + stories.offsetHeight;
    var heroMotionStart = Math.max(0, HERO_ANIMATION_START);
    var transitionArrive = Math.max(heroMotionStart + 1, solTop - TRANSITION_BEFORE_SOLUTIONS);
    var cardsArrive = Math.max(transitionArrive + 1, solTop - CARDS_IN_BEFORE_SOLUTIONS);

    /* Entramos antes al contexto de Soluzioni: la banda de logos oculta el
       cuerpo central, pero la cola ya puede seguir viéndose por debajo. */
    timeline = [
      { y: 0, a: ANCHORS.hero },
      { y: heroMotionStart, a: ANCHORS.hero },
      { y: transitionArrive, a: ANCHORS.transition },
      { y: cardsArrive, a: ANCHORS.cardsIn },
      { y: Math.max(solTop, solBottom - FADE), a: ANCHORS.cardsHold },
      { y: solBottom, a: ANCHORS.techIn },
      { y: Math.max(techTop, techBottom - FADE), a: ANCHORS.techOut },
      { y: techBottom, a: ANCHORS.stories },
      { y: Math.max(storiesTop, storiesBottom - FADE), a: ANCHORS.stories },
      { y: storiesBottom, a: ANCHORS.gone },
    ];
  }
  measureTimeline();
  window.addEventListener('resize', measureTimeline, { passive: true });
  window.addEventListener('load', measureTimeline);

  function lerp(a, b, t) { return a + (b - a) * t; }

  var current = {
    pos: ANCHORS.hero.pos.slice(),
    rot: ANCHORS.hero.rot.slice(),
    scale: ANCHORS.hero.scale,
    opacity: 0,
  };

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
     está quieto (sin scroll reciente).
     ════════════════════════════════════════════════════ */

  var lastScrollTs = 0;
  var lastScrollY = window.scrollY || window.pageYOffset || 0;
  var scrollWaveStrength = 0;
  var lastWaterDropTs = 0;
  var lastIdleDropTs = 0;
  window.addEventListener('scroll', function () {
    var nextY = window.scrollY || window.pageYOffset || 0;
    scrollWaveStrength = Math.min(1, scrollWaveStrength + Math.abs(nextY - lastScrollY) / 85);
    lastScrollY = nextY;
    lastScrollTs = performance.now();
  }, { passive: true });

  var SMOOTH = 0.08;

  function applyFrame() {
    if (!model) return;

    var scrollY = window.scrollY || window.pageYOffset || 0;
    var target = sampleTimeline(scrollY);
    current.pos[0] += (target.pos[0] - current.pos[0]) * SMOOTH;
    current.pos[1] += (target.pos[1] - current.pos[1]) * SMOOTH;
    current.pos[2] += (target.pos[2] - current.pos[2]) * SMOOTH;
    current.rot[0] += (target.rot[0] - current.rot[0]) * SMOOTH;
    current.rot[1] += (target.rot[1] - current.rot[1]) * SMOOTH;
    current.rot[2] += (target.rot[2] - current.rot[2]) * SMOOTH;
    current.scale += (target.scale - current.scale) * SMOOTH;
    current.opacity += (target.opacity - current.opacity) * SMOOTH;

    var idle = !reduceMotion && performance.now() - lastScrollTs > 220;
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
  }
  tick();

}());
