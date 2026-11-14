# Recuperación de Interiors3D — 10 noviembre 2026

Repositorio original clonado, sin publicaciones: https://github.com/EduardoAllen02/interiors3d-preview
Commit recuperado: 97e0684144271a76abbbc09e63d829f4257c5737.

## Vistas locales

- Demo técnica original, iglesia: http://127.0.0.1:8765/
- Visor cliente, panorámicas auténticas recuperadas: http://127.0.0.1:8766/
- Sitio publicado recuperado, antes de nueva sección: http://127.0.0.1:8767/production-snapshot/
- Propuesta local con sección ANTES de STORIE DI SUCCESSO: http://127.0.0.1:8767/integration-local/#high-definition
- Home original del repositorio: http://127.0.0.1:8767/home/

## Qué se recuperó realmente

`home/` y `tecnologie/` son los archivos del repositorio Git original. No se modificaron.
`production-snapshot/original.html` conserva los bytes HTTP de la home publicada de WordPress; `original-home.css` conserva el CSS publicado. Se descargaron otros 100 recursos públicos, sin errores. Sus URL, tamaños y SHA-256 están en `production-snapshot/recovery-manifest.json`.
`production-snapshot/index.html` sólo remapea URL de esos recursos a sus copias locales. Los enlaces, scripts y servicios externos restantes siguen necesitando Internet.
Esto es una copia navegable del frontend publicado. NO es una recuperación de los PHP del tema, base de datos, credenciales o panel de WordPress.
El CSS del repositorio no coincide exactamente con el publicado; por eso la propuesta usa el snapshot de producción.

El código previo `megapano-cliente/test/build_integration.py` confirma una integración anterior como página separada, con cabecera/pie copiados e iframe del visor. Sus archivos de salida y snapshots no existían en este equipo. Se recuperó la estrategia de iframe y el visor existente, sin sustituir la home por una recreación.

## Panorámicas auténticas

Fuente pública existente: https://eduardointeriors.s3.eu-west-1.amazonaws.com/lupa/
Se descargaron `panos.json`, index/app originales publicados y los 1362 archivos de imagen/tiles de EUR (27962 px originales) y VAL (16000 px originales).
Los originales publicados index/app/manifest se conservan en `megapano-cliente/recovered-public-source/`.
El visor cliente local esperaba un manifiesto con `page` y `panos`: se añadió ese contenedor en `megapano-cliente/panos.json`; los niveles y dimensiones provienen del manifiesto publicado.
La hoja de fuentes del bucket devolvió 403. Se recuperaron las declaraciones Raleway del propio HTML WordPress publicado y Manrope de su URL Google Fonts. No se inventaron fuentes ni panorámicas.

## Comparación

La demo técnica de iglesia sirve para depurar: controles de aumento/tamaño, encendido, zoom, navegación y métricas. Su HTML y JS locales estaban desincronizados y JS fallaba al buscar chk-lens inexistente. Se conectaron los controles ya existentes en HTML y se guardó `megapano-lupa/app.before-recovery.js`.
El visor cliente es mejor base para integración: panorámicas reales, menú entre dos imágenes, lupa que adapta su tamaño a pantalla y limita su aumento al detalle nativo. La propuesta conserva este visor en un iframe del mismo origen.

## Diseño y fidelidad

Se añadió solamente `#high-definition` antes de `#stories`, CSS con selectores acotados y una inicialización de la lupa/pantalla completa. La página restante del snapshot se verificó idéntica al revertir esas inserciones. La imagen del boceto es referencia de composición y texto; la panorámica mostrada es el showroom real recuperado, no la imagen ilustrativa del boceto.
Color turquesa computado de producción: #00adb4. Cuerpo: Manrope. Títulos: Raleway.

## Comprobaciones

`qa/results.json`: escritorio 1440px, móvil 390px, sin desbordamiento horizontal; dos panorámicas listas; cambio EUR→VAL correcto; aumento desktop 4x; 0 errores HTTP de página/visor, 0 excepciones JS.
`qa/touch-results.json`: lupa visible al tocar, giro con gesto continuo confirmado, diámetro móvil 120px.
Capturas: `qa/section-desktop.png`, `qa/section-mobile-top.png`, `qa/section-mobile-detail.png`, `qa/section-mobile-touch.png`.
Pruebas móviles por emulación Chrome. Pendiente validación física iPhone/Android y publicación, que no se realizó.

