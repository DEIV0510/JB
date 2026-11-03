# Seguridad y disponibilidad

## Por qué es difícil tumbarla
- **Sitio 100 % estático.** No hay servidor, base de datos, formularios, inicio de sesión ni panel: no hay nada que hackear del lado del servidor ni que se sature con tráfico. El hosting entrega archivos desde su CDN.
- **Cero dependencias externas en tiempo real.** Fuentes, fotos y JS se sirven desde el mismo dominio: si cae un servicio de terceros, la página sigue igual. WhatsApp e Instagram solo son enlaces.
- **Funciona sin JavaScript.** Si el JS falla, el catálogo completo y todos los «Pedir» siguen visibles y funcionando.
- **Caché.** Fotos, fuentes y JS llevan hash en el nombre y caché de un año: los visitantes que vuelven casi no gastan ancho de banda.

## Protecciones activas
| Protección | Dónde |
|---|---|
| CSP con hashes: solo corre el JS propio (ni scripts inyectados, ni de otros dominios, ni `eval`) | `<meta>` que escribe `scripts/csp.mjs` al compilar |
| Trusted Types: bloquea `innerHTML`/`document.write` con texto (XSS) | misma CSP |
| No se puede meter en un iframe ajeno (clickjacking) | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| HTTPS obligatorio (HSTS), `nosniff`, `Referrer-Policy`, `Permissions-Policy` (sin cámara, micrófono, ubicación, pagos) | encabezados |
| JSON embebido escapado: un nombre de producto no puede inyectar código | `src/lib/json.ts` |
| Enlaces externos con `rel="noopener"` | todo el sitio |
| `npm audit`: 0 vulnerabilidades (2026-11-03) | — |

Los encabezados salen de **`scripts/encabezados.mjs`** (`npm run headers`), que escribe `vercel.json` (Vercel) y `public/_headers` (Cloudflare Pages / Netlify). `npm run preview` los aplica igual en local.

**Regla para quien edite el JS:** nada de `innerHTML`, `insertAdjacentHTML`, `eval` ni `setTimeout('texto')` — Trusted Types los bloquea. Usar `textContent` y `createElement`. Un script en línea nuevo no necesita nada: `npm run build` recalcula los hashes.

## Hosting recomendado
- **Cloudflare Pages (gratis):** permite uso comercial, ancho de banda ilimitado y protección DDoS de Cloudflare. Build: `npm run build`, salida: `dist`, variable `NODE_VERSION=22` (o el archivo `.node-version`). Lee `dist/_headers`.
- **Vercel:** el plan Hobby es solo para uso personal no comercial; una tienda debe ir en **Pro**. `vercel.json` ya trae build, encabezados y caché.

## Si hay un ataque o un pico de tráfico
- Cloudflare: activar **Under Attack Mode** y **Bot Fight Mode** en el panel del dominio.
- Vercel: **Firewall → Attack Challenge Mode**.
Como todo es estático y cacheado, un pico normal de visitas (una campaña, un video viral) no la tumba.
