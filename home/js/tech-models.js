/* ════════════════════════════════════════════════════
   TECH 3D — Configuración editable
   ════════════════════════════════════════════════════
   Ajusta aquí para cambiar:

   - Posición inicial y final del modelo.
   - Rotación inicial y final.
   - Escala inicial y final.
   - FOV inicial y final de la cámara.
   - Distancia inicial y final de la cámara.
   - Movimiento vertical CSS.
   - Timing y suavidad del scroll.

   No es necesario modificar el engine.
   ════════════════════════════════════════════════════ */


/* ============================================================
   REACCIÓN AL CURSOR — parámetros fáciles de modificar
   Los ángulos están expresados en radianes.
   ============================================================ */

/* Prefijo de assets para páginas fuera de home/ (ej. tecnologie/ define
   <body data-asset-base="../home/">). En home queda vacío. */
const TECH_ASSET_BASE = (document.body && document.body.dataset.assetBase) || '';

const POINTER_INTERACTION_CFG = {
  /* Escáner: giro horizontal máximo (0.105 rad ≈ 6°). */
  scannerHorizontal: 0.205,

  /* Escáner: inclinación vertical máxima (0.06 rad ≈ 3.4°). */
  scannerVertical: 0.15,

  /* Tablet: inclinación máxima exclusivamente sobre Z (0.07 rad ≈ 4°). */
  tabletZ: 0.20,

  /* Influencia horizontal y vertical del cursor sobre el giro Z de la tablet. */
  tabletHorizontalInfluence: 0,
  tabletVerticalInfluence: 0.65,

  /* Velocidad de seguimiento y retorno. Menor = más suave; mayor = más rápida. */
  smoothing: 0.15,
};


const SCANNER_CFG = {
  /* ────────────────────────────────────────────────
     Modelo 3D
     ──────────────────────────────────────────────── */

  modelPath: TECH_ASSET_BASE + 'assets/models/scanner_hunyuan.glb',

  /* ────────────────────────────────────────────────
     Posición 3D inicial
     ──────────────────────────────────────────────── */

  startPosX: -0.5,
  startPosY: -0.5,
  startPosZ: 0,

  /* ────────────────────────────────────────────────
     Posición 3D final
     ──────────────────────────────────────────────── */

  endPosX: 0,
  endPosY: 0.2,
  endPosZ: 0,

  /* ────────────────────────────────────────────────
     Escala inicial y final

     Esta escala sigue usando unidades normalizadas.
     Por ejemplo, 2.2 conserva aproximadamente el
     tamaño que utilizabas anteriormente con modelScale.
     ──────────────────────────────────────────────── */

  startScale: 2.1,
      endScale: 2.3,

  /* ────────────────────────────────────────────────
     Rotación 3D inicial
     ──────────────────────────────────────────────── */

  startRotX: 0.9,
  startRotY: -Math.PI * 0.8,
  startRotZ: 0,

  /* ────────────────────────────────────────────────
     Rotación 3D final
     ──────────────────────────────────────────────── */

  endRotX: 0,
  endRotY: Math.PI * 0.15,
  endRotZ: 0,

  /* ────────────────────────────────────────────────
     Cámara

     FOV más bajo:
     - Mayor acercamiento visual.
     - Menor distorsión de perspectiva.

     FOV más alto:
     - Se ve más espacio.
     - Mayor sensación de perspectiva.

     CamZ más bajo:
     - Cámara más cerca del modelo.

     CamZ más alto:
     - Cámara más lejos del modelo.
     ──────────────────────────────────────────────── */

  startFov: 40,
  endFov: 45,

  startCamZ: 4,
  endCamZ: 4,

  /* ────────────────────────────────────────────────
     Parallax CSS del canvas

     El canvas se mueve verticalmente desde startY
     hasta endY, expresado en píxeles.
     ──────────────────────────────────────────────── */

  startY: 180,
  endY: 0,

  /* ────────────────────────────────────────────────
     Timing del scroll
     ──────────────────────────────────────────────── */

  lerpSpeed: 0.06,

  /* Progreso global al que empieza la animación. */
  triggerStart: 0.2,

  /* Progreso global al que termina la animación. */
  triggerEnd: 0.3,
};


