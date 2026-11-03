// Verificación del build (dist/): falla si algo está roto. Uso: npm run check
// - Enlaces internos, anclas y recursos (href, src, srcset) que no existen en dist/
// - Enlaces vacíos o «#» sin destino; enlaces externos con target=_blank sin rel=noopener
// - WhatsApp: número correcto, mensaje presente y codificado; mensajes contextuales esperados
// - Imágenes sin alt, sin width/height, o srcset que declara un ancho distinto al real
// - Un solo <h1> por página; datos estructurados válidos (JSON)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIST = 'dist';
const NUMERO = '573137289350';
const errores = [];
const err = (archivo, msg) => errores.push(`${archivo}: ${msg}`);

const paginas = [];
(function recorrer(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) recorrer(p);
    else if (f.endsWith('.html')) paginas.push(p);
  }
})(DIST);

const existe = (url) => {
  const limpio = decodeURIComponent(url.split('#')[0].split('?')[0]);
  if (!limpio) return true;
  const p = path.join(DIST, limpio);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return true;
  return fs.existsSync(path.join(p, 'index.html'));
};

const anchosReales = new Map();
async function anchoReal(url) {
  if (!anchosReales.has(url)) anchosReales.set(url, (await sharp(path.join(DIST, url)).metadata()).width);
  return anchosReales.get(url);
}

const mensajes = [];
for (const archivo of paginas) {
  const html = fs.readFileSync(archivo, 'utf8');
  const rel = path.relative(DIST, archivo);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  if ((html.match(/<h1[\s>]/g) || []).length !== 1) err(rel, 'debe tener exactamente un <h1>');

  for (const [etiqueta, href] of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"[^>]*>/g)) {
    if (!href || href === '#') err(rel, `enlace sin destino: "${href}"`);
    else if (href === `https://wa.me/c/${NUMERO}`) {
      // Catálogo oficial de WhatsApp Business: no lleva mensaje.
    } else if (href.startsWith('https://wa.me/')) {
      const u = new URL(href.replace(/&amp;/g, '&'));
      if (u.pathname !== `/${NUMERO}`) err(rel, `WhatsApp con otro número: ${u.pathname}`);
      const texto = u.searchParams.get('text');
      if (!texto) err(rel, 'WhatsApp sin mensaje');
      else mensajes.push(texto);
      if (/[ ¿?¡áéíóúñ]/i.test(href.split('?text=')[1] ?? '')) err(rel, `mensaje de WhatsApp sin codificar: ${href.slice(0, 80)}`);
    } else if (href.startsWith('/')) {
      if (!existe(href)) err(rel, `enlace interno roto: ${href}`);
    } else if (href.startsWith('#')) {
      if (!ids.has(href.slice(1))) err(rel, `ancla inexistente: ${href}`);
    }
    if (/target="_blank"/.test(etiqueta) && !/rel="[^"]*noopener/.test(etiqueta)) err(rel, `target=_blank sin rel=noopener: ${href.slice(0, 60)}`);
  }

  for (const [, src] of html.matchAll(/\s(?:src|href)="(\/[^"]+\.(?:webp|avif|png|jpg|svg|woff2|webmanifest|ico))"/g)) {
    if (!existe(src)) err(rel, `recurso inexistente: ${src}`);
  }
  for (const [, set] of html.matchAll(/\s(?:srcset|imagesrcset)="([^"]+)"/g)) {
    for (const parte of set.split(',')) {
      const [url, w] = parte.trim().split(/\s+/);
      if (!existe(url)) {
        err(rel, `srcset con archivo inexistente: ${url}`);
        continue;
      }
      const real = await anchoReal(url);
      if (w && Number(w.replace('w', '')) !== real) err(rel, `srcset miente: ${url} dice ${w}, mide ${real}`);
    }
  }
  for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt(="|[\s>])/.test(img)) err(rel, `imagen sin alt: ${img.slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(img) || !/\sheight="\d+"/.test(img)) err(rel, `imagen sin width/height: ${img.slice(0, 80)}`);
  }
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try {
      JSON.parse(json);
    } catch {
      err(rel, 'JSON-LD inválido');
    }
  }
}

// Mensajes contextuales del brief: general, suspensión, frenos y motor.
// Mensajes del brief: detal y por mayor.
const ESPERADOS = [
  'Hola, estoy interesado en conocer sus productos de JB Merch. ¿Me pueden brindar información?',
  'Hola, estoy interesado en comprar productos de JB Merch al por mayor. ¿Me pueden compartir información sobre precios y condiciones?',
];
for (const e of ESPERADOS) if (!mensajes.some((m) => m === e)) err('index.html', `falta el mensaje de WhatsApp: «${e}»`);

// Catálogo: un «Pedir» por producto con su nombre; la ficha (JSON) apunta a fotos que existen.
const catalogo = JSON.parse(fs.readFileSync('src/data/catalogo.json', 'utf8'));
const index = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
for (const p of catalogo) {
  if (!mensajes.some((m) => m.includes(`\n${p.nombre}\n`) || m.endsWith(`\n${p.nombre}`) || m.includes(`\n${p.nombre}\nRef.`))) err('index.html', `sin «Pedir» por WhatsApp: ${p.nombre}`);
}
const datos = JSON.parse(index.match(/<script type="application\/json" id="datos-catalogo">(.*?)<\/script>/s)?.[1] ?? '[]');
if (datos.length !== catalogo.length) err('index.html', `la ficha tiene ${datos.length} productos y el catálogo ${catalogo.length}`);
// Ficha: [id, bg, ancho, alto, [[ancho, hash avif, hash webp], …]] → las rutas que arma app.ts.
for (const p of datos) {
  for (const [id, , , , v] of p.f) {
    for (const [w, ha, hw] of v) {
      for (const url of [`/img/p/${id}-${w}.${ha}.avif`, `/img/p/${id}-${w}.${hw}.webp`]) {
        if (!existe(url)) err('index.html', `ficha ${p.id}: foto inexistente ${url}`);
        else if ((await anchoReal(url)) !== w) err('index.html', `ficha ${p.id}: ${url} no mide ${w}`);
      }
    }
  }
}
// Nada en un <script> embebido puede cerrar la etiqueta.
for (const [, cuerpo] of index.matchAll(/<script type="application\/(?:ld\+)?json"[^>]*>(.*?)<\/script>/gs)) {
  if (cuerpo.includes('<')) err('index.html', 'JSON embebido con «<» sin escapar');
}

// Redes del brief, tal cual.
const REDES = [
  'https://www.instagram.com/jb.merch',
  'https://www.facebook.com/profile.php?id=61563883636869&amp;mibextid=LQQJ4d',
  'https://www.tiktok.com/@jbmerch',
];
for (const r of REDES) if (!index.includes(`href="${r}"`)) err('index.html', `falta el enlace a ${r}`);

console.log(`${paginas.length} páginas · ${mensajes.length} enlaces de WhatsApp · ${anchosReales.size} imágenes medidas`);
if (errores.length) {
  console.error(errores.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('✓ Sin errores');
