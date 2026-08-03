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
const TECH_IS_MOBILE = window.matchMedia('(max-width: 768px)').matches;

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


/* ============================================================
   TABLET MOBILE — línea de tiempo editable del giro por scroll

   Cada punto se activa cuando el borde superior del selector cruza
   la fracción indicada del viewport (1 = borde inferior, 0 = superior).
   Los ángulos son adicionales a la orientación frontal fija del GLB.
   ============================================================ */
const TABLET_ENTRY_START = {
  selector: '#canvas-tablet',
  viewportRatio: 0.98,
};

const TABLET_ENTRY_END = {
  selector: '#canvas-tablet',
  viewportRatio: 0.55,
};

/* Mientras #stories no cruce este punto, la tablet permanece frontal. */
const TABLET_EXIT_START = {
  selector: '#stories',
  viewportRatio: 0.62,
};

const TABLET_EXIT_END = {
  selector: '#stories',
  viewportRatio: 0.18,
};

const TABLET_HIDDEN_START_ANGLE = Math.PI;
const TABLET_FRONT_ANGLE = 0;
const TABLET_HIDDEN_END_ANGLE = -Math.PI;

/* 0 = interpolación lineal; 1 = entrada/salida totalmente suavizada. */
const TABLET_ENTRY_SMOOTHING = 1;
const TABLET_EXIT_SMOOTHING = 1;