const TABLET_CFG = {
  /* ────────────────────────────────────────────────
     Modelo 3D
     ──────────────────────────────────────────────── */

  modelPath: TECH_ASSET_BASE + 'assets/models/tablet.glb',

  /* La tablet reacciona al cursor exclusivamente sobre Z. */
  pointerMode: 'z',

  /* Imagen que se aplicará a la pantalla. */
  screenImg: 'assets/img/TabletTour.webp',

  /* ────────────────────────────────────────────────
     Posición 3D inicial
     ──────────────────────────────────────────────── */

  startPosX: 0,
  startPosY: 0,
  startPosZ: 0,

  /* ────────────────────────────────────────────────
     Posición 3D final
     ──────────────────────────────────────────────── */

  endPosX: -0.2,
  endPosY: 0.5,
  endPosZ: 0,

  /* ────────────────────────────────────────────────
     Escala inicial y final
     ──────────────────────────────────────────────── */

  startScale: 2.2,
  endScale: 6,

  /* ────────────────────────────────────────────────
     Rotación inicial
     ──────────────────────────────────────────────── */

  startRotX: Math.PI / 10,
  startRotY: -Math.PI * 0.45,
  startRotZ: -0.25,

  /* ────────────────────────────────────────────────
     Rotación final
     ──────────────────────────────────────────────── */

  endRotX: Math.PI * 0.5,
  endRotY: Math.PI * -0.5,
  endRotZ: 0,

  /* ────────────────────────────────────────────────
     Cámara
     ──────────────────────────────────────────────── */

  startFov: 40,
  endFov: 50,

  startCamZ: 10,
  endCamZ: 10,

  /* ────────────────────────────────────────────────
     Parallax CSS
     ──────────────────────────────────────────────── */

  startY: 240,
  endY: 0,

  /* ────────────────────────────────────────────────
     Timing
     ──────────────────────────────────────────────── */

  lerpSpeed: 0.06,
  triggerStart: 0.2,
  triggerEnd: 0.4,
};


/* ────────────────────────────────────────────────
   Ajustes móviles: modelos más pequeños y centrados.
   Solo escala/posición; el timing del scroll no se toca.
   ──────────────────────────────────────────────── */
if (window.matchMedia('(max-width: 768px)').matches) {
  SCANNER_CFG.startScale = 2.18;
  SCANNER_CFG.endScale = 2.4;
  SCANNER_CFG.startPosY = -0.52;
  SCANNER_CFG.endPosY = 0.15;
  SCANNER_CFG.startY = 90;

  TABLET_CFG.startScale = 2.25;
  TABLET_CFG.endScale = 4.5;
  TABLET_CFG.startPosY = 0;
  TABLET_CFG.endPosY = 0.45;
  TABLET_CFG.endPosX = 0;
  TABLET_CFG.startY = 120;
}


/* ════════════════════════════════════════════════════
   ENGINE — Three.js
   ════════════════════════════════════════════════════ */


function lerp(a, b, t) {
  return a + (b - a) * t;
}


/**
 * Devuelve un número de configuración conservando valores válidos como 0.
 *
 * Evita usar:
 *
 *     cfg.valor || fallback
 *
 * porque JavaScript consideraría 0 como falso y usaría el fallback.
 */
function getNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
}


/**
 * Limita un número entre un mínimo y un máximo.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}


/**
 * Inicializa un modelo 3D dentro de un canvas.
 *
 * @param {string} canvasId
 * @param {Object} cfg
 * @returns {Object|null}
 */
