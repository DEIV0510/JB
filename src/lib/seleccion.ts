// Fotos elegidas a mano para las piezas editoriales (hero y portadas de la colección).
// Son ids de src/data/catalogo.json; si alguno deja de existir, la portada usa el primer
// producto de su categoría y el hero falla al compilar (a propósito: hay que elegir otra).
export const SELECCION: {
  hero: [string, string, string];
  portadas: Record<string, string>;
} = {
  // A: camiseta Godspeed (la del LCP) · B: jean rígido ancho con tenis · C: jean skinny de noche.
  hero: ['camiseta-godspeed-1-1', 'jeans-rigido-unike', 'jeans-skinny-hombre'],
  portadas: {
    camisetas: 'camiseta-1-1-elite',
    jeans: 'jeans-cargo-rigido',
    bermudas: 'bermuda-rigida-cruz',
    'faldas-shorts': 'mini-falda-dama',
    pantalones: 'pantalon-dril-dama-unk',
    pantalonetas: 'pantalonetas-en-algodon',
    blusas: 'blusa-ojalillo-campesina',
  },
};

// Ancho de la foto principal del hero (la del LCP): lo usan el <picture> y la precarga.
export const HERO_SIZES = '(min-width: 1024px) 30vw, 62vw';

// La colección muestra como tarjeta las categorías con al menos este número de productos;
// las demás quedan en los filtros del catálogo.
export const MINIMO_TARJETA = 3;
