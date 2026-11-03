# JB Merch — sitio web

Sitio de una página (Astro 7, estático) con el catálogo completo de JB Merch y pedidos por WhatsApp (+57 313 728 9350).

## Uso
```bash
npm install
npm run dev        # http://localhost:5590
npm run build      # astro build + CSP con hashes (scripts/csp.mjs)
npm run check      # tipos + build + verificación de enlaces, WhatsApp, redes e imágenes
npm run preview    # sirve dist/ en http://localhost:5591
```

## Actualizar el catálogo
1. Descargar de nuevo el catálogo de WhatsApp Business a `_material-cliente/catalogo-whatsapp/catalogo-whatsapp.json` (mismo formato).
2. `npm run catalogo` → fotos originales en `_material-cliente/catalogo-whatsapp/fotos/` y `src/data/catalogo.json`.
3. `npm run images` → AVIF/WebP en `public/img/p/` y `src/data/media.json`.
4. Revisar `src/lib/seleccion.ts` (fotos del hero y portadas) y `npm run check`.

## Carpetas
- `_material-cliente/logos/` — logos originales del cliente.
- `_material-cliente/catalogo-whatsapp/fotos/` — fotos del catálogo en su resolución original.
- `scripts/` — fuentes, marca, catálogo, imágenes, OG y verificación.
- `docs/DISENO.md` — decisiones de diseño. `docs/SEGURIDAD.md` — protecciones, encabezados y hosting. `docs/PENDIENTES.md` — lo que falta confirmar.
