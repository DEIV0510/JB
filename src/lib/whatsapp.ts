import { MENSAJES } from './contacto';
import type { Producto } from './catalogo';
import { precioTexto } from './catalogo';
import { wa, mensajeProducto as msg, mensajeProductoMayor as msgMayor } from './mensajes';

export { wa };
export const waDetal = wa(MENSAJES.detal);
export const waMayor = wa(MENSAJES.mayor);

const datos = (p: Producto) => ({ nombre: p.nombre, ref: p.ref, precio: p.precio ? precioTexto(p.precio) : null });

export const mensajeProducto = (p: Producto) => msg(datos(p));
export const mensajeProductoMayor = (p: Producto) => msgMayor(datos(p));
