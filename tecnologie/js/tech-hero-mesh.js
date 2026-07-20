/* Interactive scan mesh across the full tecnologie hero.
   The light follows the pointer anywhere in the section and
   rests at a default spot on the right when idle. */
(function initTechHeroMesh() {
  const section = document.getElementById('tech-hero');
  const canvas = document.getElementById('tech-hero-canvas');
  if (!section || !canvas || typeof THREE === 'undefined') return;

  const LIGHT = Object.freeze({
    defaultX: 0.74,
    defaultY: 0.45,
    followSpeed: 0.10,
    returnSpeed: 0.05,
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 8.4);

  const field = new THREE.Group();
  field.rotation.set(-0.34, -0.07, -0.01);
  field.position.set(0, -0.3, 0);
  scene.add(field);

  const columns = 42;
  const rows = 12;
  const width = 10;   // rescaled dynamically in layoutField()
  const height = 4.2;
  const positions = [];
  const scanCoords = [];

  function samplePoint(column, row) {
    const u = column / (columns - 1);
    const v = row / (rows - 1);
    const seed = Math.sin(column * 91.17 + row * 47.31) * 43758.5453;
    const jitter = (seed - Math.floor(seed) - 0.5) * 0.09;
    const x = (u - 0.5) * width + jitter;
    const y = (v - 0.5) * height + jitter;
    const z =
      Math.sin(u * Math.PI * 7.6 + v * 2.2) * 0.30 +
      Math.cos(v * Math.PI * 6.0 - u * 2.0) * 0.24 +
      Math.sin((u + v) * Math.PI * 10.0) * 0.12;
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
    uMouse: { value: new THREE.Vector2(LIGHT.defaultX, LIGHT.defaultY) },
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

  // Halo around the pointer plus a faint base glow so the mesh
  // is always barely readable behind the copy.
  const revealFragment = `
    uniform vec2 uMouse;
    uniform float uTime;
    varying vec2 vScanCoord;
    float revealMask() {
      vec2 delta = vScanCoord - uMouse;
      delta.x *= 2.4;
      float distanceToCursor = length(delta);
      float core = 1.0 - smoothstep(0.03, 0.16, distanceToCursor);
      float halo = (1.0 - smoothstep(0.10, 0.52, distanceToCursor)) * 0.24;
      float base = 0.05;
      // Fade the mesh out toward the left, where the headline lives.
      float copyFade = smoothstep(0.05, 0.42, vScanCoord.x);
      return max(max(core, halo), base) * copyFade;
    }
  `;

  const lineMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: `${revealFragment}
      void main() {
        float reveal = revealMask();
        float alpha = reveal * 0.62;
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
    pointPositions.push(point.x, point.y, point.z + 0.012);
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
        gl_PointSize = 4.2 * (8.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `${revealFragment}
      void main() {
        float circle = 1.0 - smoothstep(0.32, 0.5, length(gl_PointCoord - 0.5));
        float reveal = revealMask();
        float alpha = reveal * 0.88 * circle;
        gl_FragColor = vec4(mix(vec3(0.25, 0.56, 0.62), vec3(0.35, 1.0, 1.0), reveal), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  field.add(new THREE.Points(pointGeometry, pointMaterial));

  // Free-floating dust layer drifting across the mesh for depth.
  const DUST_COUNT = 150;
  const dustCoordsArr = [];
  const dustPhases = [];
  const dustSizes = [];
  let dustSeed = 4211;
  function dustRandom() {
    dustSeed = (dustSeed * 16807) % 2147483647;
    return (dustSeed - 1) / 2147483646;
  }
  for (let i = 0; i < DUST_COUNT; i += 1) {
    dustCoordsArr.push(dustRandom(), dustRandom());
    dustPhases.push(dustRandom() * Math.PI * 2);
    dustSizes.push(6.0 + dustRandom() * 6.5);
  }
  const dustGeometry = new THREE.BufferGeometry();
  // Positions are derived in the shader from scanCoord; buffer only sizes count.
  dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Array(DUST_COUNT * 3).fill(0), 3));
  dustGeometry.setAttribute('scanCoord', new THREE.Float32BufferAttribute(dustCoordsArr, 2));
  dustGeometry.setAttribute('phase', new THREE.Float32BufferAttribute(dustPhases, 1));
  dustGeometry.setAttribute('particleSize', new THREE.Float32BufferAttribute(dustSizes, 1));

  const dustMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uTime;
      attribute vec2 scanCoord;
      attribute float phase;
      attribute float particleSize;
      varying vec2 vScanCoord;
      varying float vTwinkle;

      float rnd(float v) { return fract(sin(v * 91.3458) * 47453.5453); }
      float snoise(float v) {
        float i = floor(v);
        float f = fract(v);
        float e = f * f * (3.0 - 2.0 * f);
        return mix(rnd(i), rnd(i + 1.0), e);
      }

      void main() {
        float t = uTime * 0.05;
        vec2 moving = fract(scanCoord + vec2(t * (0.4 + rnd(phase) * 0.5), 0.0)
          + (vec2(snoise(uTime * 0.09 + phase * 3.7), snoise(uTime * 0.08 + phase * 5.9)) - 0.5) * 0.16);
        vScanCoord = moving;
        vTwinkle = 0.55 + snoise(uTime * 0.4 + phase * 2.3) * 0.45;

        vec3 pos;
        pos.x = (moving.x - 0.5) * ${width.toFixed(1)};
        pos.y = (moving.y - 0.5) * ${height.toFixed(1)};
        pos.z = sin(moving.x * 3.14159 * 7.6 + moving.y * 2.2) * 0.30 + 0.35
          + (snoise(phase * 9.1) - 0.5) * 0.9;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = particleSize * (8.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `${revealFragment}
      varying float vTwinkle;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p) / 0.5;
        float halo = 1.0 - smoothstep(0.28, 1.0, d);
        float core = 1.0 - smoothstep(0.04, 0.5, d);
        float reveal = pow(revealMask(), 0.5);
        float alpha = reveal * vTwinkle * (halo * 0.7 + core * 1.0);
        vec3 color = mix(vec3(0.03, 0.55, 0.62), vec3(1.0), core * 0.9);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
  dustPoints.frustumCulled = false; // positions live in the shader
  field.add(dustPoints);

  let pointerActive = false;
  let targetX = LIGHT.defaultX;
  let targetY = LIGHT.defaultY;

  /* Deriva autónoma de la luz cuando no hay puntero: suma de senos con
     frecuencias inconmensurables + ruido suave. Se siente como una mano
     humana paseando el mouse: rumbo cambiante, pausas y aceleraciones
     suaves, nunca un patrón repetido ni giros mecánicos. */
  function smoothNoise(v) {
    const i = Math.floor(v);
    const f = v - i;
    const r = (n) => {
      const s = Math.sin(n * 91.3458) * 47453.5453;
      return s - Math.floor(s);
    };
    const e = f * f * (3 - 2 * f);
    return r(i) * (1 - e) + r(i + 1) * e;
  }

  function idleTarget(t) {
    // Velocidad ×1.5 respecto al original.
    const wx =
      Math.sin(t * 0.645) * 0.26 +
      Math.sin(t * 0.317 + 1.7) * 0.16 +
      (smoothNoise(t * 0.24) - 0.5) * 0.30;
    const wy =
      Math.sin(t * 0.476 + 0.9) * 0.24 +
      Math.sin(t * 0.236 + 3.1) * 0.14 +
      (smoothNoise(t * 0.195 + 40.0) - 0.5) * 0.30;
    // Centrado hacia la zona visible de la malla (derecha del copy).
    // En móvil solo se ve la franja central de la malla (escala uniforme),
    // así que la luz se restringe a ese rango para no salir de cuadro.
    if (window.innerWidth <= 768) {
      return {
        x: THREE.MathUtils.clamp(0.5 + wx * 0.35, 0.40, 0.60),
        y: THREE.MathUtils.clamp(0.5 + wy, 0.12, 0.88),
      };
    }
    return {
      x: THREE.MathUtils.clamp(0.66 + wx, 0.34, 0.97),
      y: THREE.MathUtils.clamp(0.5 + wy, 0.12, 0.88),
    };
  }

  function resetLight() {
    pointerActive = false;
  }

  section.addEventListener('pointermove', (event) => {
    const rect = section.getBoundingClientRect();
    targetX = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    targetY = THREE.MathUtils.clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
    pointerActive = true;
  }, { passive: true });
  section.addEventListener('pointerleave', resetLight);
  window.addEventListener('blur', resetLight);

  function layoutField() {
    const visibleHeight = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const visibleWidth = visibleHeight * camera.aspect;
    if (window.innerWidth <= 768) {
      // Portrait: el escalado por eje comprimía la malla horizontalmente.
      // Escala uniforme ajustada al alto; el sobrante horizontal queda
      // fuera de cámara y las celdas conservan la proporción de desktop.
      const s = (visibleHeight * 1.15) / height;
      field.scale.set(s, s, 1.5);
      return;
    }
    field.scale.set((visibleWidth * 1.06) / width, (visibleHeight * 1.3) / height, 1.5);
  }

  function resize() {
    const widthPx = Math.max(canvas.offsetWidth, 1);
    const heightPx = Math.max(canvas.offsetHeight, 1);
    const ratio = renderer.getPixelRatio();
    if (canvas.width !== Math.floor(widthPx * ratio) || canvas.height !== Math.floor(heightPx * ratio)) {
      renderer.setSize(widthPx, heightPx, false);
      camera.aspect = widthPx / heightPx;
      camera.updateProjectionMatrix();
      layoutField();
    }
  }

  const clock = new THREE.Clock();
  function render() {
    requestAnimationFrame(render);
    resize();
    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;
    if (!pointerActive) {
      const idle = idleTarget(elapsed);
      targetX = idle.x;
      targetY = idle.y;
    }
    const speed = reducedMotion ? 0.22 : pointerActive ? LIGHT.followSpeed : 0.035;
    uniforms.uMouse.value.x += (targetX - uniforms.uMouse.value.x) * speed;
    uniforms.uMouse.value.y += (targetY - uniforms.uMouse.value.y) * speed;
    if (!reducedMotion) field.rotation.y = -0.07 + Math.sin(elapsed * 0.24) * 0.02;
    renderer.render(scene, camera);
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => resize()).observe(canvas);
  }

  render();
})();
