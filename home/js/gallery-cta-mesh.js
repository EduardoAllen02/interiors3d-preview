/* Scan mesh inside the gallery CTA box.
   Dark at rest; hovering the CTA button sweeps a scan light right-to-left.
   The mesh occupies the right ~55% of the container and fades out on its left edge. */
(function initGalleryCtaMesh() {
  const box = document.querySelector('.stories-gallery-cta');
  const canvas = document.getElementById('cta-mesh-canvas');
  const button = document.querySelector('.stories-gallery-btn');

  if (!box || !canvas || !button || typeof THREE === 'undefined') return;

  const MESH_WIDTH_RATIO = 0.55;   // fraction of the visible width the mesh covers
  const MESH_HEIGHT_RATIO = 1.25;  // slight vertical overflow so edges never show

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 8.2);

  const field = new THREE.Group();
  field.rotation.set(-0.38, -0.10, -0.012);
  scene.add(field);

  // Open grid — sparse nodes so the mesh reads airy, not cramped.
  const columns = 26;
  const rows = 6;
  const width = 10;    // base size; rescaled dynamically in layoutField()
  const height = 3.2;
  const positions = [];
  const scanCoords = [];

  function samplePoint(column, row) {
    const u = column / (columns - 1);
    const v = row / (rows - 1);
    const seed = Math.sin(column * 91.17 + row * 47.31) * 43758.5453;
    const jitter = (seed - Math.floor(seed) - 0.5) * 0.14;
    const x = (u - 0.5) * width + jitter;
    const y = (v - 0.5) * height + jitter;
    const z =
      Math.sin(u * Math.PI * 6.4 + v * 2.2) * 0.30 +
      Math.cos(v * Math.PI * 4.6 - u * 2.0) * 0.24 +
      Math.sin((u + v) * Math.PI * 9.0) * 0.13;
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
      if (column < columns - 1 && row < rows - 1 && (column + row) % 4 === 0) {
        pushVertex(points[index]);
        pushVertex(points[index + columns + 1]);
      }
    }
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  lineGeometry.setAttribute('scanCoord', new THREE.Float32BufferAttribute(scanCoords, 2));

  const uniforms = {
    uLightX: { value: 1.25 },   // scan head position: sweeps 1.25 -> -0.25
    uGlow: { value: 0 },        // overall intensity 0..1
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

  // Scan band around uLightX plus a soft trail on already-scanned area
  // (x greater than the head — the sweep travels right to left).
  // The mesh dissolves toward its left edge so it blends into the copy side.
  const revealFragment = `
    uniform float uLightX;
    uniform float uGlow;
    uniform float uTime;
    varying vec2 vScanCoord;
    float revealMask() {
      float distanceToHead = abs(vScanCoord.x - uLightX);
      float band = 1.0 - smoothstep(0.03, 0.20, distanceToHead);
      float scanned = smoothstep(uLightX - 0.02, uLightX + 0.16, vScanCoord.x);
      float trail = scanned * 0.38;
      float edgeFade = smoothstep(0.0, 0.30, vScanCoord.x);
      // BASE keeps the mesh faintly visible at all times; sweep adds on top.
      float sweep = max(band, trail) * uGlow;
      return max(sweep, 0.22) * edgeFade;
    }
  `;

  const lineMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: `${revealFragment}
      void main() {
        float reveal = revealMask();
        float alpha = reveal * 0.60;
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
        gl_PointSize = 4.6 * (8.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `${revealFragment}
      void main() {
        float circle = 1.0 - smoothstep(0.32, 0.5, length(gl_PointCoord - 0.5));
        float reveal = revealMask();
        float alpha = reveal * 0.9 * circle;
        gl_FragColor = vec4(mix(vec3(0.25, 0.56, 0.62), vec3(0.35, 1.0, 1.0), reveal), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  field.add(new THREE.Points(pointGeometry, pointMaterial));

  // Sweep state driven by button hover.
  const SWEEP_DURATION = 1.15;
  let hovering = false;
  let sweepStart = null;
  let glowTarget = 0;

  button.addEventListener('mouseenter', () => {
    hovering = true;
    glowTarget = 1;
    sweepStart = performance.now();
  });
  button.addEventListener('mouseleave', () => {
    hovering = false;
    glowTarget = 0;
  });

  // Anchors the mesh to the right side, spanning MESH_WIDTH_RATIO of the
  // visible width regardless of the container's aspect ratio.
  function layoutField() {
    const visibleHeight = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const visibleWidth = visibleHeight * camera.aspect;
    const targetWidth = visibleWidth * MESH_WIDTH_RATIO;
    const scaleX = targetWidth / width;
    const scaleY = (visibleHeight * MESH_HEIGHT_RATIO) / height;
    field.scale.set(scaleX, scaleY, 1.6);
    field.position.set(visibleWidth / 2 - targetWidth / 2, -0.1, 0);
  }

  function resize() {
    const widthPx = Math.max(box.clientWidth, 1);
    const heightPx = Math.max(box.clientHeight, 1);
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
    uniforms.uTime.value = clock.getElapsedTime();

    const glowSpeed = glowTarget > uniforms.uGlow.value ? 0.14 : 0.05;
    uniforms.uGlow.value += (glowTarget - uniforms.uGlow.value) * glowSpeed;

    if (hovering && sweepStart !== null) {
      const t = Math.min((performance.now() - sweepStart) / (SWEEP_DURATION * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      uniforms.uLightX.value = reducedMotion ? -0.25 : 1.25 - eased * 1.5;
    } else if (!hovering && uniforms.uGlow.value < 0.01) {
      uniforms.uLightX.value = 1.25;
      sweepStart = null;
    }

    renderer.render(scene, camera);
  }

  render();
})();
