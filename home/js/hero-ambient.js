/* Luz volumétrica y partículas del hero móvil.
   Comparte la dirección, paleta y profundidad de la tabla comparativa. */
(function () {
  'use strict';

  if (!window.matchMedia('(max-width: 768px)').matches) return;
  if (typeof THREE === 'undefined') return;

  var hero = document.getElementById('hero');
  var canvas = document.getElementById('hero-ambient-canvas');
  if (!hero || !canvas) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isVisible = true;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.25), 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 1.2, 7.4);
  camera.lookAt(0, -0.45, 0);

  var COUNT = 180;
  var positions = [];
  var phases = [];
  var speeds = [];
  var sizes = [];
  var seed = 20260722;

  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (var i = 0; i < COUNT; i += 1) {
    var edgeBias = rand();
    var x;
    var y;
    if (edgeBias < 0.42) {
      x = 1.0 + rand() * 7.4;
      y = -2.9 + rand() * 5.8;
    } else if (edgeBias < 0.76) {
      /* Nube específica para prolongar el ambiente hasta la esquina
         inferior izquierda, sin concentrarla en una línea o cuadrante. */
      x = -6.2 + rand() * 6.4;
      y = -3.8 + rand() * 4.3;
    } else {
      x = (rand() - 0.5) * 11.8;
      y = -3.4 + rand() * 6.4;
    }
    var z = -4.5 + rand() * 7.5;
    positions.push(x, y, z);
    phases.push(rand() * Math.PI * 2);
    speeds.push(0.28 + rand() * 0.62);
    sizes.push(4.5 + rand() * 7.5);
  }

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('basePos', new THREE.Float32BufferAttribute(positions.slice(), 3));
  geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
  geometry.setAttribute('speed', new THREE.Float32BufferAttribute(speeds, 1));
  geometry.setAttribute('particleSize', new THREE.Float32BufferAttribute(sizes, 1));

  var material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: [
      'uniform float uTime;',
      'attribute vec3 basePos;',
      'attribute float phase;',
      'attribute float speed;',
      'attribute float particleSize;',
      'varying float vGlow;',
      'float rnd(float v){ return fract(sin(v * 91.3458) * 47453.5453); }',
      'float noise1(float v){ float i=floor(v); float f=fract(v); float e=f*f*(3.0-2.0*f); return mix(rnd(i),rnd(i+1.0),e); }',
      'void main(){',
      '  float t=uTime*0.18*speed;',
      '  vec3 pos=basePos;',
      '  pos.x += (noise1(t + phase*2.7)-0.5)*0.95;',
      '  pos.y += (noise1(t*0.72 + phase*4.1)-0.5)*0.62;',
      '  pos.z += (noise1(t*0.55 + phase*6.3)-0.5)*0.55;',
      '  vGlow = 0.52 + 0.48 * clamp((pos.x + 5.0) / 11.0, 0.0, 1.0);',
      '  vec4 mv=modelViewMatrix*vec4(pos,1.0);',
      '  gl_PointSize=particleSize*(7.0/-mv.z);',
      '  gl_Position=projectionMatrix*mv;',
      '}',
    ].join('\n'),
    fragmentShader: [
      'varying float vGlow;',
      'void main(){',
      '  vec2 p=gl_PointCoord-0.5;',
      '  float d=length(p)/0.5;',
      '  float core=1.0-smoothstep(0.04,0.34,d);',
      '  float halo=1.0-smoothstep(0.20,1.0,d);',
      '  vec3 color=mix(vec3(0.02,0.25,0.29),vec3(0.78,1.0,0.98),vGlow);',
      '  gl_FragColor=vec4(color,(halo*0.28+core*0.72)*(0.35+vGlow*0.65));',
      '}',
    ].join('\n'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  scene.add(new THREE.Points(geometry, material));

  function resize() {
    var w = Math.max(hero.clientWidth, 1);
    var h = Math.max(hero.clientHeight, 1);
    var ratio = renderer.getPixelRatio();
    if (canvas.width !== Math.floor(w * ratio) || canvas.height !== Math.floor(h * ratio)) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  var clock = new THREE.Clock();
  if (typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver(function (entries) {
      isVisible = entries[0] ? entries[0].isIntersecting : true;
    }, { rootMargin: '160px 0px' }).observe(hero);
  }
  function render() {
    requestAnimationFrame(render);
    if (!isVisible || document.hidden) return;
    resize();
    material.uniforms.uTime.value = reducedMotion ? 0 : clock.getElapsedTime();
    renderer.render(scene, camera);
  }
  render();
}());
