import catalogo from '../data/catalogo.json';
import categorias from '../data/categorias.json';
import media from '../data/media.json';
import { SELECCION, MINIMO_TARJETA } from './seleccion';

export type Producto = {
  id: string;
  orden: number;
  nombre: string;
  ref: string | null;
  precio: number | null;
  categoria: string;
  para: 'dama' | 'hombre' | null;
  disponibilidad: string | null;
  descripcion?: string;
  fotos: string[];
};

export type Variante = [url: string, ancho: number, alto: number];
export type Media = { w: number; h: number; bg: string; avif: Variante[]; webp: Variante[] };

export const PRODUCTOS = catalogo as Producto[];
const MEDIA = media as unknown as Record<string, Media>;

export const foto = (id: string): Media => {
  const m = MEDIA[id];
  if (!m) throw new Error(`Foto sin procesar: ${id} (npm run images)`);
  return m;
};

export type Categoria = { id: string; nombre: string; total: number; portada: Producto; tarjeta: boolean };

// Orden y nombres: src/data/categorias.json (lo escribe scripts/catalogo.mjs).
export const CATEGORIAS: Categoria[] = categorias
  .map(({ id, nombre }) => {
    const items = PRODUCTOS.filter((p) => p.categoria === id);
    const elegido = SELECCION.portadas[id];
    const portada = items.find((p) => p.id === elegido) ?? items[0];
    return { id, nombre, total: items.length, portada, tarjeta: items.length >= MINIMO_TARJETA };
  })
  .filter((c) => c.total > 0);

export const nombreCategoria = (id: string) => categorias.find((c) => c.id === id)?.nombre ?? id;

export const precioTexto = (n: number) => `$ ${n.toLocaleString('es-CO')}`;

export const producto = (id: string) => {
  const p = PRODUCTOS.find((x) => x.id === id);
  if (!p) throw new Error(`Producto inexistente: ${id}`);
  return p;
};
