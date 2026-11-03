// Separadores de línea U+2028/U+2029 (escritos por código para que no queden crudos en el archivo).
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

/**
 * JSON para meter dentro de <script>: escapa «<» (un nombre de producto con «</script>» no
 * puede cerrar la etiqueta e inyectar código) y los separadores de línea.
 */
export const jsonSeguro = (v: unknown) =>
  JSON.stringify(v)
    .replaceAll('<', '\\u003c')
    .replaceAll(LS, '\\u2028')
    .replaceAll(PS, '\\u2029');
