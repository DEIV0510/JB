// Textos de WhatsApp por producto. Sin datos importados: lo usan el servidor (tarjetas) y el
// navegador (ficha) con la misma lógica, sin meter el catálogo en el JS.
import { WHATSAPP, MENSAJES } from './contacto';

export type DatosMensaje = { nombre: string; ref: string | null; precio: string | null };

/** Enlace wa.me con el mensaje codificado. */
export const wa = (mensaje: string) => `https://wa.me/${WHATSAPP.numero}?text=${encodeURIComponent(mensaje)}`;

const linea = ({ ref, precio }: DatosMensaje) => [ref ? `Ref. ${ref}` : null, precio].filter(Boolean).join(' · ');

/** Pedido al detal de un producto: nombre, referencia y precio tal como están en el catálogo. */
export const mensajeProducto = (p: DatosMensaje) =>
  `Hola, quiero pedir este producto de JB Merch:\n${p.nombre}${linea(p) ? `\n${linea(p)}` : ''}\n¿Está disponible? ¿Qué tallas tienen?`;

/** Cotización al por mayor partiendo de un producto. */
export const mensajeProductoMayor = (p: DatosMensaje) => `${MENSAJES.mayor}\nMe interesa: ${p.nombre}${p.ref ? ` (Ref. ${p.ref})` : ''}`;
