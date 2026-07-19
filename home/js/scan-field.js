/* Interactive scanning surface behind the scanner model and copy. */
(function initScanField() {
  // Light position uses normalized scan coordinates: X 0/1 = left/right,
  // Y 0/1 = bottom/top. These are the main interaction controls.
  const SCAN_LIGHT_CONFIG = Object.freeze({
    defaultX: 0.32,
    defaultY: 0.54,
    followSpeed: 0.10,
    returnSpeed: 0.06,
    reducedMotionSpeed: 0.22,
    activeHalf: 0.50,
    coordinateWidth: 0.58,
  });

  const section = document.getElementById('tech');
  const canvas = document.getElementById('tech-canvas');

  if (!section || !canvas || typeof THREE === 'undefined') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  // Supersample on standard-density displays so fine lines and particles stay crisp.
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 8.6);

  const field = new THREE.Group();
  field.position.set(-2.5, -0.1, 0);
  field.rotation.set(-0.15, -0.28, -0.03);
  scene.add(field);

  const columns = 36;
  const rows = 31;
  const width = 8.6;
  const height = 7.0;
  const positions = [];
  const scanCoords = [];

  // An irregular height field reads like sampled geometry instead of a flat grid.
  function samplePoint(column, row) {
    const u = column / (columns - 1);
    const v = row / (rows - 1);
    const seed = Math.sin(column * 91.17 + row * 47.31) * 43758.5453;
    const jitter = (seed - Math.floor(seed) - 0.5) * 0.055;
    const x = (u - 0.5) * width + jitter;
    const y = (v - 0.5) * height + jitter;
    const z =
      Math.sin(u * Math.PI * 7.2 + v * 2.1) * 0.32 +
      Math.cos(v * Math.PI * 8.4 - u * 1.8) * 0.26 +
      Math.sin((u + v) * Math.PI * 11.0) * 0.14 +
      Math.cos((u - v) * Math.PI * 6.0) * 0.12 -
      Math.exp(-((u - 0.34) ** 2 + (v - 0.58) ** 2) * 34) * 0.65 +
      Math.exp(-((u - 0.66) ** 2 + (v - 0.32) ** 2) * 42) * 0.52;
    return { x, y, z, u, v };
  }

  const points = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      points.push(samplePoint(column, row));
    }
  }

  function pushVertex(point) {
    positions.push(point.x, point.y, point.z);
    scanCoords.push(point.u, point.v);
  }

  // Horizontal, vertical and occasional diagonal edges form a connected scan mesh.
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      if (column < columns - 1) {
        pushVertex(points[index]);
        pushVertex(points[index + 1]);
      }
      if (row < rows - 1) {
        pushVertex(points[index]);
        pushVertex(points[index + columns]);
      }
      if (column < columns - 1 && row < rows - 1 && (column + row) % 3 === 0) {
        pushVertex(points[index]);
        pushVertex(points[index + columns + 1]);
      }
    }
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  lineGeometry.setAttribute('scanCoord', new THREE.Float32BufferAttribute(scanCoords, 2));

  const uniforms = {
    uMouse: { value: new THREE.Vector2(SCAN_LIGHT_CONFIG.defaultX, SCAN_LIGHT_CONFIG.defaultY) },
    uReveal: { value: 1 },
    uTime: { value: 0 },
  };

  const vertexShader = `
    attribute vec2 scanCoord;
    varying vec2 vScanCoord;
    void main() {
      vScanCoord = scanCoord;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const revealFragment = `
    uniform vec2 uMouse;
    uniform float uReveal;
    uniform float uTime;
    varying vec2 vScanCoord;
    float revealMask() {
      vec2 delta = vScanCoord - uMouse;
      // Compensa el campo expandido para conservar el tamaño visual del halo.
      delta.x *= 1.49;
      delta.y *= 1.30;
      float distanceToCursor = length(delta);

      // Small readable scan core, followed by a wider and much softer falloff.
      float core = 1.0 - smoothstep(0.0325, 0.1625, distanceToCursor);
      float halo = (1.0 - smoothstep(0.10, 0.48, distanceToCursor)) * 0.22;

      // The fade reaches farther behind the copy and opens toward the bottom.
      // It still closes completely before entering the right-hand technology.
      float lowerZone = 1.0 - smoothstep(0.18, 0.50, vScanCoord.y);
      float fadeStart = mix(0.40, 0.55, lowerZone);
      float fadeEnd = mix(0.72, 0.86, lowerZone);
      float copyFade = 1.0 - smoothstep(fadeStart, fadeEnd, vScanCoord.x);

      float pointerLowerZone = 1.0 - smoothstep(0.18, 0.50, uMouse.y);
      float pointerFadeStart = mix(0.43, 0.62, pointerLowerZone);
      float pointerFadeEnd = mix(0.73, 0.88, pointerLowerZone);
      float pointerFade = 1.0 - smoothstep(pointerFadeStart, pointerFadeEnd, uMouse.x);
      // Piso de visibilidad dentro de las zonas de fade: la malla queda
      // levemente iluminada en reposo sin sangrar hacia el resto de la página.
      const float BASE = 0.10;
      return max(max(core, halo), BASE) * uReveal * copyFade * pointerFade;
    }
  `;

  const lineMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: `${revealFragment}
      void main() {
        float reveal = revealMask();
        float alpha = reveal * 0.68;
        vec3 color = mix(vec3(0.10, 0.34, 0.38), vec3(0.0, 0.92, 0.95), reveal);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  field.add(new THREE.LineSegments(lineGeometry, lineMaterial));

  const pointPositions = [];
  const pointCoords = [];
  points.forEach((point) => {
    pointPositions.push(point.x, point.y, point.z + 0.015);
    pointCoords.push(point.u, point.v);
  });
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
  pointGeometry.setAttribute('scanCoord', new THREE.Float32BufferAttribute(pointCoords, 2));

  const pointMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      attribute vec2 scanCoord;
      varying vec2 vScanCoord;
      void main() {
        vScanCoord = scanCoord;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 3.8 * (8.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `${revealFragment}
      void main() {
        float circle = 1.0 - smoothstep(0.32, 0.5, length(gl_PointCoord - 0.5));
        float reveal = revealMask();
        float alpha = reveal * 0.82 * circle;
        gl_FragColor = vec4(mix(vec3(0.25, 0.56, 0.62), vec3(0.25, 1.0, 1.0), reveal), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  field.add(new THREE.Points(pointGeometry, pointMaterial));

  // A second, free-floating particle layer adds depth without changing the mesh.
  const dustPositions = [];
  const dustCoords = [];
  const dustPhases = [];
  const dustSizes = [];
  const dustStretches = [];
  const dustAngles = [];
  const dustFlowAngles = [];
  const dustFlowSpeeds = [];
  const dustDepthOffsets = [];
  let dustSeed = 7421;

  function dustRandom() {
    dustSeed = (dustSeed * 16807) % 2147483647;
    return (dustSeed - 1) / 2147483646;
  }

  for (let index = 0; index < 336; index += 1) {
    const u = dustRandom();
    const v = dustRandom();
    const surface = samplePoint(u * (columns - 1), v * (rows - 1));
    const depthOffset = (dustRandom() - 0.5) * 0.9;

    dustPositions.push(
      surface.x + (dustRandom() - 0.5) * 0.12,
      surface.y + (dustRandom() - 0.5) * 0.12,
      surface.z + depthOffset
    );
    dustCoords.push(u, v);
    dustPhases.push(dustRandom() * Math.PI * 2);
    dustSizes.push(7.0 + dustRandom() * 6.0);
    dustStretches.push(1.0 + dustRandom() * 1.4);
    dustAngles.push(dustRandom() * Math.PI * 2);
    dustFlowAngles.push(dustRandom() * Math.PI * 2);
    dustFlowSpeeds.push(0.012 + dustRandom() * 0.024);
    dustDepthOffsets.push(depthOffset);
  }

  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute('scanCoord', new THREE.Float32BufferAttribute(dustCoords, 2));
  dustGeometry.setAttribute('phase', new THREE.Float32BufferAttribute(dustPhases, 1));
  dustGeometry.setAttribute('particleSize', new THREE.Float32BufferAttribute(dustSizes, 1));
  dustGeometry.setAttribute('particleStretch', new THREE.Float32BufferAttribute(dustStretches, 1));
  dustGeometry.setAttribute('particleAngle', new THREE.Float32BufferAttribute(dustAngles, 1));
  dustGeometry.setAttribute('flowAngle', new THREE.Float32BufferAttribute(dustFlowAngles, 1));
  dustGeometry.setAttribute('flowSpeed', new THREE.Float32BufferAttribute(dustFlowSpeeds, 1));
  dustGeometry.setAttribute('depthOffset', new THREE.Float32BufferAttribute(dustDepthOffsets, 1));

  const dustMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uReveal;
      attribute vec2 scanCoord;
      attribute float phase;
      attribute float particleSize;
      attribute float particleStretch;
      attribute float particleAngle;
      attribute float flowAngle;
      attribute float flowSpeed;
      attribute float depthOffset;
      varying vec2 vScanCoord;
      varying float vTwinkle;
      varying float vStretch;
      varying float vAngle;

      float randomValue(float value) {
        return fract(sin(value * 91.3458) * 47453.5453);
      }

      float smoothNoise(float value) {
        float integerPart = floor(value);
        float fractionPart = fract(value);
        float easedFraction = fractionPart * fractionPart * (3.0 - 2.0 * fractionPart);
        return mix(
          randomValue(integerPart),
          randomValue(integerPart + 1.0),
          easedFraction
        );
      }

      void main() {
        float motionTime = uTime * 1.20;
        vStretch = particleStretch;
        vAngle = particleAngle + (smoothNoise(motionTime * 0.10 + phase) - 0.5) * 0.65;
        vTwinkle = 0.70 + smoothNoise(uTime * 0.32 + phase * 2.3) * 0.28;

        vec2 baseVelocity = vec2(cos(flowAngle), sin(flowAngle)) * flowSpeed;
        vec2 wander = vec2(
          smoothNoise(motionTime * 0.11 + phase * 3.7),
          smoothNoise(motionTime * 0.095 + phase * 5.9 + 17.0)
        ) - 0.5;
        vec2 movingCoord = fract(
          scanCoord + baseVelocity * motionTime + wander * 0.20
        );

        vec3 driftingPosition;
        driftingPosition.x = (movingCoord.x - 0.5) * 8.6;
        driftingPosition.y = (movingCoord.y - 0.5) * 7.0;
        driftingPosition.z =
          sin(movingCoord.x * 3.14159265 * 7.2 + movingCoord.y * 2.1) * 0.32 +
          cos(movingCoord.y * 3.14159265 * 8.4 - movingCoord.x * 1.8) * 0.26 +
          sin((movingCoord.x + movingCoord.y) * 3.14159265 * 11.0) * 0.14 +
          cos((movingCoord.x - movingCoord.y) * 3.14159265 * 6.0) * 0.12 -
          exp(-(
            pow(movingCoord.x - 0.34, 2.0) +
            pow(movingCoord.y - 0.58, 2.0)
          ) * 34.0) * 0.65 +
          exp(-(
            pow(movingCoord.x - 0.66, 2.0) +
            pow(movingCoord.y - 0.32, 2.0)
          ) * 42.0) * 0.52 +
          depthOffset;

        vec2 cursorDelta = movingCoord - uMouse;
        vec2 scaledCursorDelta = vec2(cursorDelta.x * 1.49, cursorDelta.y * 1.30);
        float cursorForce =
          (1.0 - smoothstep(0.025, 0.34, length(scaledCursorDelta))) * uReveal;
        vec2 pushDirection = normalize(cursorDelta + vec2(0.0001));
        vec2 tangent = vec2(-pushDirection.y, pushDirection.x);
        vec2 reactiveOffset = pushDirection * cursorForce * 0.22;
        reactiveOffset +=
          tangent * (smoothNoise(motionTime * 0.8 + phase * 7.1) - 0.5) *
          cursorForce * 0.22;
        driftingPosition.xy += reactiveOffset;

        vScanCoord = movingCoord + vec2(
          reactiveOffset.x / 8.6,
          reactiveOffset.y / 7.0
        );

        vec4 mvPosition = modelViewMatrix * vec4(driftingPosition, 1.0);
        gl_PointSize = max(
          4.0,
          particleSize * (8.0 / -mvPosition.z)
        );
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `${revealFragment}
      varying float vTwinkle;
      varying float vStretch;
      varying float vAngle;
      void main() {
        vec2 point = gl_PointCoord - 0.5;
        float pointDistance = length(point) / 0.5;
        float turquoiseHalo = 1.0 - smoothstep(0.32, 1.0, pointDistance);
        float whiteCore = 1.0 - smoothstep(0.04, 0.52, pointDistance);
        float reveal = pow(revealMask(), 0.42);
        float alpha = reveal * vTwinkle * (
          turquoiseHalo * 0.94 + whiteCore * 1.20
        );
        vec3 color = mix(
          vec3(0.02, 0.58, 0.66),
          vec3(1.0, 1.0, 1.0),
          whiteCore * 0.94
        );
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  field.add(new THREE.Points(dustGeometry, dustMaterial));

  let scannerPointerActive = false;
  let targetMouseX = SCAN_LIGHT_CONFIG.defaultX;
  let targetMouseY = SCAN_LIGHT_CONFIG.defaultY;

  function returnLightToDefault() {
    scannerPointerActive = false;
    targetMouseX = SCAN_LIGHT_CONFIG.defaultX;
    targetMouseY = SCAN_LIGHT_CONFIG.defaultY;
    section.dataset.scanActive = 'false';
  }

  function updateScanner(event) {
    const rect = section.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    scannerPointerActive = relativeX >= 0 && relativeX < SCAN_LIGHT_CONFIG.activeHalf;

    if (!scannerPointerActive) {
      returnLightToDefault();
      return;
    }

    // The mesh is wider than the active half, hence its separate coordinate mapping.
    targetMouseX = THREE.MathUtils.clamp(
      (event.clientX - rect.left) / (rect.width * SCAN_LIGHT_CONFIG.coordinateWidth),
      0,
      1
    );
    targetMouseY = THREE.MathUtils.clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
    section.dataset.scanActive = 'true';
  }

  section.addEventListener('pointerleave', returnLightToDefault);
  section.addEventListener('pointermove', updateScanner, { passive: true });
  window.addEventListener('blur', returnLightToDefault);

  function resize() {
    // El canvas define su propio alto en móvil (CSS lo recorta a la zona del
    // escáner); usar la sección aquí estiraría el buffer y deformaría la malla.
    const widthPx = Math.max(canvas.clientWidth || section.clientWidth, 1);
    const heightPx = Math.max(canvas.clientHeight || section.clientHeight || 400, 1);
    const ratio = renderer.getPixelRatio();
    if (canvas.width !== Math.floor(widthPx * ratio) || canvas.height !== Math.floor(heightPx * ratio)) {
      renderer.setSize(widthPx, heightPx, false);
      camera.aspect = widthPx / heightPx;
      camera.updateProjectionMatrix();

      // En pantallas angostas el campo original (centrado en x=-2.5) queda
      // fuera del encuadre: se recentra y se escala al ancho visible.
      if (window.innerWidth <= 540) {
        const visibleHeight = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
        const visibleWidth = visibleHeight * camera.aspect;
        const fieldScale = (visibleWidth * 1.12) / width;
        field.position.set(0, 0.15, 0);
        field.scale.setScalar(fieldScale);
      } else {
        field.position.set(-2.5, -0.1, 0);
        field.scale.setScalar(1);
      }
    }
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resize).observe(canvas);
  }

  const clock = new THREE.Clock();
  function render() {
    requestAnimationFrame(render);
    resize();
    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;
    const lightMoveSpeed = reducedMotion
      ? SCAN_LIGHT_CONFIG.reducedMotionSpeed
      : scannerPointerActive
        ? SCAN_LIGHT_CONFIG.followSpeed
        : SCAN_LIGHT_CONFIG.returnSpeed;
    uniforms.uMouse.value.x += (targetMouseX - uniforms.uMouse.value.x) * lightMoveSpeed;
    uniforms.uMouse.value.y += (targetMouseY - uniforms.uMouse.value.y) * lightMoveSpeed;
    if (!reducedMotion) field.rotation.y = -0.16 + Math.sin(elapsed * 0.18) * 0.025;
    renderer.render(scene, camera);
  }

  render();
})();
