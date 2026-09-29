/* ════════════════════════════════════════════════════
   HERO — video de fondo (solo desktop)
   ════════════════════════════════════════════════════
   Sustituye a .hero-bg-img por un video en loop, autoplay y sin sonido,
   pedido para dar vida al hero. Vive en .hero-bg, por detrás de
   .hero-overlay (la máscara negra->transparente) y de .hero-content —
   ver style.css, no hace falta tocar z-index aquí.

   Por qué no es sólo CSS: por debajo de 769px la foto de fondo ya
   desaparece a favor de un gradiente sólido (deja ver el escáner viajero
   de hero-scanner.js), y ahí tampoco debe cargarse el video — ni el
   archivo (3.6MB) ni el decodificador. La condición se evalúa una sola
   vez al cargar: si la ventana cruza el punto de corte después (rotar el
   dispositivo, redimensionar), se queda como estaba, igual que el resto
   de efectos de este hero.

   Respeta prefers-reduced-motion: quien pidió menos movimiento al
   sistema se queda con la foto fija, igual que ya hacen los demás
   efectos del hero (hero-water.js, hero-ambient.js). */

(function () {
  'use strict';

  if (!window.matchMedia('(min-width: 769px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var video = document.querySelector('.hero-bg-video');
  if (!video) return;

  var ASSET_BASE = (document.body && document.body.dataset.assetBase) || '';
  var source = document.createElement('source');
  source.src = ASSET_BASE + 'assets/video/hero-loop.mp4';
  source.type = 'video/mp4';
  video.appendChild(source);

  video.addEventListener('loadeddata', function () {
    video.classList.add('is-active');
    /* La foto de abajo (.hero-bg-img) se apaga sólo hasta este momento —
       si se ocultara de entrada habría un hueco negro mientras el video
       carga. Los dos compartían opacity: 0.78 cada uno, y superpuestos se
       veían como una doble exposición (la foto vieja fantasma detrás del
       video). Uno de los dos tiene que ceder el paso del todo. */
    var bg = video.closest('.hero-bg');
    if (bg) bg.classList.add('hero-bg--video-active');
  }, { once: true });

  var playAttempt = video.play();
  if (playAttempt && typeof playAttempt.catch === 'function') {
    playAttempt.catch(function () {
      /* Autoplay bloqueado (poco probable, está muted) — se queda la
         foto y el video simplemente no se activa. */
    });
  }
})();
