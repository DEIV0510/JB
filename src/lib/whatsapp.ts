import { WHATSAPP, MENSAJES } from './contacto';
import type { Producto } from './catalogo';
import { precioTexto } from './catalogo';

/** Enlace wa.me con el mensaje codificado. */
export const wa = (mensaje: string) => `https://wa.me/${WHATSAPP.numero}?text=${encodeURIComponent(mensaje)}`;

export const waDetal = wa(MENSAJES.detal);
export const waMayor = wa(MENSAJES.mayor);

const datos = (p: Producto) => [p.ref ? `Ref. ${p.ref}` : null, p.precio ? precioTexto(p.precio) : null].filter(Boolean).join(' · ');

/** Pedido al detal de un producto: nombre, referencia y precio tal como están en el catálogo. */
export const mensajeProducto = (p: Producto) =>
  `Hola, quiero pedir este producto de JB Merch:\n${p.nombre}${datos(p) ? `\n${datos(p)}` : ''}\n¿Está disponible? ¿Qué tallas tienen?`;

/** Cotización al por mayor partiendo de un producto. */
export const mensajeProductoMayor = (p: Producto) =>
  `${MENSAJES.mayor}\nMe interesa: ${p.nombre}${p.ref ? ` (Ref. ${p.ref})` : ''}`;

/** Consulta por una categoría completa. */
export const mensajeCategoria = (nombre: string) => `Hola, quiero ver las opciones de ${nombre.toLowerCase()} de JB Merch. ¿Qué tienen disponible?`;
