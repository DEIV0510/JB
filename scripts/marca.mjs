// Logos de JB Merch para la web, sin redibujarlos: se exportan los archivos del cliente.
// - Monograma «JB Merch»: sale de LOGO.jpeg (blanco sobre negro). Alfa = max(r, g, b) y el
//   color se lleva a blanco puro: queda el mismo trazo, limpio, sobre fondo transparente (el
//   PNG «en blanco» que vino trae un halo gris en los bordes).
// - Lobo: jb_merch_lobo_sin_fondo.png (blanco sobre transparente) tal cual, recortado al borde.
// - Íconos (favicon, apple-touch, manifest): monograma blanco sobre negro.
// Salida: public/marca/*.{webp,png} con hash y src/data/marca.json (rutas y medidas reales).
// Uso: npm run brand
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const SRC = '_material-cliente/logos';
const OUT = 'public/marca';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const hash = (buf) => crypto.createHash('md5').update(buf).digest('hex').slice(0, 8);

function guardar(buf, nombre, ext) {
  const file = `${nombre}.${hash(buf)}.${ext}`;
  fs.writeFileSync(path.join(OUT, file), buf);
  return `/marca/${file}`;
}

// Blanco sobre negro → blanco con alfa.
async function aAlfa(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const a = Math.max(data[i], data[i + 1], data[i + 2]);
    out[j] = out[j + 1] = out[j + 2] = 255;
    // Corta el ruido de compresión JPEG del fondo negro.
    out[j + 3] = a < 14 ? 0 : a;
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

// Recorta al contenido con un margen proporcional.
async function recortar(buf, margen = 0.02) {
  const t = await sharp(buf).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const m = Math.round(Math.max(t.info.width, t.info.height) * margen);
  return sharp(t.data).extend({ top: m, bottom: m, left: m, right: m, background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer();
}

async function variantes(buf, nombre, anchos) {
  const meta = await sharp(buf).metadata();
  const set = { w: meta.width, h: meta.height, webp: [], png: null };
  for (const w of anchos.filter((x) => x <= meta.width)) {
    const r = sharp(buf).resize({ width: w });
    const webp = await r.clone().webp({ quality: 90, alphaQuality: 80, effort: 6 }).toBuffer();
    set.webp.push([guardar(webp, `${nombre}-${w}`, 'webp'), w]);
  }
  const ultimo = anchos.filter((x) => x <= meta.width).at(-1);
  const png = await sharp(buf).resize({ width: Math.min(ultimo, 640) }).png({ compressionLevel: 9, palette: true }).toBuffer();
  set.png = guardar(png, `${nombre}`, 'png');
  return set;
}

const monogramaBuf = await recortar(await aAlfa(`${SRC}/LOGO.jpeg`));
const loboBuf = await recortar(fs.readFileSync(`${SRC}/jb_merch_lobo_sin_fondo.png`), 0.01);

const marca = {
  monograma: await variantes(monogramaBuf, 'jb-merch', [120, 200, 320, 480, 640]),
  lobo: await variantes(loboBuf, 'lobo', [96, 240, 480, 800, 1100]),
};

// Íconos: monograma centrado sobre negro.
async function icono(lado, escala) {
  const interior = Math.round(lado * escala);
  const logo = await sharp(monogramaBuf).resize({ width: interior, height: interior, fit: 'inside' }).toBuffer();
  return sharp({ create: { width: lado, height: lado, channels: 4, background: '#0a0a0a' } })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}
marca.iconos = {
  i32: guardar(await icono(32, 0.86), 'favicon-32', 'png'),
  i180: guardar(await icono(180, 0.7), 'apple-touch', 'png'),
  i192: guardar(await icono(192, 0.7), 'icon-192', 'png'),
  i512: guardar(await icono(512, 0.7), 'icon-512', 'png'),
};
// /favicon.ico lo piden algunos navegadores por su cuenta: un PNG de 32 px sirve (Chrome, Edge, Firefox).
fs.writeFileSync('public/favicon.ico', await icono(32, 0.86));

fs.writeFileSync('src/data/marca.json', JSON.stringify(marca, null, 2) + '\n');
fs.writeFileSync(
  'public/manifest.webmanifest',
  JSON.stringify(
    {
      name: 'JB Merch',
      short_name: 'JB Merch',
      lang: 'es-CO',
      start_url: '/',
      display: 'browser',
      background_color: '#0a0a0a',
      theme_color: '#0a0a0a',
      icons: [
        { src: marca.iconos.i192, sizes: '192x192', type: 'image/png' },
        { src: marca.iconos.i512, sizes: '512x512', type: 'image/png' },
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(`monograma ${marca.monograma.w}×${marca.monograma.h} · lobo ${marca.lobo.w}×${marca.lobo.h} → ${OUT}`);