Para reiniciar:
python -m http.server 8765 --bind 127.0.0.1 (en megapano-lupa)
python -m http.server 8766 --bind 127.0.0.1 (en megapano-cliente)
python -m http.server 8767 --bind 127.0.0.1 (en esta carpeta)

## Ajuste de continuidad — 12 noviembre 2026

La preview `integration-local/` agrupa tecnologías y panorámicas en `.tech-panorama`, con el mismo fondo #080a0b. El canvas existente de escaneo se prolonga y desvanece sobre la esquina superior izquierda del encabezado de la lupa; una iluminación turquesa suave desde la derecha une ambas partes. El hueco de 192 px se redujo a 64 px en el ancho de escritorio revisado (1234 px útiles), y a 40 px en móvil de 390 px. Se quitó la línea de instrucciones bajo la panorámica.

La tablet y el escáner no se habían eliminado: sus rutas seguían apuntando al dominio público desde la copia local. En esta preview, `data-asset-base` y `I3D_HOME_ASSET_URL` usan los recursos recuperados del mismo origen. Los dos modelos vuelven a verse; en móvil se conserva el canvas viajero del escáner por encima del fondo compartido.

`build_section.py` conserva el contenedor y las rutas locales al regenerar y usa `integration-local/high-definition.css` como fuente de estilos. Para la futura integración en WordPress se debe conservar el prefijo de assets del tema publicado, en vez del prefijo `/production-snapshot/` usado exclusivamente por esta preview.

Verificado en Chrome CDP: escritorio y emulación móvil de 390×844, sin desbordamiento horizontal ni errores de carga o excepciones JS; modelos GLB con HTTP 200 y visor/lupa operativos. No se publicó en WordPress.

## Preview en GitHub Pages — 12 noviembre 2026

Repositorio: https://github.com/EduardoAllen02/interiors3d-preview
Preview: https://eduardoallen02.github.io/interiors3d-preview/
Sección directa: https://eduardoallen02.github.io/interiors3d-preview/integration-local/#high-definition

La raíz abre la integración; la home anterior sigue disponible en `home/`. Las rutas a `production-snapshot/` son relativas para funcionar tanto en local como bajo el prefijo del proyecto en GitHub Pages. Los recursos recuperados y los tiles se sirven desde el mismo repositorio. `.nojekyll` conserva la estructura de archivos estáticos.

La luz de fondo se extendió hacia abajo y hacia el centro, detrás de los canvases y del contenido. Esta publicación es una preview independiente de WordPress.

## Correcciones de la revisión del cliente — 13 noviembre 2026

La panorámica inicial de la sección es Val Cimoliana (`viewer/index.html?pano=val`); el selector sigue permitiendo abrir el showroom EUR. En móvil, la sección tiene su propio fondo oscuro opaco con la luz lateral, para mantener el contraste del texto sin depender del fondo del contenedor entre las capas sticky. La URL del CSS lleva versión `20261113` para renovar la copia en caché.

En escritorio con altura desde 600 px, el encabezado y el texto inferior conservan su espacio y el visor ocupa el alto disponible debajo de la navegación fija. La sección completa se comprobó a 1024×768, 1280×720, 1366×768, 1440×900 y 1920×1080. La emulación móvil de 360×800, 390×844 y 412×780 confirmó el fondo oscuro, texto claro, montañas iniciales y ausencia de desbordamiento horizontal. Pendiente la comprobación en el teléfono físico del cliente.

La altura del visor también se adapta al espacio disponible en teléfonos en vertical. En 360×800 pasa de 390 a unos 245 px; el texto inferior deja espacio para el botón flotante de accesibilidad. En teléfonos de menor altura se compactan los márgenes y la tipografía. Se revisaron 320×568, 360×640, 375×667, 375×812, 360×800, 390×844, 393×852, 412×915 y 430×932, sin desbordamiento horizontal. La lupa táctil queda acotada verticalmente dentro del visor reducido. CSS y módulo del visor usan versión `20261113-3`.
