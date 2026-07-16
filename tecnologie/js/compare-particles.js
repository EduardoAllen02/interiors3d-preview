/* Floor particles behind the comparison table.
   Ethereal autonomous drift on a simulated ground plane, scattered by the
   pointer, lit by a volumetric source in the top-right corner. */
(function initCompareParticles() {
  const section = document.getElementById('compare');
  const canvas = document.getElementById('compare-canvas');
  if (!section || !canvas || typeof THREE === 'undefined') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.5));

  const scene = new THREE.Scene();
  // Camera slightly above the floor, looking down at a shallow angle so the
  // particles read as scattered across a ground plane with depth.
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 1.35, 7.4);
  camera.lookAt(0, -0.55, 0);

  const FLOOR_Y = -1.15;
  // Light source anchored to the top-right corner of the scene.
  const LIGHT_POS = new THREE.Vector3(8.2, 3.4, -1.6);

  const COUNT = 460;
  const basePositions = [];
  const phases = [];
  const speeds = [];
  const sizes = [];
  const floats = [];

  let seed = 20260714;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let i = 0; i < COUNT; i += 1) {
    const x = (rand() - 0.5) * 21;
    const z = -5.5 + rand() * 9;
    // Most particles rest near the floor; a few float slightly above it.
    const floating = rand();
    const y = FLOOR_Y + (floating > 0.82 ? rand() * 1.7 : rand() * 0.16);
    basePositions.push(x, y, z);
    phases.push(rand() * Math.PI * 2);
    speeds.push(0.35 + rand() * 0.9);
    sizes.push(5.5 + rand() * 7.5);
    floats.push(floating > 0.82 ? 1.0 : 0.0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('basePos', new THREE.Float32BufferAttribute(basePositions, 3));
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(basePositions.slice(), 3));
  geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
  geometry.setAttribute('speed', new THREE.Float32BufferAttribute(speeds, 1));
  geometry.setAttribute('particleSize', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('floating', new THREE.Float32BufferAttribute(floats, 1));

  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(999, 999) },   // world xz
    uPointerStrength: { value: 0 },
    uLightPos: { value: LIGHT_POS },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uPointerStrength;
      uniform vec3 uLightPos;
      attribute vec3 basePos;
      attribute float phase;
      attribute float speed;
      attribute float particleSize;
      attribute float floating;
      varying float vLight;
      varying float vTwinkle;

      float rnd(float v) { return fract(sin(v * 91.3458) * 47453.5453); }
      float snoise(float v) {
        float i = floor(v);
        float f = fract(v);
        float e = f * f * (3.0 - 2.0 * f);
        return mix(rnd(i), rnd(i + 1.0), e);
      }

      void main() {
        float t = uTime * 0.22 * speed;

        // Autonomous ethereal wander: slow figure-eight drift on the floor,
        // gentle bobbing for the floating ones.
        vec3 pos = basePos;
        pos.x += (snoise(t + phase * 3.1) - 0.5) * 1.35;
        pos.z += (snoise(t * 0.8 + phase * 5.7 + 11.0) - 0.5) * 1.1;
        pos.y += floating * (snoise(t * 0.6 + phase * 2.3) - 0.5) * 0.7
               + (1.0 - floating) * abs(snoise(t * 1.4 + phase * 7.7) - 0.5) * 0.12;

        // Pointer scatter: push away on the floor plane, with a slight lift.
        // Fuerza contenida para que el gesto se sienta sutil, no explosivo.
        vec2 delta = pos.xz - uPointer;
        float dist = length(delta);
        float force = (1.0 - smoothstep(0.0, 2.6, dist)) * uPointerStrength;
        vec2 dir = normalize(delta + vec2(0.0001));
        pos.xz += dir * force * 0.85;
        pos.y += force * 0.22;

        // Volumetric light from the corner: closer = brighter.
        float lightDist = distance(pos, uLightPos);
        vLight = clamp(2.6 / (1.0 + lightDist * 0.42), 0.0, 1.0);
        vTwinkle = 0.62 + snoise(uTime * 0.5 + phase * 4.2) * 0.38;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = particleSize * (7.2 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vLight;
      varying float vTwinkle;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p) / 0.5;
        float core = 1.0 - smoothstep(0.05, 0.5, d);
        float glow = 1.0 - smoothstep(0.25, 1.0, d);

        // Lit particles pull toward warm white; shaded ones stay deep teal.
        vec3 shaded = vec3(0.05, 0.34, 0.38);
        vec3 lit = vec3(0.78, 1.0, 0.98);
        vec3 color = mix(shaded, lit, vLight * 0.9);

        float alpha = (glow * 0.42 + core * 0.75) * vTwinkle * (0.28 + vLight * 0.72);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  scene.add(new THREE.Points(geometry, material));

  // Pointer → world floor coordinates via ray/plane intersection.
  const raycaster = new THREE.Raycaster();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  // El puntero del shader persigue al real con retardo: un mouse rápido
  // no lanza las partículas, la onda lo sigue con calma.
  const pointerGoal = new THREE.Vector2(999, 999);
  let pointerTarget = 0;

  section.addEventListener('pointermove', (event) => {
    const rect = section.getBoundingClientRect();
    ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(floorPlane, hit)) {
      if (pointerTarget === 0) uniforms.uPointer.value.set(hit.x, hit.z);
      pointerGoal.set(hit.x, hit.z);
      pointerTarget = 1;
    }
  }, { passive: true });
  section.addEventListener('pointerleave', () => { pointerTarget = 0; });
  window.addEventListener('blur', () => { pointerTarget = 0; });

  function resize() {
    const w = Math.max(section.clientWidth, 1);
    const h = Math.max(section.clientHeight, 1);
    const ratio = renderer.getPixelRatio();
    if (canvas.width !== Math.floor(w * ratio) || canvas.height !== Math.floor(h * ratio)) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  const clock = new THREE.Clock();
  function render() {
    requestAnimationFrame(render);
    resize();
    uniforms.uTime.value = clock.getElapsedTime();
    const speed = pointerTarget > uniforms.uPointerStrength.value ? 0.06 : 0.03;
    uniforms.uPointerStrength.value += (pointerTarget - uniforms.uPointerStrength.value) * speed;
    // Persecución amortiguada del puntero real.
    uniforms.uPointer.value.lerp(pointerGoal, 0.055);
    if (reducedMotion) uniforms.uPointerStrength.value = 0;
    renderer.render(scene, camera);
  }

  render();
})();