function initTechModel(canvasId, cfg) {
  const canvas = document.getElementById(canvasId);

  if (!canvas) {
    console.warn(`[tech-models] No se encontró el canvas #${canvasId}`);
    return null;
  }

  /* ────────────────────────────────────────────────
     Renderer
     ──────────────────────────────────────────────── */

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });

  renderer.setPixelRatio(
    Math.min(
      Math.max(window.devicePixelRatio || 1, 2),
      2.5
    )
  );

  /*
   * Compatibilidad con versiones de Three.js que utilizan
   * outputEncoding.
   */
  if ('outputEncoding' in renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  /*
   * Compatibilidad con versiones recientes de Three.js que
   * utilizan outputColorSpace.
   */
  if (
    'outputColorSpace' in renderer &&
    typeof THREE.SRGBColorSpace !== 'undefined'
  ) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  renderer.setClearColor(0x000000, 0);


  /* ────────────────────────────────────────────────
     Escena
     ──────────────────────────────────────────────── */

  const scene = new THREE.Scene();


  /* ────────────────────────────────────────────────
     Cámara
     ──────────────────────────────────────────────── */

  const initialFov = getNumber(cfg.startFov, 40);
  const initialCamZ = getNumber(cfg.startCamZ, 4);

  const camera = new THREE.PerspectiveCamera(
    initialFov,
    1,
    0.01,
    200
  );

  camera.position.set(0, 0, initialCamZ);


  /* ────────────────────────────────────────────────
     Luces
     ──────────────────────────────────────────────── */

  const ambient = new THREE.AmbientLight(
    0xffffff,
    0.7
  );

  scene.add(ambient);


  const key = new THREE.DirectionalLight(
    0xffffff,
    1.4
  );

  key.position.set(2, 3, 3);
  scene.add(key);


  const fill = new THREE.DirectionalLight(
    0x00bfc4,
    0.4
  );

  fill.position.set(-3, -1, -2);
  scene.add(fill);


  /* ────────────────────────────────────────────────
     Grupo animado

     El GLB se centra dentro de este grupo.

     Esto permite animar posición, rotación y escala
     sin alterar el centrado interno del modelo.
     ──────────────────────────────────────────────── */

  const modelRoot = new THREE.Group();
  scene.add(modelRoot);

  /*
   * Root independiente para la reacción al cursor. El scroll
   * continúa controlando modelRoot y el hover sólo gira el
   * modelo centrado dentro de pointerRoot.
   */
  const pointerRoot = new THREE.Group();
  modelRoot.add(pointerRoot);

  let targetLookX = 0;
  let targetLookY = 0;
  let targetLookZ = 0;
  let currentLookX = 0;
  let currentLookY = 0;
  let currentLookZ = 0;


  let model = null;
  let progress = 0;

  /*
   * La escala base normaliza el modelo para que su
   * dimensión más grande equivalga a una unidad.
   */
  let normalizedBaseScale = 1;


  /* ────────────────────────────────────────────────
     Textura de pantalla
     ──────────────────────────────────────────────── */

  let screenTex = null;

  if (cfg.screenImg) {
    screenTex = new THREE.TextureLoader().load(
      cfg.screenImg,
      () => {
        screenTex.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.error(
          '[tech-models] Error cargando textura:',
          cfg.screenImg,
          error
        );
      }
    );

    if ('encoding' in screenTex) {
      screenTex.encoding = THREE.sRGBEncoding;
    }

    if (
      'colorSpace' in screenTex &&
      typeof THREE.SRGBColorSpace !== 'undefined'
    ) {
      screenTex.colorSpace = THREE.SRGBColorSpace;
    }

    screenTex.flipY = false;
  }


  /* ────────────────────────────────────────────────
     Cargar GLB
     ──────────────────────────────────────────────── */

  const loader = new THREE.GLTFLoader();

  loader.load(
    cfg.modelPath,

    (gltf) => {
      model = gltf.scene;

      /*
       * Primero calculamos el bounding box sin escala ni
       * transformaciones adicionales.
       */
      const box = new THREE.Box3().setFromObject(model);

      const size = box.getSize(
        new THREE.Vector3()
      );

      const center = box.getCenter(
        new THREE.Vector3()
      );

      const maxDim = Math.max(
        size.x,
        size.y,
        size.z
      );

      if (maxDim > 0) {
        normalizedBaseScale = 1 / maxDim;
      } else {
        normalizedBaseScale = 1;
      }

      /*
       * Centramos la geometría dentro del grupo raíz.
       *
       * La posición y rotación configurables se aplican
       * posteriormente al modelRoot.
       */
      model.position.set(
        -center.x,
        -center.y,
        -center.z
      );


      /* ────────────────────────────────────────────
         Aplicar textura a la pantalla de la tablet
         ──────────────────────────────────────────── */

      if (screenTex) {
        model.traverse((child) => {
          if (!child.isMesh) {
            return;
          }

          const meshName = (
            child.name || ''
          ).toLowerCase();

          const isScreen =
            meshName.includes('screen') ||
            meshName.includes('image') ||
            meshName.includes('display') ||
            meshName.includes('glass');

          if (!isScreen) {
            return;
          }

          child.material = new THREE.MeshStandardMaterial({
            map: screenTex,
            emissiveMap: screenTex,
            emissive: new THREE.Color(0x333333),
            roughness: 0.05,
            metalness: 0,
          });

          child.material.needsUpdate = true;
        });
      }


      /* ────────────────────────────────────────────
         Añadir modelo al grupo animado
         ──────────────────────────────────────────── */

      pointerRoot.add(model);


      /*
       * Aplicar inmediatamente el estado actual.
       *
       * Esto evita que el modelo aparezca durante un frame
       * con escala o rotación incorrecta.
       */
      applyModelTransform();
    },

    undefined,

    (error) => {
      console.error(
        '[tech-models] Error cargando modelo:',
        cfg.modelPath,
        error
      );
    }
  );


  /* ────────────────────────────────────────────────
     Aplicar transformación según progress
     ──────────────────────────────────────────────── */

  function applyModelTransform() {
    if (!model) {
      return;
    }

    /* Posición inicial. */
    const startPosX = getNumber(cfg.startPosX, 0);
    const startPosY = getNumber(cfg.startPosY, 0);
    const startPosZ = getNumber(cfg.startPosZ, 0);

    /* Posición final. */
    const endPosX = getNumber(cfg.endPosX, startPosX);
    const endPosY = getNumber(cfg.endPosY, startPosY);
    const endPosZ = getNumber(cfg.endPosZ, startPosZ);

    /* Rotación inicial. */
    const startRotX = getNumber(cfg.startRotX, 0);
    const startRotY = getNumber(cfg.startRotY, 0);
    const startRotZ = getNumber(cfg.startRotZ, 0);

    /* Rotación final. */
    const endRotX = getNumber(cfg.endRotX, startRotX);
    const endRotY = getNumber(cfg.endRotY, startRotY);
    const endRotZ = getNumber(cfg.endRotZ, startRotZ);

    /* Escala inicial y final. */
    const startScale = getNumber(cfg.startScale, 2);
    const endScale = getNumber(cfg.endScale, startScale);

    /* FOV inicial y final. */
    const startFov = getNumber(cfg.startFov, 40);
    const endFov = getNumber(cfg.endFov, startFov);

    /* Distancia inicial y final de cámara. */
    const startCamZ = getNumber(cfg.startCamZ, 4);
    const endCamZ = getNumber(cfg.endCamZ, startCamZ);


    /* ────────────────────────────────────────────
       Interpolación de posición
       ──────────────────────────────────────────── */

    modelRoot.position.set(
      lerp(startPosX, endPosX, progress),
      lerp(startPosY, endPosY, progress),
      lerp(startPosZ, endPosZ, progress)
    );


    /* ────────────────────────────────────────────
       Interpolación de rotación
       ──────────────────────────────────────────── */

    modelRoot.rotation.set(
      lerp(startRotX, endRotX, progress),
      lerp(startRotY, endRotY, progress),
      lerp(startRotZ, endRotZ, progress)
    );


    /* ────────────────────────────────────────────
       Interpolación de escala
       ──────────────────────────────────────────── */

    const currentScale = lerp(
      startScale,
      endScale,
      progress
    );

    modelRoot.scale.setScalar(
      normalizedBaseScale * currentScale
    );


    /* ────────────────────────────────────────────
       Interpolación de cámara
       ──────────────────────────────────────────── */

    camera.fov = lerp(
      startFov,
      endFov,
      progress
    );

    camera.position.z = lerp(
      startCamZ,
      endCamZ,
      progress
    );

    camera.updateProjectionMatrix();
  }


  /* ────────────────────────────────────────────────
     Resize dinámico
     ──────────────────────────────────────────────── */

  function resize() {
    const width = Math.max(
      canvas.clientWidth,
      1
    );

    const height = Math.max(
      canvas.clientHeight,
      1
    );

    const pixelRatio = renderer.getPixelRatio();

    const renderWidth = Math.floor(
      width * pixelRatio
    );

    const renderHeight = Math.floor(
      height * pixelRatio
    );

    const needsResize =
      canvas.width !== renderWidth ||
      canvas.height !== renderHeight;

    if (!needsResize) {
      return;
    }

    renderer.setSize(
      width,
      height,
      false
    );

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => resize()).observe(canvas);
  }


  /* ────────────────────────────────────────────────
     Loop de render
     ──────────────────────────────────────────────── */

  function tick() {
    requestAnimationFrame(tick);

    resize();
    applyModelTransform();

    currentLookX +=
      (targetLookX - currentLookX) * POINTER_INTERACTION_CFG.smoothing;
    currentLookY +=
      (targetLookY - currentLookY) * POINTER_INTERACTION_CFG.smoothing;
    currentLookZ +=
      (targetLookZ - currentLookZ) * POINTER_INTERACTION_CFG.smoothing;

    pointerRoot.rotation.x = currentLookX;
    pointerRoot.rotation.y = currentLookY;
    pointerRoot.rotation.z = currentLookZ;

    renderer.render(
      scene,
      camera
    );
  }

  tick();


  /* ────────────────────────────────────────────────
     API pública del visor
     ──────────────────────────────────────────────── */

  return {
    renderer,
    scene,
    camera,
    modelRoot,
    pointerRoot,

    getModel() {
      return model;
    },

    setProgress(value) {
      progress = clamp(
        getNumber(value, 0),
        0,
        1
      );
    },

    setPointerLook(x, y, strength = 1) {
      const safeStrength = clamp(
        getNumber(strength, 0),
        0,
        1
      );

      const safeX = clamp(
        getNumber(x, 0),
        -1,
        1
      );

      const safeY = clamp(
        getNumber(y, 0),
        -1,
        1
      );

      if (cfg.pointerMode === 'z') {
        targetLookX = 0;
        targetLookY = 0;
        targetLookZ = clamp(
          safeX * POINTER_INTERACTION_CFG.tabletHorizontalInfluence +
          safeY * POINTER_INTERACTION_CFG.tabletVerticalInfluence,
          -1,
          1
        ) * POINTER_INTERACTION_CFG.tabletZ * safeStrength;
        return;
      }

      targetLookY =
        safeX * POINTER_INTERACTION_CFG.scannerHorizontal * safeStrength;

      targetLookX =
        safeY * POINTER_INTERACTION_CFG.scannerVertical * safeStrength;
      targetLookZ = 0;
    },
  };
}


