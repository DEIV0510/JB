// Tarjeta para redes (public/og.jpg, 1200×630): negro, monograma a la izquierda y las tres
// fotos del hero a la derecha, sin texto añadido (el título lo pone cada red).
// Las fotos salen de SELECCION.hero en src/lib/seleccion.ts.
// Uso: node scripts/og.mjs   (después de npm run brand y npm run catalogo)
import fs from 'node:fs';
import sharp from 'sharp';

const FOTOS = '_material-cliente/catalogo-whatsapp/fotos';
const seleccion = fs.readFileSync('src/lib/seleccion.ts', 'utf8');
const ids = JSON.parse(seleccion.match(/hero:\s*(\['[^\]]+\])/)[1].replace(/'/g, '"'));
const catalogo = JSON.parse(fs.readFileSync('src/data/catalogo.json', 'utf8'));
const marca = JSON.parse(fs.readFileSync('src/data/marca.json', 'utf8'));

const W = 1200;
const H = 630;
const archivo = (fotoId) => `${FOTOS}/${fs.readdirSync(FOTOS).find((f) => f.startsWith(fotoId + '.') || f.replace(/\.\w+$/, '') === fotoId)}`;
const fotos = ids.map((id) => archivo(catalogo.find((p) => p.id === id).fotos[0]));

const logo = await sharp(`public${marca.monograma.webp.at(-1)[0]}`).resize({ width: 300 }).toBuffer();
const logoMeta = await sharp(logo).metadata();
const ancho = 196;
const comps = [{ input: logo, left: 70, top: Math.round((H - logoMeta.height) / 2) }];
let x = W - 3 * ancho - 2 * 12 - 40;
for (const [i, f] of fotos.entries()) {
  const alto = i === 1 ? 470 : 400;
  const buf = await sharp(f).resize(ancho, alto, { fit: 'cover' }).toBuffer();
  comps.push({ input: buf, left: x, top: Math.round((H - alto) / 2) + (i === 1 ? 0 : i === 0 ? -30 : 40) });
  x += ancho + 12;
}
await sharp({ create: { width: W, height: H, channels: 3, background: '#0a0a0a' } })
  .composite(comps)
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('public/og.jpg');
console.log('→ public/og.jpg');
