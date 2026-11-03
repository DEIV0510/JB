// Catálogo de WhatsApp Business de JB Merch → fotos originales + src/data/catalogo.json.
//
// Entrada: _material-cliente/catalogo-whatsapp/catalogo-whatsapp.json, descargado desde
// WhatsApp Web (catálogo de +57 313 728 9350): por producto, el nombre, la referencia y el
// precio tal como los publica la tienda, y cada foto en la resolución original del catálogo.
//
// Salida:
//   · _material-cliente/catalogo-whatsapp/fotos/NNN-slug-K.jpg  (bytes originales, sin recomprimir)
//   · src/data/catalogo.json  (lo que usa el sitio; no lleva datos que el catálogo no tenga)
//
// La categoría se deduce de la primera palabra del nombre (CAMISETA, JEANS, BERMUDA…): no se
// inventa ninguna; un nombre que no encaje queda en «Otros» y se avisa por consola.
// Uso: npm run catalogo
import fs from 'node:fs';
import path from 'node:path';

const DIR = '_material-cliente/catalogo-whatsapp';
const FOTOS = `${DIR}/fotos`;
const raw = JSON.parse(fs.readFileSync(`${DIR}/catalogo-whatsapp.json`, 'utf8'));

// Orden = el de la colección en el sitio (de más a menos productos).
export const CATEGORIAS = [
  // «POLO PIQUE» va con las camisetas: el catálogo ya llama «CAMISETA TIPO POLO» a las demás.
  { id: 'camisetas', nombre: 'Camisetas', re: /^(CAMISETA|POLO)/ },
  { id: 'jeans', nombre: 'Jeans', re: /^JEANS?\b/ },
  { id: 'bermudas', nombre: 'Bermudas', re: /^BERMUDA/ },
  { id: 'faldas-shorts', nombre: 'Faldas y shorts', re: /FALDA|^SHORT|^BIKER/ },
  { id: 'pantalones', nombre: 'Pantalones', re: /^(PANTAL[OÓ]N|JOGG?U?ER)\b/ },
  { id: 'pantalonetas', nombre: 'Pantalonetas', re: /^PANTALONETA/ },
  { id: 'blusas', nombre: 'Blusas', re: /^BLUSA/ },
  { id: 'esqueletos', nombre: 'Esqueletos', re: /^ESQUELETO/ },
  // «COJUNTO» aparece así en el catálogo; es el mismo tipo de prenda.
  { id: 'conjuntos', nombre: 'Conjuntos', re: /^CON?JUNTO/ },
  { id: 'camisas', nombre: 'Camisas', re: /^CAMISA\b/ },
];

// Notas de disponibilidad que la tienda escribió dentro del nombre («… EL ROJO NO ESTÁ
// DISPONIBLE», «… DISPONIBLE EN BLANCO»): se separan para mostrarlas como nota.
const NOTA = /\s+((?:EL|LA)\s+\S+\s+NO\s+EST[AÁ]\s+DISPONIBLE|DISPONIBLE\s+EN\s+.+)$/i;
const frase = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const limpiar = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

fs.rmSync(FOTOS, { recursive: true, force: true });
fs.mkdirSync(FOTOS, { recursive: true });

const productos = [];
const usados = new Map();
const ordenados = [...raw].sort((a, b) => a.i - b.i);
let fotosTotal = 0;

for (const p of ordenados) {
  // El detalle del producto (txt) manda; la fila de la lista es el respaldo.
  const [nombreDet, ...resto] = p.txt ?? [];
  const completo = limpiar(nombreDet || p.listName);
  const nota = completo.match(NOTA)?.[1] ?? null;
  const nombre = nota ? completo.slice(0, completo.length - nota.length).trim() : completo;
  const precioTxt = resto.find((t) => /^\$/.test(t)) ?? p.listPrice ?? null;
  const refTxt = resto.find((t) => /^REF/i.test(t)) ?? p.listRef ?? null;
  const extra = resto.filter((t) => t !== precioTxt && t !== refTxt).map(limpiar).filter(Boolean);

  const precio = precioTxt ? Number(precioTxt.replace(/[^\d]/g, '')) : null;
  const ref = refTxt ? limpiar(refTxt.replace(/^REF\s*:?\s*/i, '')) : null;
  const mayus = nombre.toUpperCase();
  const cat = CATEGORIAS.find((c) => c.re.test(mayus));
  if (!cat) console.warn(`⚠ sin categoría: ${nombre}`);
  const para = /\bDAMA\b/.test(mayus) ? 'dama' : /\bHOMBRE\b/.test(mayus) ? 'hombre' : null;

  let base = slug(nombre) || 'producto';
  const n = (usados.get(base) ?? 0) + 1;
  usados.set(base, n);
  const id = n > 1 ? `${base}-${n}` : base;
  const num = String(p.i + 1).padStart(3, '0');

  const fotos = [];
  p.imgs.forEach((img, k) => {
    // WhatsApp entrega los blobs como application/octet-stream: el formato se lee de los bytes.
    const m = img.data.match(/^data:[\w/+.-]+;base64,(.+)$/);
    if (!m) throw new Error(`foto ilegible en ${nombre}`);
    const bytes = Buffer.from(m[1], 'base64');
    const ext = bytes[0] === 0xff && bytes[1] === 0xd8 ? 'jpg' : bytes.toString('ascii', 1, 4) === 'PNG' ? 'png' : bytes.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : null;
    if (!ext) throw new Error(`formato desconocido en ${nombre}`);
    const file = `${num}-${id}-${k + 1}.${ext}`;
    fs.writeFileSync(path.join(FOTOS, file), bytes);
    fotos.push(file.replace(/\.\w+$/, ''));
    fotosTotal++;
  });

  productos.push({
    id,
    orden: p.i + 1,
    nombre,
    ref,
    precio,
    categoria: cat?.id ?? 'otros',
    para,
    disponibilidad: nota ? `${frase(nota)}.` : null,
    ...(extra.length ? { descripcion: extra.join(' ') } : {}),
    fotos,
  });
}

fs.writeFileSync('src/data/catalogo.json', JSON.stringify(productos, null, 2) + '\n');
fs.writeFileSync(
  'src/data/categorias.json',
  JSON.stringify(
    CATEGORIAS.map(({ id, nombre }) => ({ id, nombre })),
    null,
    2,
  ) + '\n',
);
const porCat = Object.fromEntries(CATEGORIAS.map((c) => [c.id, productos.filter((p) => p.categoria === c.id).length]));
console.log(`${productos.length} productos · ${fotosTotal} fotos → ${FOTOS}`);
console.log(porCat);
