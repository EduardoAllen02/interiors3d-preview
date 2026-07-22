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

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ASSET_BASE = (document.body && document.body.dataset.assetBase) || '';
  var MODEL_PATH = ASSET_BASE + 'assets/models/scanner_hunyuan.glb';

  /* ════════════════════════════════════════════════════
     ANCLAS — posición/rotación (unidades de mundo Three.js)
     y escala (multiplicador) por parada. opacity 0 = oculto.
     ════════════════════════════════════════════════════ */
  var ANCHORS = {
    hero:      { pos: [0.60, -0.30, 0], rot: [0.55, -2.35, 0], scale: 1.55, opacity: 0.92 },
    cardsIn:   { pos: [0.05,  0.20, 0], rot: [0.35, -1.65, 0], scale: 2.55, opacity: 0.68 },
    cardsHold: { pos: [0.02,  0.16, 0], rot: [0.30, -1.65, 0], scale: 2.65, opacity: 0.68 },
    techIn:    { pos: [0.15,  0.10, 0], rot: [0.20, -0.55, 0], scale: 1.70, opacity: 0 },
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
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.5));
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

  new THREE.GLTFLoader().load(
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

    var heroBottom = hero.offsetTop + hero.offsetHeight;
    var solTop = solutions.offsetTop;
    var solBottom = solutions.offsetTop + solutions.offsetHeight;
    var techTop = tech.offsetTop;
    var techBottom = tech.offsetTop + tech.offsetHeight;
    var storiesTop = stories.offsetTop;
    var storiesBottom = stories.offsetTop + stories.offsetHeight;

    timeline = [
      { y: 0, a: ANCHORS.hero },
      { y: heroBottom, a: ANCHORS.hero },
      { y: solTop, a: ANCHORS.cardsIn },
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
  window.addEventListener('scroll', function () {
    lastScrollTs = performance.now();
  }, { passive: true });

  var SMOOTH = 0.08;

  function applyFrame() {
    if (!model) return;

    var target = sampleTimeline(window.scrollY || window.pageYOffset || 0);

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
  }

  function tick() {
    requestAnimationFrame(tick);
    applyFrame();
    renderer.render(scene, camera);
  }
  tick();

  /* ── Partículas discretas alrededor del escáner en la sección de
     cards — generadas una vez, sin dependencias externas. ── */
  var solutions = document.getElementById('solutions');
  if (solutions) {
    var wrap = document.createElement('div');
    wrap.className = 'sol-particles';
    wrap.setAttribute('aria-hidden', 'true');
    var COUNT = 14;
    for (var i = 0; i < COUNT; i += 1) {
      var dot = document.createElement('span');
      dot.className = 'sol-particle';
      dot.style.left = (8 + Math.random() * 84) + '%';
      dot.style.top = (10 + Math.random() * 80) + '%';
      dot.style.animationDelay = (Math.random() * 6) + 's';
      dot.style.animationDuration = (5 + Math.random() * 3) + 's';
      wrap.appendChild(dot);
    }
    solutions.insertBefore(wrap, solutions.firstChild);
  }
}());
