/* Glass atmosphere and 360-degree symbol behind the immersive tablet. */
(function initImmersiveField() {
  /* ============================================================
     IMMERSIVE BACKGROUND — easy-to-tune visual controls
     Positions use normalized coordinates inside the right panel:
     X: 0 = left, 1 = right. Y: 0 = bottom, 1 = top.
     ============================================================ */
  const IMMERSIVE_FIELD_CONFIG = Object.freeze({
    glassX: 0.84,
    glassY: 0.48,
    glassRadius: 0.92,
    glassTiltX: 0.055,
    glassTiltY: 0.065,
    refractionStrength: 0.032,
    rimBrightness: 1.0,

    glintBaseAngle: 2.45,
    glintCursorRange: 1.15,
    glintIdleSpeed: 0.12,

    particleCount: 68,
    compactParticleCount: 44,
    particleParallax: 0.065,
    particleSpeed: 0.72,
    particleMinSize: 1.8,
    particleMaxSize: 3.8,

    sphereX: 0.84,
    sphereY: 0.88,
    sphereRadius: 0.20,
    sphereRotationSpeed: 0.18,

    followSpeed: 0.065,
    returnSpeed: 0.04,
    defaultPointerX: 0.50,
    defaultPointerY: 0.50,

    fadeStart: 42,
    fadeEnd: 72,

    compact: {
      glassX: 0.68,
      glassY: 0.50,
      glassRadius: 0.70,
      sphereX: 0.80,
      sphereY: 0.82,
      sphereRadius: 0.19,
      fadeStart: 18,
      fadeEnd: 58,
    },
  });

  const section = document.getElementById('tech');
  const rightPanel = section && section.querySelector('.tech-panel-wrap.right');
  const canvas = document.getElementById('immersive-canvas');
  if (!section || !rightPanel || !canvas || typeof THREE === 'undefined') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compactAtLaunch = window.matchMedia('(max-width: 540px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  camera.position.z = 5;

  const currentPointer = new THREE.Vector2(
    IMMERSIVE_FIELD_CONFIG.defaultPointerX,
    IMMERSIVE_FIELD_CONFIG.defaultPointerY
  );
  const targetPointer = currentPointer.clone();
  let pointerActive = false;
  let canvasAspect = 1;
  let isCompact = compactAtLaunch;
  let isVisible = true;

  /* -------------------- Glass disc -------------------- */
  const glassUniforms = {
    uTime: { value: 0 },
    uPointer: { value: currentPointer },
    uGlintAngle: { value: IMMERSIVE_FIELD_CONFIG.glintBaseAngle },
    uRefraction: { value: IMMERSIVE_FIELD_CONFIG.refractionStrength },
    uRimBrightness: { value: IMMERSIVE_FIELD_CONFIG.rimBrightness },
  };

  const glassMaterial = new THREE.ShaderMaterial({
    uniforms: glassUniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uGlintAngle;
      uniform float uRefraction;
      uniform float uRimBrightness;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        vec2 refractedP = p + (uPointer - 0.5) * uRefraction * (1.0 - min(length(p), 1.0));
        float radius = length(refractedP);
        float body = 1.0 - smoothstep(0.965, 1.0, radius);
        if (body <= 0.0) discard;

        float grain = noise(vUv * 145.0 + vec2(uTime * 0.035, -uTime * 0.025));
        float broadNoise = noise(vUv * 9.0 + uPointer * 1.7);
        float rim = smoothstep(0.76, 0.985, radius) * (1.0 - smoothstep(0.986, 1.0, radius));

        vec2 rimDirection = normalize(refractedP + vec2(0.0001));
        vec2 lightDirection = vec2(cos(uGlintAngle), sin(uGlintAngle));
        float alignment = pow(max(dot(rimDirection, lightDirection), 0.0), 30.0);
        float glint = alignment * smoothstep(0.58, 0.91, radius) *
          (1.0 - smoothstep(0.995, 1.0, radius));

        float diagonalSheen = 1.0 - smoothstep(
          0.015,
          0.19,
          abs(refractedP.y + refractedP.x * 0.52 - (uPointer.x - 0.5) * 0.22)
        );
        diagonalSheen *= body * (0.025 + broadNoise * 0.045);

        vec3 deepGlass = vec3(0.012, 0.055, 0.065);
        vec3 turquoise = vec3(0.04, 0.67, 0.72);
        vec3 reflectedWhite = vec3(0.86, 0.98, 1.0);
        vec3 color = mix(deepGlass, turquoise, rim * 0.62 + broadNoise * 0.05);
        color = mix(color, reflectedWhite, clamp(glint * 1.25 + diagonalSheen, 0.0, 1.0));

        float bodyAlpha = 0.012 + grain * 0.022 + broadNoise * 0.012;
        float alpha = body * bodyAlpha + rim * 0.19 * uRimBrightness + glint * 0.62;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.78));
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });

  const glassGroup = new THREE.Group();
  const glassDisc = new THREE.Mesh(new THREE.CircleGeometry(1, 144), glassMaterial);
  glassDisc.renderOrder = 4;
  glassGroup.add(glassDisc);

  const glassEdge = new THREE.Mesh(
    new THREE.RingGeometry(0.986, 1.003, 144),
    new THREE.MeshBasicMaterial({
      color: 0xb8fbff,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  glassEdge.position.z = 0.015;
  glassEdge.renderOrder = 5;
  glassGroup.add(glassEdge);
  scene.add(glassGroup);

  /* -------------------- Particles behind glass -------------------- */
  const particleCount = compactAtLaunch
    ? IMMERSIVE_FIELD_CONFIG.compactParticleCount
    : IMMERSIVE_FIELD_CONFIG.particleCount;
  const particlePositions = [];
  const particlePhases = [];
  const particleSizes = [];
  const particleSpeeds = [];

  let particleSeed = 9182;
  function seededRandom() {
    particleSeed = (particleSeed * 16807) % 2147483647;
    return (particleSeed - 1) / 2147483646;
  }

  for (let i = 0; i < particleCount; i += 1) {
    const angle = seededRandom() * Math.PI * 2;
    const radius = Math.sqrt(seededRandom()) * IMMERSIVE_FIELD_CONFIG.glassRadius * 0.91;
    particlePositions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, -0.08 - seededRandom() * 0.12);
    particlePhases.push(seededRandom() * Math.PI * 2);
    particleSizes.push(
      THREE.MathUtils.lerp(
        IMMERSIVE_FIELD_CONFIG.particleMinSize,
        IMMERSIVE_FIELD_CONFIG.particleMaxSize,
        seededRandom()
      )
    );
    particleSpeeds.push(0.55 + seededRandom() * 0.8);
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('phase', new THREE.Float32BufferAttribute(particlePhases, 1));
  particleGeometry.setAttribute('particleSize', new THREE.Float32BufferAttribute(particleSizes, 1));
  particleGeometry.setAttribute('particleSpeed', new THREE.Float32BufferAttribute(particleSpeeds, 1));

  const particleUniforms = {
    uTime: { value: 0 },
    uPointer: { value: currentPointer },
    uRadius: { value: IMMERSIVE_FIELD_CONFIG.glassRadius },
    uRefraction: { value: IMMERSIVE_FIELD_CONFIG.refractionStrength },
    uParallax: { value: IMMERSIVE_FIELD_CONFIG.particleParallax },
    uPixelRatio: { value: renderer.getPixelRatio() },
  };

  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: particleUniforms,
    vertexShader: `
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uRadius;
      uniform float uRefraction;
      uniform float uParallax;
      uniform float uPixelRatio;
      attribute float phase;
      attribute float particleSize;
      attribute float particleSpeed;
      varying float vAlpha;
      varying float vColorMix;

      void main() {
        float localTime = uTime * particleSpeed;
        vec2 drift = vec2(
          sin(localTime * 0.43 + phase * 1.7) + cos(localTime * 0.17 + phase * 3.1),
          cos(localTime * 0.37 + phase * 2.3) + sin(localTime * 0.21 + phase * 4.2)
        ) * 0.018;

        vec2 displaced = position.xy + drift;
        float distanceFromCenter = length(displaced);
        float insideGlass = 1.0 - smoothstep(uRadius * 0.78, uRadius * 0.98, distanceFromCenter);
        vec2 radialDirection = normalize(displaced + vec2(0.0001));
        float refractionWave = sin(localTime * 0.7 + phase * 5.0 + distanceFromCenter * 19.0);
        displaced += radialDirection * refractionWave * uRefraction * insideGlass;
        displaced += (uPointer - 0.5) * uParallax * (0.35 + fract(phase) * 0.65);

        float twinkle = 0.64 + sin(localTime * 1.1 + phase * 6.0) * 0.22;
        vAlpha = insideGlass * twinkle;
        vColorMix = fract(phase * 0.618);

        vec4 mvPosition = modelViewMatrix * vec4(displaced, position.z, 1.0);
        gl_PointSize = particleSize * uPixelRatio * (0.82 + twinkle * 0.34);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying float vColorMix;
      void main() {
        float distanceToCenter = length(gl_PointCoord - 0.5) / 0.5;
        float softDot = 1.0 - smoothstep(0.08, 1.0, distanceToCenter);
        float whiteCore = 1.0 - smoothstep(0.02, 0.38, distanceToCenter);
        vec3 turquoise = vec3(0.13, 0.72, 0.76);
        vec3 white = vec3(0.88, 0.98, 1.0);
        vec3 color = mix(turquoise, white, whiteCore * (0.55 + vColorMix * 0.35));
        gl_FragColor = vec4(color, softDot * vAlpha * 0.62);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const particleGroup = new THREE.Group();
  const rearParticles = new THREE.Points(particleGeometry, particleMaterial);
  rearParticles.renderOrder = 2;
  particleGroup.add(rearParticles);
  scene.add(particleGroup);

  /* -------------------- 3D 360-degree symbol -------------------- */
  const sphereRoot = new THREE.Group();
  const sphereInner = new THREE.Group();
  sphereRoot.add(sphereInner);
  scene.add(sphereRoot);

  const sphereOuterMaterial = new THREE.LineBasicMaterial({
    color: 0xc9fbff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const sphereInnerMaterial = new THREE.LineBasicMaterial({
    color: 0x38cbd1,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const sphereDashedMaterial = new THREE.LineDashedMaterial({
    color: 0x8be9ed,
    transparent: true,
    opacity: 0.55,
    dashSize: 0.14,
    gapSize: 0.10,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  function ellipsePoints(radiusX, radiusY, z, start, end, segments) {
    const result = [];
    for (let i = 0; i <= segments; i += 1) {
      const angle = THREE.MathUtils.lerp(start, end, i / segments);
      result.push(new THREE.Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, z));
    }
    return result;
  }

  const outerRing = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(ellipsePoints(1, 1, 0, 0, Math.PI * 2, 128)),
    sphereOuterMaterial
  );
  outerRing.renderOrder = 10;
  sphereRoot.add(outerRing);

  const equator = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(ellipsePoints(0.98, 0.34, 0.025, 0, Math.PI * 2, 112)),
    sphereInnerMaterial
  );
  equator.renderOrder = 11;
  sphereInner.add(equator);

  const meridian = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(ellipsePoints(0.40, 0.98, 0.035, 0, Math.PI * 2, 112)),
    sphereInnerMaterial
  );
  meridian.renderOrder = 11;
  sphereInner.add(meridian);

  const diagonalMeridian = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(ellipsePoints(0.31, 0.98, 0.02, 0, Math.PI * 2, 112)),
    sphereInnerMaterial
  );
  diagonalMeridian.rotation.z = -0.43;
  diagonalMeridian.renderOrder = 11;
  sphereInner.add(diagonalMeridian);

  const dashedBackArc = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      ellipsePoints(1.015, 1.015, 0.045, -0.20 * Math.PI, 0.39 * Math.PI, 64)
    ),
    sphereDashedMaterial
  );
  dashedBackArc.computeLineDistances();
  dashedBackArc.renderOrder = 12;
  sphereRoot.add(dashedBackArc);

  function createRoundedBackplateTexture() {
    const backplateCanvas = document.createElement('canvas');
    backplateCanvas.width = 512;
    backplateCanvas.height = 180;
    const context = backplateCanvas.getContext('2d');
    const x = 8;
    const y = 8;
    const width = backplateCanvas.width - 16;
    const height = backplateCanvas.height - 16;
    const radius = 58;

    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    context.fillStyle = 'rgba(8, 10, 11, 0.96)';
    context.fill();

    const texture = new THREE.CanvasTexture(backplateCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  const labelBackplate = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRoundedBackplateTexture(),
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
  );
  labelBackplate.scale.set(1.62, 0.58, 1);
  labelBackplate.position.z = 0.12;
  labelBackplate.renderOrder = 19;
  sphereRoot.add(labelBackplate);

  function create360LabelTexture() {
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 224;
    const context = labelCanvas.getContext('2d');
    context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '700 128px Manrope, Arial, sans-serif';
    context.shadowColor = 'rgba(0, 211, 218, 0.52)';
    context.shadowBlur = 20;
    context.fillStyle = '#f2feff';
    context.fillText('360°', labelCanvas.width / 2, labelCanvas.height / 2 + 4);
    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  const labelSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: create360LabelTexture(),
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
  );
  labelSprite.scale.set(1.48, 0.64, 1);
  labelSprite.position.z = 0.14;
  labelSprite.renderOrder = 20;
  sphereRoot.add(labelSprite);

  const baseGlassPosition = new THREE.Vector3();
  const baseParticlePosition = new THREE.Vector3();
  const baseSpherePosition = new THREE.Vector3();

  function normalizedX(value) {
    return THREE.MathUtils.lerp(-canvasAspect, canvasAspect, value);
  }

  function normalizedY(value) {
    return THREE.MathUtils.lerp(-1, 1, value);
  }

  function applyLayout() {
    const layout = isCompact ? IMMERSIVE_FIELD_CONFIG.compact : IMMERSIVE_FIELD_CONFIG;
    const glassRadius = layout.glassRadius;
    baseGlassPosition.set(normalizedX(layout.glassX), normalizedY(layout.glassY), 0);
    baseParticlePosition.copy(baseGlassPosition).setZ(-0.08);
    baseSpherePosition.set(normalizedX(layout.sphereX), normalizedY(layout.sphereY), 0.12);

    glassGroup.position.copy(baseGlassPosition);
    glassGroup.scale.setScalar(glassRadius);
    particleGroup.position.copy(baseParticlePosition);
    sphereRoot.position.copy(baseSpherePosition);
    sphereRoot.scale.setScalar(layout.sphereRadius);
    particleUniforms.uRadius.value = glassRadius;

    canvas.style.setProperty('--immersive-fade-start', `${layout.fadeStart}%`);
    canvas.style.setProperty('--immersive-fade-end', `${layout.fadeEnd}%`);
  }

  function resize() {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    const pixelRatio = renderer.getPixelRatio();
    const nextCompact = width < 520 || window.innerWidth <= 540;
    const dimensionsChanged =
      canvas.width !== Math.floor(width * pixelRatio) ||
      canvas.height !== Math.floor(height * pixelRatio);

    if (dimensionsChanged) renderer.setSize(width, height, false);
    if (dimensionsChanged || nextCompact !== isCompact) {
      isCompact = nextCompact;
      canvasAspect = width / height;
      camera.left = -canvasAspect;
      camera.right = canvasAspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
      particleUniforms.uPixelRatio.value = pixelRatio;
      applyLayout();
    }
  }

  function returnToNeutral() {
    pointerActive = false;
    targetPointer.set(
      IMMERSIVE_FIELD_CONFIG.defaultPointerX,
      IMMERSIVE_FIELD_CONFIG.defaultPointerY
    );
  }

  function updatePointer(event) {
    const sectionRect = section.getBoundingClientRect();
    const rightRect = rightPanel.getBoundingClientRect();
    const sectionMiddle = sectionRect.left + sectionRect.width * 0.5;
    if (event.clientX <= sectionMiddle) {
      returnToNeutral();
      return;
    }

    pointerActive = true;
    targetPointer.x = THREE.MathUtils.clamp(
      (event.clientX - sectionMiddle) / Math.max(sectionRect.width * 0.5, 1),
      0,
      1
    );
    targetPointer.y = THREE.MathUtils.clamp(
      1 - (event.clientY - rightRect.top) / Math.max(rightRect.height, 1),
      0,
      1
    );
  }

  section.addEventListener('pointermove', updatePointer, { passive: true });
  section.addEventListener('pointerleave', returnToNeutral);
  window.addEventListener('blur', returnToNeutral);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        isVisible = entries[0] ? entries[0].isIntersecting : true;
      },
      { rootMargin: '180px 0px' }
    ).observe(section);
  }

  const clock = new THREE.Clock();
  function render() {
    requestAnimationFrame(render);
    resize();
    if (!isVisible) return;

    const elapsed = clock.getElapsedTime();
    const motionTime = reducedMotion ? 0 : elapsed * IMMERSIVE_FIELD_CONFIG.particleSpeed;
    const smoothing = reducedMotion
      ? 0.18
      : pointerActive
        ? IMMERSIVE_FIELD_CONFIG.followSpeed
        : IMMERSIVE_FIELD_CONFIG.returnSpeed;

    currentPointer.lerp(targetPointer, smoothing);
    glassUniforms.uTime.value = motionTime;
    particleUniforms.uTime.value = motionTime;
    glassUniforms.uGlintAngle.value =
      IMMERSIVE_FIELD_CONFIG.glintBaseAngle +
      (currentPointer.x - 0.5) * IMMERSIVE_FIELD_CONFIG.glintCursorRange +
      (currentPointer.y - 0.5) * 0.55 +
      (reducedMotion ? 0 : elapsed * IMMERSIVE_FIELD_CONFIG.glintIdleSpeed);

    glassGroup.rotation.x =
      (currentPointer.y - 0.5) * IMMERSIVE_FIELD_CONFIG.glassTiltX;
    glassGroup.rotation.y =
      (currentPointer.x - 0.5) * IMMERSIVE_FIELD_CONFIG.glassTiltY;

    particleGroup.position.x =
      baseParticlePosition.x +
      (currentPointer.x - 0.5) * IMMERSIVE_FIELD_CONFIG.particleParallax;
    particleGroup.position.y =
      baseParticlePosition.y +
      (currentPointer.y - 0.5) * IMMERSIVE_FIELD_CONFIG.particleParallax * 0.72;

    sphereRoot.position.x = baseSpherePosition.x + (currentPointer.x - 0.5) * 0.035;
    sphereRoot.position.y = baseSpherePosition.y + (currentPointer.y - 0.5) * 0.025;
    sphereInner.rotation.y = reducedMotion
      ? 0.12
      : elapsed * IMMERSIVE_FIELD_CONFIG.sphereRotationSpeed +
        (currentPointer.x - 0.5) * 0.28;
    sphereInner.rotation.x = (currentPointer.y - 0.5) * 0.10;

    renderer.render(scene, camera);
  }

  resize();
  render();
})();