/* ════════════════════════════════════════════════════
   SCROLL SYSTEM — Lerp suave sin dependencias
   ════════════════════════════════════════════════════ */


function initScrollSystem(entries) {
  const techSection = document.getElementById('tech');

  if (!techSection) {
    console.warn(
      '[tech-models] No se encontró la sección #tech'
    );
  }


  /* ────────────────────────────────────────────────
     Estado de animación por elemento
     ──────────────────────────────────────────────── */

  const states = entries.map((entry) => {
    const initialY = getNumber(
      entry.cfg.startY,
      0
    );

    return {
      ...entry,

      currentY: initialY,
      targetY: initialY,

      currentP: 0,
      targetP: 0,
    };
  });


  /* ────────────────────────────────────────────────
     Posición inicial de cada canvas
     ──────────────────────────────────────────────── */

  states.forEach((state) => {
    const element = document.getElementById(
      state.canvasId
    );

    if (!element) {
      console.warn(
        `[tech-models] No se encontró #${state.canvasId}`
      );

      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const crispY = Math.round(state.currentY * devicePixelRatio) / devicePixelRatio;

    element.style.transform =
      `translate3d(0, ${crispY}px, 0)`;

    element.style.willChange = 'transform';
  });


  /* ────────────────────────────────────────────────
     Calcular progreso global de la sección
     ──────────────────────────────────────────────── */

  function getScrollProgress() {
    if (!techSection) {
      return 0;
    }

    const rect = techSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    /*
     * Distancia total durante la que se considera que la
     * sección está atravesando el viewport.
     */
    const totalDistance =
      viewportHeight +
      techSection.offsetHeight;

    /*
     * Cuánto ha avanzado la sección desde que su borde
     * superior entró por debajo del viewport.
     */
    const completedDistance =
      viewportHeight -
      rect.top;

    if (totalDistance <= 0) {
      return 0;
    }

    return clamp(
      completedDistance / totalDistance,
      0,
      1
    );
  }


  /* ────────────────────────────────────────────────
     Actualizar objetivos al hacer scroll
     ──────────────────────────────────────────────── */

  function onScroll() {
    const scrollProgress = getScrollProgress();

    states.forEach((state) => {
      const triggerStart = getNumber(
        state.cfg.triggerStart,
        0
      );

      const triggerEnd = getNumber(
        state.cfg.triggerEnd,
        1
      );

      const startY = getNumber(
        state.cfg.startY,
        0
      );

      const endY = getNumber(
        state.cfg.endY,
        0
      );

      /*
       * Evita divisiones entre cero si triggerStart y
       * triggerEnd tienen el mismo valor.
       */
      const triggerRange =
        triggerEnd - triggerStart;

      let localProgress;

      if (Math.abs(triggerRange) < 0.000001) {
        localProgress =
          scrollProgress >= triggerEnd
            ? 1
            : 0;
      } else {
        localProgress = clamp(
          (
            scrollProgress -
            triggerStart
          ) / triggerRange,
          0,
          1
        );
      }

      state.targetY = lerp(
        startY,
        endY,
        localProgress
      );

      state.targetP = localProgress;
    });
  }


  window.addEventListener(
    'scroll',
    onScroll,
    { passive: true }
  );

  window.addEventListener(
    'resize',
    onScroll,
    { passive: true }
  );

  /* Reacción discreta e independiente para cada modelo. */
  function onPointerMove(event) {
    states.forEach((state) => {
      if (!state.viewer || !state.viewer.setPointerLook) {
        return;
      }

      const element = document.getElementById(state.canvasId);

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const sectionRect = techSection.getBoundingClientRect();
      const sectionMiddle = sectionRect.left + sectionRect.width * 0.5;
      const isScanner = state.canvasId === 'canvas-scanner';
      const isActiveHalf = isScanner
        ? event.clientX <= sectionMiddle
        : event.clientX > sectionMiddle;

      if (!isActiveHalf) {
        state.viewer.setPointerLook(0, 0, 0);
        return;
      }

      const normalizedX = (
        event.clientX - (rect.left + rect.width * 0.5)
      ) / Math.max(sectionRect.width * 0.5, 1);

      const normalizedY = (
        event.clientY - (rect.top + rect.height * 0.5)
      ) / Math.max(sectionRect.height * 0.5, 1);

      state.viewer.setPointerLook(
        normalizedX,
        normalizedY,
        1
      );
    });
  }

  function resetPointerLook() {
    states.forEach((state) => {
      if (state.viewer && state.viewer.setPointerLook) {
        state.viewer.setPointerLook(0, 0, 0);
      }
    });
  }

  if (techSection) {
    techSection.addEventListener(
      'pointermove',
      onPointerMove,
      { passive: true }
    );

    techSection.addEventListener(
      'pointerleave',
      resetPointerLook,
      { passive: true }
    );
  }

  window.addEventListener('blur', resetPointerLook);

  /*
   * Calcula el estado inicial por si la página carga
   * con scroll restaurado.
   */
  onScroll();


  /* ────────────────────────────────────────────────
     Loop de interpolación
     ──────────────────────────────────────────────── */

  function loop() {
    requestAnimationFrame(loop);

    states.forEach((state) => {
      const speed = clamp(
        getNumber(
          state.cfg.lerpSpeed,
          0.06
        ),
        0,
        1
      );

      state.currentY +=
        (
          state.targetY -
          state.currentY
        ) * speed;

      state.currentP +=
        (
          state.targetP -
          state.currentP
        ) * speed;


      const element = document.getElementById(
        state.canvasId
      );

      if (element) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const crispY = Math.round(state.currentY * devicePixelRatio) / devicePixelRatio;

        element.style.transform =
          `translate3d(0, ${crispY}px, 0)`;
      }


      if (state.viewer) {
        state.viewer.setProgress(
          state.currentP
        );
      }
    });
  }

  loop();
}


/* ════════════════════════════════════════════════════
   LAUNCH
   ════════════════════════════════════════════════════ */


const scannerViewer = initTechModel(
  'canvas-scanner',
  SCANNER_CFG
);


const tabletViewer = initTechModel(
  'canvas-tablet',
  TABLET_CFG
);


initScrollSystem([
  {
    viewer: scannerViewer,
    canvasId: 'canvas-scanner',
    cfg: SCANNER_CFG,
  },

  {
    viewer: tabletViewer,
    canvasId: 'canvas-tablet',
    cfg: TABLET_CFG,
  },
]);
