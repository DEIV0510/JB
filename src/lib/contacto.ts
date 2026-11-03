// Datos de contacto y redes de JB Merch. Todo sale del brief del cliente; nada inventado.
export const MARCA = 'JB Merch';

export const WHATSAPP = {
  // Indicativo de Colombia (+57) + número.
  numero: '573137289350',
  visible: '313 728 9350',
  internacional: '+57 313 728 9350',
};

// Catálogo oficial de WhatsApp Business (el mismo de donde salen productos, precios y fotos).
export const CATALOGO_WHATSAPP = `https://wa.me/c/${WHATSAPP.numero}`;

export const REDES = [
  { id: 'instagram', nombre: 'Instagram', usuario: '@jb.merch', url: 'https://www.instagram.com/jb.merch' },
  { id: 'facebook', nombre: 'Facebook', usuario: 'JB Merch', url: 'https://www.facebook.com/profile.php?id=61563883636869&mibextid=LQQJ4d' },
  { id: 'tiktok', nombre: 'TikTok', usuario: '@jbmerch', url: 'https://www.tiktok.com/@jbmerch' },
] as const;

// Mensajes de WhatsApp según el origen del contacto.
export const MENSAJES = {
  detal: 'Hola, estoy interesado en conocer sus productos de JB Merch. ¿Me pueden brindar información?',
  mayor: 'Hola, estoy interesado en comprar productos de JB Merch al por mayor. ¿Me pueden compartir información sobre precios y condiciones?',
};

export const COPY = {
  titular: ['TU ESTILO.', 'TUS REGLAS.'],
  bajada: 'Descubre nuestra colección. Disponible al detal y por mayor.',
  manifiesto: ['NO SIGAS TENDENCIAS.', 'CREA TU PROPIO ESTILO.'],
  redes: 'Recuerda seguirnos en nuestras redes sociales para mantenerte actualizado en nuestros productos.',
  derechos: 'JB MERCH © 2026. TODOS LOS DERECHOS RESERVADOS.',
};
