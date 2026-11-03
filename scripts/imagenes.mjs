// Fotos del catálogo → AVIF + WebP en anchos reales (nunca se amplía) y src/data/media.json
// con las medidas MEDIDAS de cada archivo (el srcset no miente) y el color de fondo de la foto
// (se pinta mientras carga).
// Las fotos no se retocan ni se recortan aquí: el encuadre de cada tarjeta lo hace el CSS.
// Caché: el nombre lleva el hash del original + ajustes; si ya existe, no se vuelve a codificar.
// Uso: npm run images
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const SRC = '_material-cliente/catalogo-whatsapp/fotos';
const OUT = 'public/img/p';
const MANIFEST = 'src/data/media.json';
// 400: tarjetas en pantallas 1x · 640: tarjetas en celular 2–3x y escritorio 2x · 900/1200: ficha.
const WIDTHS = [400, 640, 900, 1200];
const AJUSTES = 'avif-q52-e5|webp-q80-e5|v1';

fs.mkdirSync(OUT, { recursive: true });
const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');
const hex = (n) => Math.round(n).toString(16).padStart(2, '0');

async function colorFondo(buf) {
  const { data, info } = await sharp(buf).resize(120, null).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const ch = [[], [], []];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (x > 6 && x < W - 6 && y > 6 && y < H - 6) continue;
      const i = (y * W + x) * 3;
      for (let k = 0; k < 3; k++) ch[k].push(data[i + k]);
    }
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  return `#${hex(med(ch[0]))}${hex(med(ch[1]))}${hex(med(ch[2]))}`;
}

const archivos = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const vivos = new Set();
const manifest = {};
let nuevos = 0;

async function procesar(file) {
  const id = file.replace(/\.\w+$/, '');
  const buf = fs.readFileSync(path.join(SRC, file));
  const h = md5(Buffer.concat([buf, Buffer.from(AJUSTES)])).slice(0, 8);
  // Gira según EXIF y pasa a sRGB una sola vez.
  const base = sharp(buf).rotate().toColorspace('srgb');
  const meta = await base.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  const anchos = [...WIDTHS.filter((w) => w < meta.width), Math.min(meta.width, WIDTHS.at(-1))].filter((w, i, a) => a.indexOf(w) === i);
  const entry = { w: meta.width, h: meta.height, bg: await colorFondo(buf), avif: [], webp: [] };
  for (const w of anchos) {
    const alto = Math.round((meta.height * w) / meta.width);
    for (const fmt of ['avif', 'webp']) {
      const name = `${id}-${w}.${h}.${fmt}`;
      const dest = path.join(OUT, name);
      vivos.add(name);
      if (!fs.existsSync(dest)) {
        let img = base.clone().resize({ width: w, withoutEnlargement: true });
        if (w < meta.width) img = img.sharpen({ sigma: 0.5 });
        const out = fmt === 'avif' ? await img.avif({ quality: 52, effort: 5 }).toBuffer() : await img.webp({ quality: 80, effort: 5 }).toBuffer();
        fs.writeFileSync(dest, out);
        nuevos++;
      }
      entry[fmt].push([`/img/p/${name}`, w, alto]);
    }
  }
  manifest[id] = entry;
}

// Varias fotos a la vez: sharp ya reparte cada una en hilos, pero así la CPU no espera.
const cola = [...archivos];
const hilos = Math.max(2, Math.min(4, os.cpus().length >> 1));
await Promise.all(
  Array.from({ length: hilos }, async () => {
    while (cola.length) await procesar(cola.shift());
  }),
);

// Borra lo que ya no corresponde a ninguna foto.
for (const f of fs.readdirSync(OUT)) if (!vivos.has(f)) fs.rmSync(path.join(OUT, f));

const ordenado = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
fs.writeFileSync(MANIFEST, JSON.stringify(ordenado) + '\n');
const peso = [...vivos].reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`${archivos.length} fotos · ${vivos.size} archivos (${nuevos} nuevos) · ${(peso / 1048576).toFixed(1)} MB → ${OUT}`);
