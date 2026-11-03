# JB Merch — decisiones de diseño

## Identidad
- **Solo blanco y negro.** Negro `#0a0a0a`, blanco hueso `#f3f3f0`; grises solo para texto secundario (contraste ≥ 6:1).
- **Logos sin tocar.** El monograma sale de `LOGO.jpeg` (blanco sobre negro → blanco con transparencia, mismo trazo); el lobo es `jb_merch_lobo_sin_fondo.png`. Ver `scripts/marca.mjs`.
- **Detalle propio: la línea doble.** El monograma es un trazo blanco con filete negro por dentro. Se repite como:
  - titulares en **contorno** (`.contorno`, `-webkit-text-stroke`) alternados con titulares llenos: «TU ESTILO. / TUS REGLAS.», «LA / COLECCIÓN», etc.;
  - **filete doble** (`border: 4px double`, `.filete`) en marcos de fotos, la tarjeta «Todo el catálogo», el bloque «por mayor» y el pie.
- **Esquinas rectas** en todo.

## Tipografía
- Titulares: **Archivo** en una sola instancia estática (peso 800, ancho 116 %), autoalojada y recortada (11,6 KB).
- Texto e interfaz: **Inter** 400–600 (26 KB).
- Respaldos con métricas ajustadas para que nada salte al cargar la fuente (`scripts/fuentes.mjs`).

## Estructura (una página)
1. Pantalla de carga (solo 1.ª visita de la sesión, ≤ 1,6 s, nunca con movimiento reducido ni red lenta).
2. Hero editorial: titular cruzado sobre tres fotos reales del catálogo (en escritorio se invierte sobre ellas).
3. La colección: 7 líneas con más de 3 productos + «Todo el catálogo».
4. Catálogo: filtros por categoría, 12 por tanda, ficha con fotos y WhatsApp.
5. Detal y por mayor: dos bloques con mensajes distintos.
6. Manifiesto con el lobo.
7. Contacto y redes. Pie.

## Datos
- Todo producto, precio, referencia y foto sale del **catálogo de WhatsApp Business** (+57 313 728 9350). Nada inventado.
- Las notas de disponibilidad que la tienda escribió en el nombre («El rojo no está disponible», «Disponible en blanco») se muestran como nota.
- Categorías deducidas del tipo de prenda del nombre (`scripts/catalogo.mjs`).