const SCANNER_CFG = {
  /* ────────────────────────────────────────────────
     Modelo 3D
     ──────────────────────────────────────────────── */

  modelPath: TECH_ASSET_BASE + 'assets/models/' +
    (TECH_IS_MOBILE ? 'scanner_hunyuan-mobile.glb' : 'scanner_hunyuan.glb') +
    '?v=20260723-opt2',

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
  screenImg: TECH_IS_MOBILE
    ? 'assets/img/TabletTour-mobile.webp'
    : 'assets/img/TabletTour.webp',

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

  /* Margen adicional en desktop: la cara ancha de la tablet debe quedar
     completa dentro del frustum incluso en el punto de mayor escala. */
  startCamZ: 11.8,
  endCamZ: 11.8,

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

  /*
   * Primera fase: la tablet ya está en su encuadre final y aparece
   * completando una vuelta sobre Y conforme entra con el scroll.
   * Segunda fase: continúa con un cuarto de vuelta antes de Stories.
   */
  TABLET_CFG.startScale = 8.775;
  TABLET_CFG.endScale = 8.775;
  TABLET_CFG.startPosX = 0;
  TABLET_CFG.endPosX = 0;
  TABLET_CFG.startPosY = 0.45;
  TABLET_CFG.endPosY = 0.45;
  TABLET_CFG.startY = 0;
  TABLET_CFG.endY = 0;
  /* El GLB nace acostado: X = PI/2 lo deja erguido. Este valor permanece
     fijo; la animación móvil sigue ocurriendo exclusivamente sobre Y. */
  TABLET_CFG.startRotX = Math.PI * 0.5;
  TABLET_CFG.endRotX = Math.PI * 0.5;
  /* Orientación frontal nativa del GLB. Los tres valores permanecen fijos;
     la reacción de scroll adicional se aplica después sobre spinRoot.Y. */
  TABLET_CFG.startRotY = -Math.PI * 0.5;
  TABLET_CFG.endRotY = -Math.PI * 0.5;
  TABLET_CFG.startRotZ = 0;
  TABLET_CFG.endRotZ = 0;
  TABLET_CFG.triggerStart = 0;
  TABLET_CFG.triggerEnd = 1;
  TABLET_CFG.scrollAngleTimeline = true;
  TABLET_CFG.entryStartSelector = TABLET_ENTRY_START.selector;
  TABLET_CFG.entryStartViewportRatio = TABLET_ENTRY_START.viewportRatio;
  TABLET_CFG.entryEndSelector = TABLET_ENTRY_END.selector;
  TABLET_CFG.entryEndViewportRatio = TABLET_ENTRY_END.viewportRatio;
  TABLET_CFG.exitStartSelector = TABLET_EXIT_START.selector;
  TABLET_CFG.exitStartViewportRatio = TABLET_EXIT_START.viewportRatio;
  TABLET_CFG.exitEndSelector = TABLET_EXIT_END.selector;
  TABLET_CFG.exitEndViewportRatio = TABLET_EXIT_END.viewportRatio;
  TABLET_CFG.hiddenStartAngle = TABLET_HIDDEN_START_ANGLE;
  TABLET_CFG.frontAngle = TABLET_FRONT_ANGLE;
  TABLET_CFG.hiddenEndAngle = TABLET_HIDDEN_END_ANGLE;
  TABLET_CFG.entrySmoothing = TABLET_ENTRY_SMOOTHING;
  TABLET_CFG.exitSmoothing = TABLET_EXIT_SMOOTHING;
  TABLET_CFG.spinCameraExtraZ = 3.2;
  TABLET_CFG.spinLerpSpeed = 0.12;
  /* La cámara se aleja para conservar todos los cantos durante ambas fases. */
  TABLET_CFG.startCamZ = 12;
  TABLET_CFG.endCamZ = 12;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    TABLET_CFG.hiddenStartAngle = TABLET_FRONT_ANGLE;
    TABLET_CFG.frontAngle = TABLET_FRONT_ANGLE;
    TABLET_CFG.hiddenEndAngle = TABLET_FRONT_ANGLE;
  }
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
      Math.max(window.devicePixelRatio || 1, TECH_IS_MOBILE ? 1.5 : 2),
      TECH_IS_MOBILE ? 2 : 2.5
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

  /*
   * Grupo padre para el giro de 360°. Al estar fuera de modelRoot,
   * rota sobre el eje Y mundial y no hereda la orientación base del GLB.
   * Así la tablet muestra frente, canto y espalda sin convertirse en roll.
   */
  const spinRoot = new THREE.Group();
  scene.add(spinRoot);

  const modelRoot = new THREE.Group();
  spinRoot.add(modelRoot);

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
  let scrollSpinY = 0;
  let frameUpdater = null;


  let model = null;
  let progress = 0;
  let journeyPose = null;

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
  if (typeof MeshoptDecoder !== 'undefined' && loader.setMeshoptDecoder) {
    loader.setMeshoptDecoder(MeshoptDecoder);
  }

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

    /*
     * La tablet móvil reutiliza este mismo visor durante su recorrido
     * posterior hacia Storie di Successo. Cuando existe journeyPose,
     * la pose original de #tech queda pausada en su último frame y el
     * controlador externo conduce exactamente el mismo modelRoot.
     */
    if (journeyPose) {
      modelRoot.position.set(
        getNumber(journeyPose.pos && journeyPose.pos[0], 0),
        getNumber(journeyPose.pos && journeyPose.pos[1], 0),
        getNumber(journeyPose.pos && journeyPose.pos[2], 0)
      );

      modelRoot.rotation.set(
        getNumber(journeyPose.rot && journeyPose.rot[0], 0),
        getNumber(journeyPose.rot && journeyPose.rot[1], 0),
        getNumber(journeyPose.rot && journeyPose.rot[2], 0)
      );

      modelRoot.scale.setScalar(
        normalizedBaseScale * getNumber(journeyPose.scale, 1)
      );

      camera.fov = getNumber(journeyPose.fov, cfg.endFov);
      camera.position.z = getNumber(journeyPose.camZ, cfg.endCamZ);
      camera.updateProjectionMatrix();
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

  function tick(timestamp) {
    requestAnimationFrame(tick);

    /*
     * Permite que el viaje móvil actualice canvas y pose justo antes
     * del render. Así no existen dos requestAnimationFrame compitiendo
     * ni un frame de diferencia entre el DOM y el modelo WebGL.
     */
    if (frameUpdater) {
      frameUpdater(timestamp);
    }

    resize();
    applyModelTransform();
    spinRoot.rotation.y = scrollSpinY;

    /*
     * En los cantos la silueta proyectada necesita más espacio vertical.
     * Alejamos únicamente la cámara; frente y espalda conservan el
     * encuadre aprobado y el modelo no cambia de escala ni posición.
     */
    const spinCameraExtraZ = getNumber(cfg.spinCameraExtraZ, 0);
    const sideProfile = Math.pow(
      Math.abs(Math.sin(scrollSpinY)),
      1.35
    );
    camera.position.z += spinCameraExtraZ * sideProfile;

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
    spinRoot,
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

    setScrollSpinY(value) {
      scrollSpinY = getNumber(value, 0);
    },

    setJourneyPose(value) {
      journeyPose = value
        ? {
            pos: Array.isArray(value.pos) ? value.pos.slice(0, 3) : [0, 0, 0],
            rot: Array.isArray(value.rot) ? value.rot.slice(0, 3) : [0, 0, 0],
            scale: getNumber(value.scale, 1),
            fov: getNumber(value.fov, cfg.endFov),
            camZ: getNumber(value.camZ, cfg.endCamZ),
          }
        : null;
    },

    setFrameUpdater(callback) {
      frameUpdater =
        typeof callback === 'function'
          ? callback
          : null;
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
    const initialSpinY = entry.cfg.scrollAngleTimeline
      ? getNumber(entry.cfg.hiddenStartAngle, 0)
      : 0;

    return {
      ...entry,

      currentY: initialY,
      targetY: initialY,

      currentP: 0,
      targetP: 0,

      currentSpinY: initialSpinY,
      targetSpinY: initialSpinY,
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


  /*
   * Convierte una posición visual de un elemento (por ejemplo, #stories al
   * 48% de la altura visible) al mismo espacio normalizado que usa #tech.
   * Esto hace que los puntos de la animación sigan a la composición real del
   * documento en vez de a porcentajes frágiles de una sección.
   */
  function getSelectorScrollProgress(selector, viewportRatio, fallback) {
    if (!techSection || !selector) {
      return fallback;
    }

    const element = document.querySelector(selector);

    if (!element) {
      return fallback;
    }

    const viewportHeight = Math.max(window.innerHeight, 1);
    const totalDistance = viewportHeight + techSection.offsetHeight;
    const techRect = techSection.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const ratio = clamp(getNumber(viewportRatio, 0.5), 0, 1);

    return clamp(
      (
        elementRect.top -
        techRect.top +
        viewportHeight * (1 - ratio)
      ) / Math.max(totalDistance, 1),
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

      let triggerEnd = getNumber(
        state.cfg.triggerEnd,
        1
      );

      if (state.cfg.timelineSelector) {
        triggerEnd = getSelectorScrollProgress(
          state.cfg.timelineSelector,
          state.cfg.entryEndViewportRatio,
          triggerEnd
        );
      }

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

      /* Tablet móvil: espalda → frente → espalda. Los tres hitos se
         calculan desde elementos reales del layout para que el recorrido
         sobreviva a distintas alturas de pantalla y cambios de copy. */
      if (state.cfg.scrollAngleTimeline) {
        const entryStart = getSelectorScrollProgress(
          state.cfg.entryStartSelector,
          state.cfg.entryStartViewportRatio,
          triggerStart
        );
        const rawEntryEnd = getSelectorScrollProgress(
          state.cfg.entryEndSelector,
          state.cfg.entryEndViewportRatio,
          triggerEnd
        );
        const entryEnd = Math.max(rawEntryEnd, entryStart + 0.0001);
        const rawExitStart = getSelectorScrollProgress(
          state.cfg.exitStartSelector,
          state.cfg.exitStartViewportRatio,
          entryEnd
        );
        const exitStart = Math.max(rawExitStart, entryEnd);
        const rawExitEnd = getSelectorScrollProgress(
          state.cfg.exitEndSelector,
          state.cfg.exitEndViewportRatio,
          1
        );
        const exitEnd = Math.max(rawExitEnd, exitStart + 0.0001);
        const hiddenStartAngle = getNumber(
          state.cfg.hiddenStartAngle,
          Math.PI
        );
        const frontAngle = getNumber(state.cfg.frontAngle, 0);
        const hiddenEndAngle = getNumber(
          state.cfg.hiddenEndAngle,
          -Math.PI
        );

        if (scrollProgress <= entryEnd) {
          const entryProgress = clamp(
            (scrollProgress - entryStart) /
              Math.max(entryEnd - entryStart, 0.0001),
            0,
            1
          );
          const smoothEntry =
            entryProgress * entryProgress * (3 - 2 * entryProgress);
          const entrySmoothing = clamp(
            getNumber(state.cfg.entrySmoothing, 1),
            0,
            1
          );
          const easedEntry = lerp(
            entryProgress,
            smoothEntry,
            entrySmoothing
          );

          state.targetSpinY = lerp(
            hiddenStartAngle,
            frontAngle,
            easedEntry
          );
        } else if (scrollProgress <= exitStart) {
          /* Estado intermedio: pantalla completamente frontal. */
          state.targetSpinY = frontAngle;
        } else {
          const exitProgress = clamp(
            (scrollProgress - exitStart) /
              Math.max(exitEnd - exitStart, 0.0001),
            0,
            1
          );
          const smoothExit =
            exitProgress * exitProgress * (3 - 2 * exitProgress);
          const exitSmoothing = clamp(
            getNumber(state.cfg.exitSmoothing, 1),
            0,
            1
          );
          const easedExit = lerp(
            exitProgress,
            smoothExit,
            exitSmoothing
          );

          state.targetSpinY = lerp(
            frontAngle,
            hiddenEndAngle,
            easedExit
          );
        }

        return;
      }

      const spinStart = state.cfg.spinStartsAtEntryEnd
        ? triggerEnd
        : getNumber(state.cfg.spinStart, 1);
      const spinEnd = state.cfg.timelineSelector
        ? getSelectorScrollProgress(
            state.cfg.timelineSelector,
            state.cfg.spinEndViewportRatio,
            getNumber(state.cfg.spinEnd, spinStart)
          )
        : getNumber(state.cfg.spinEnd, spinStart);
      const spinFrontElement = state.cfg.spinFrontSelector
        ? document.querySelector(state.cfg.spinFrontSelector)
        : null;

      if (spinFrontElement && techSection) {
        const viewportHeight = Math.max(window.innerHeight, 1);
        const totalDistance = viewportHeight + techSection.offsetHeight;
        const techRect = techSection.getBoundingClientRect();
        const frontRect = spinFrontElement.getBoundingClientRect();
        const viewportRatio = clamp(
          getNumber(state.cfg.spinFrontViewportRatio, 0.72),
          0,
          1
        );
        const spinFront = clamp(
          (
            frontRect.top -
            techRect.top +
            viewportHeight * (1 - viewportRatio)
          ) / Math.max(totalDistance, 1),
          spinStart + 0.0001,
          spinEnd - 0.0001
        );
        const spinFrontAngle = getNumber(state.cfg.spinFrontAngle, 0);
        const spinEndAngle = getNumber(
          state.cfg.spinEndAngle,
          spinFrontAngle
        );

        if (scrollProgress <= spinFront) {
          const firstRange = Math.max(spinFront - spinStart, 0.0001);
          const firstProgress = clamp(
            (scrollProgress - spinStart) / firstRange,
            0,
            1
          );
          const firstEase =
            firstProgress * firstProgress * (3 - 2 * firstProgress);
          state.targetSpinY = lerp(0, spinFrontAngle, firstEase);
        } else {
          const secondRange = Math.max(spinEnd - spinFront, 0.0001);
          const secondProgress = clamp(
            (scrollProgress - spinFront) / secondRange,
            0,
            1
          );
          const secondEase =
            secondProgress * secondProgress * (3 - 2 * secondProgress);
          state.targetSpinY = lerp(
            spinFrontAngle,
            spinEndAngle,
            secondEase
          );
        }
      } else {
        const entrySpinStartTurns = getNumber(
          state.cfg.entrySpinStartTurns,
          0
        );
        const entrySpinStartAngle = entrySpinStartTurns * Math.PI * 2;
        const entrySpinTurns = getNumber(state.cfg.entrySpinTurns, 0);
        const entrySpinAngle = entrySpinTurns * Math.PI * 2;
        const spinTurns = getNumber(state.cfg.spinTurns, 0);
        const spinRange = spinEnd - spinStart;
        const spinProgress = Math.abs(spinRange) < 0.000001
          ? (scrollProgress >= spinEnd ? 1 : 0)
          : clamp(
              (scrollProgress - spinStart) / spinRange,
              0,
              1
            );
        const entryRange = Math.max(spinStart - triggerStart, 0.0001);
        const entryProgress = clamp(
          (scrollProgress - triggerStart) / entryRange,
          0,
          1
        );
        const entryEase =
          entryProgress * entryProgress * (3 - 2 * entryProgress);

        const entryAngle = lerp(
          entrySpinStartAngle,
          entrySpinAngle,
          entryEase
        );

        state.targetSpinY = scrollProgress <= spinStart
          ? entryAngle
          : entrySpinAngle + spinProgress * Math.PI * 2 * spinTurns;
      }
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

      const spinSpeed = clamp(
        getNumber(state.cfg.spinLerpSpeed, speed),
        0,
        1
      );

      state.currentSpinY +=
        (
          state.targetSpinY -
          state.currentSpinY
        ) * spinSpeed;


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

        if (state.viewer.setScrollSpinY) {
          state.viewer.setScrollSpinY(
            state.currentSpinY
          );
        }
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

/*
 * Ambos modelos permanecen en sus placeholders naturales. En móvil la
 * tablet parte de espaldas fuera de pantalla, queda frontal al terminar de
 * entrar y continúa lentamente hasta despedirse nuevamente de espaldas.
 */
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
