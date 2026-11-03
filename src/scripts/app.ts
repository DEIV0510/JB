// Comportamiento del sitio: cabecera, menú, entradas al hacer scroll, parallax, catálogo
// (filtros, «ver más», ficha) y enlaces de WhatsApp. Sin librerías.
// Toda capa a pantalla completa (menú, ficha) tiene su entrada en el historial: «atrás» la cierra.

const d = document;
const html = d.documentElement;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = d) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = d) => [...r.querySelectorAll<T>(s)];
const reducido = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------------- Capas e historial ---------------- */
type Capa = { id: string; cerrar: () => void };
const capas: Capa[] = [];
let bloqueos = 0;
const bloquear = (si: boolean) => {
  bloqueos = Math.max(0, bloqueos + (si ? 1 : -1));
  d.body.classList.toggle('is-bloqueado', bloqueos > 0);
};
function abrirCapa(id: string, cerrar: () => void, hash?: string) {
  capas.push({ id, cerrar });
  history.pushState({ jbCapa: id }, '', hash ?? location.href);
}
/** Cierre pedido por la interfaz: vuelve una entrada y el popstate hace el resto. */
function cerrarCapa(id: string) {
  if (capas.at(-1)?.id === id && history.state?.jbCapa === id) history.back();
  else {
    const i = capas.findIndex((c) => c.id === id);
    if (i >= 0) capas.splice(i, 1)[0].cerrar();
  }
}
addEventListener('popstate', () => {
  const capa = capas.pop();
  capa?.cerrar();
});

/* ---------------- Cabecera ---------------- */
const cab = $('[data-cabecera]');
const flotante = $('[data-flotante]');
let ultimoY = scrollY;
let pendiente = false;
function alDesplazar() {
  pendiente = false;
  const y = scrollY;
  cab?.classList.toggle('is-solida', y > 24);
  const bajando = y > ultimoY + 4;
  const subiendo = y < ultimoY - 4;
  if (bajando && y > 320 && !capas.length) cab?.classList.add('is-oculta');
  else if (subiendo || y < 120) cab?.classList.remove('is-oculta');
  ultimoY = y;
}
addEventListener(
  'scroll',
  () => {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(alDesplazar);
    }
  },
  { passive: true },
);
alDesplazar();

/* ---------------- Menú ---------------- */
const menu = $('[data-menu]');
const btnMenu = $<HTMLButtonElement>('[data-menu-abrir]');
let destinoMenu: string | null = null;
function cerrarMenuUI() {
  if (!menu || menu.hidden) return;
  menu.classList.remove('is-abierto');
  btnMenu?.setAttribute('aria-expanded', 'false');
  bloquear(false);
  setTimeout(() => {
    if (!menu.classList.contains('is-abierto')) menu.hidden = true;
  }, reducido.matches ? 0 : 550);
  const destino = destinoMenu;
  destinoMenu = null;
  // Ir a la sección después de que el historial volvió (si no, el navegador repone el scroll).
  requestAnimationFrame(() => {
    if (destino) $(destino)?.scrollIntoView({ behavior: reducido.matches ? 'auto' : 'smooth' });
    else btnMenu?.focus();
  });
}
btnMenu?.addEventListener('click', () => {
  if (!menu) return;
  menu.hidden = false;
  requestAnimationFrame(() => menu.classList.add('is-abierto'));
  btnMenu.setAttribute('aria-expanded', 'true');
  bloquear(true);
  abrirCapa('menu', cerrarMenuUI);
  setTimeout(() => $<HTMLElement>('[data-menu-cerrar]')?.focus(), 60);
});
$('[data-menu-cerrar]')?.addEventListener('click', () => cerrarCapa('menu'));
$$<HTMLAnchorElement>('[data-menu-ir]').forEach((a) =>
  a.addEventListener('click', (e) => {
    // En otra página (404) el enlace lleva a la portada: se deja navegar.
    if (a.pathname !== location.pathname || !a.hash) return;
    e.preventDefault();
    destinoMenu = a.hash;
    cerrarCapa('menu');
  }),
);
menu?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarCapa('menu');
});
addEventListener('resize', () => {
  if (innerWidth >= 1024 && menu && !menu.hidden) cerrarCapa('menu');
});

/* ---------------- Entradas al hacer scroll ---------------- */
function activarEntradas() {
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visto');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  $$('[data-entra], [data-lineas]').forEach((el) => io.observe(el));
}

/* ---------------- Parallax sutil ---------------- */
function activarParallax() {
  const els = $$('[data-parallax]');
  if (!els.length) return;
  const vivos = new Set<HTMLElement>();
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? vivos.add(e.target as HTMLElement) : vivos.delete(e.target as HTMLElement))));
  els.forEach((el) => io.observe(el));
  let raf = 0;
  const pintar = () => {
    raf = 0;
    if (reducido.matches) return;
    const vh = innerHeight;
    // Lecturas primero, escrituras después.
    const medidas = [...vivos].map((el) => [el, el.getBoundingClientRect()] as const);
    for (const [el, r] of medidas) {
      const centro = r.top + r.height / 2 - vh / 2;
      const k = Number(el.dataset.parallax) || 0;
      el.style.transform = `translate3d(0, ${(centro * k).toFixed(1)}px, 0)`;
    }
  };
  addEventListener('scroll', () => (raf ||= requestAnimationFrame(pintar)), { passive: true });
  addEventListener('resize', () => (raf ||= requestAnimationFrame(pintar)));
  pintar();
}

/* ---------------- Sección activa en la navegación ---------------- */
function activarNavActiva() {
  const links = $$<HTMLAnchorElement>('.cab__nav a');
  const secciones = links.map((a) => (a.pathname === location.pathname && a.hash ? $(a.hash) : null)).filter(Boolean) as HTMLElement[];
  const io = new IntersectionObserver(
    (es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.classList.toggle('is-activo', a.hash === `#${e.target.id}`));
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  secciones.forEach((s) => io.observe(s));
}

/* ---------------- WhatsApp flotante ---------------- */
function activarFlotante() {
  const contacto = $('[data-contacto]');
  if (!flotante || !contacto) return;
  const io = new IntersectionObserver(([e]) => flotante.classList.toggle('is-fuera', e.isIntersecting), { threshold: 0.2 });
  io.observe(contacto);
}

/* ---------------- Catálogo ---------------- */
type Foto = { a: string; s: string; u: string; w: number; h: number; bg: string };
type Prod = { id: string; n: string; r: string | null; p: string | null; c: string; d: string | null; v: string | null; w: string; m: string; f: Foto[] };

const POR_PAGINA = 12;
const datos: Prod[] = JSON.parse($('#datos-catalogo')?.textContent || '[]');
const porId = new Map(datos.map((p) => [p.id, p]));
const grilla = $('[data-grilla]');
const tarjetas = $$<HTMLLIElement>('.tarjeta', grilla ?? d);
const btnMas = $<HTMLButtonElement>('[data-mas]');
const cajaMas = $('[data-mas-caja]');
const restan = $('[data-restan]');
const vacio = $('[data-vacio]');
const filtros = $$<HTMLButtonElement>('[data-filtro]');
const fila = $('[data-filtros-fila]');
let filtro = 'todo';
let mostrar = POR_PAGINA;

function pintarCatalogo(nuevasDesde = -1) {
  let visibles = 0;
  let total = 0;
  tarjetas.forEach((t) => {
    const entra = filtro === 'todo' || t.dataset.cat === filtro;
    t.classList.toggle('is-filtrada', !entra);
    if (!entra) return;
    total++;
    const extra = total > mostrar;
    t.classList.toggle('is-extra', extra);
    t.classList.remove('is-nueva');
    if (!extra) {
      if (nuevasDesde >= 0 && total > nuevasDesde) {
        t.style.setProperty('--k', String(total - nuevasDesde - 1));
        t.classList.add('is-nueva');
      }
      visibles++;
    }
  });
  const faltan = total - visibles;
  if (cajaMas) cajaMas.hidden = faltan <= 0;
  if (restan) restan.textContent = faltan > 0 ? `(${faltan})` : '';
  if (vacio) vacio.hidden = total > 0;
}

function elegirFiltro(id: string, desplazar = false) {
  filtro = id;
  mostrar = POR_PAGINA;
  filtros.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === id)));
  const activo = filtros.find((b) => b.dataset.filtro === id);
  if (activo && fila) {
    // Centra la pestaña activa moviendo solo la fila (no la página).
    const izq = activo.offsetLeft - (fila.clientWidth - activo.offsetWidth) / 2;
    fila.scrollTo({ left: Math.max(0, izq), behavior: reducido.matches ? 'auto' : 'smooth' });
  }
  pintarCatalogo(0);
  if (desplazar) $('#catalogo')?.scrollIntoView({ behavior: reducido.matches ? 'auto' : 'smooth' });
}
filtros.forEach((b) => b.addEventListener('click', () => elegirFiltro(b.dataset.filtro || 'todo')));
btnMas?.addEventListener('click', () => {
  const antes = mostrar;
  mostrar += POR_PAGINA;
  pintarCatalogo(antes);
});
$$<HTMLAnchorElement>('[data-categoria]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    elegirFiltro(a.dataset.categoria!, true);
  }),
);

// Flechas de la fila de filtros cuando hay categorías fuera de vista.
function activarFlechasFiltros() {
  const izq = $<HTMLButtonElement>('[data-filtros-izq]');
  const der = $<HTMLButtonElement>('[data-filtros-der]');
  if (!fila || !izq || !der) return;
  const revisar = () => {
    const max = fila.scrollWidth - fila.clientWidth;
    izq.hidden = fila.scrollLeft <= 4;
    der.hidden = fila.scrollLeft >= max - 4;
  };
  fila.addEventListener('scroll', revisar, { passive: true });
  new ResizeObserver(revisar).observe(fila);
  const paso = () => Math.max(160, fila.clientWidth * 0.7);
  izq.addEventListener('click', () => fila.scrollBy({ left: -paso(), behavior: 'smooth' }));
  der.addEventListener('click', () => fila.scrollBy({ left: paso(), behavior: 'smooth' }));
  revisar();
}

/* ---------------- Ficha de producto ---------------- */
const ficha = $<HTMLDialogElement>('[data-ficha]');
const fFotos = $('[data-ficha-fotos]');
const fAnt = $<HTMLButtonElement>('[data-ficha-ant]');
const fSig = $<HTMLButtonElement>('[data-ficha-sig]');
const fCont = $('[data-ficha-contador]');
let fichaActual: Prod | null = null;
let volverA: HTMLElement | null = null;

const enlaceProducto = (id: string) => `${location.origin}${location.pathname}#p-${id}`;
/** Agrega a un mensaje de WhatsApp el enlace del producto (solo en el dominio publicado). */
function conEnlace(href: string, id: string) {
  if (location.protocol !== 'https:') return href;
  const u = new URL(href);
  const t = u.searchParams.get('text') ?? '';
  u.searchParams.set('text', `${t}\n${enlaceProducto(id)}`);
  return u.href;
}

function indiceFoto() {
  if (!fFotos) return 0;
  return Math.round(fFotos.scrollLeft / Math.max(1, fFotos.clientWidth));
}
function pintarNavFotos() {
  const n = fichaActual?.f.length ?? 0;
  const i = indiceFoto();
  if (fAnt) fAnt.disabled = i <= 0 || n < 2;
  if (fSig) fSig.disabled = i >= n - 1 || n < 2;
  if (fCont) {
    fCont.hidden = n < 2;
    fCont.textContent = `${i + 1} / ${n}`;
  }
}
fFotos?.addEventListener('scroll', () => requestAnimationFrame(pintarNavFotos), { passive: true });
const irFoto = (delta: number) => fFotos?.scrollTo({ left: (indiceFoto() + delta) * fFotos.clientWidth, behavior: reducido.matches ? 'auto' : 'smooth' });
fAnt?.addEventListener('click', () => irFoto(-1));
fSig?.addEventListener('click', () => irFoto(1));
ficha?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') irFoto(-1);
  if (e.key === 'ArrowRight') irFoto(1);
});

function llenarFicha(p: Prod) {
  if (!ficha || !fFotos) return;
  fichaActual = p;
  const txt = (sel: string, v: string | null) => {
    const el = $(sel, ficha);
    if (el) el.textContent = v ?? '';
  };
  txt('[data-ficha-cat]', p.c);
  txt('[data-ficha-nombre]', p.n);
  txt('[data-ficha-ref]', p.r);
  txt('[data-ficha-precio]', p.p);
  const cajaRef = $('[data-ficha-ref-caja]', ficha);
  const cajaPrecio = $('[data-ficha-precio-caja]', ficha);
  if (cajaRef) cajaRef.hidden = !p.r;
  if (cajaPrecio) cajaPrecio.hidden = !p.p;
  for (const [sel, v] of [
    ['[data-ficha-desc]', p.d],
    ['[data-ficha-disp]', p.v],
  ] as const) {
    const el = $(sel, ficha);
    if (el) {
      el.hidden = !v;
      el.textContent = v ?? '';
    }
  }
  $<HTMLAnchorElement>('[data-ficha-wa]', ficha)!.href = conEnlace(p.w, p.id);
  $<HTMLAnchorElement>('[data-ficha-mayor]', ficha)!.href = conEnlace(p.m, p.id);
  fFotos.replaceChildren(
    ...p.f.map((f, i) => {
      const pic = d.createElement('picture');
      pic.style.setProperty('--bg', f.bg);
      const src = d.createElement('source');
      src.type = 'image/avif';
      src.srcset = f.a;
      src.sizes = '(min-width: 900px) 600px, 100vw';
      const img = d.createElement('img');
      img.srcset = f.s;
      img.sizes = src.sizes;
      img.src = f.u;
      img.width = f.w;
      img.height = f.h;
      img.alt = p.f.length > 1 ? `${p.n} — foto ${i + 1} de ${p.f.length}` : p.n;
      img.decoding = 'async';
      if (i > 0) img.loading = 'lazy';
      pic.append(src, img);
      return pic;
    }),
  );
  fFotos.scrollLeft = 0;
  pintarNavFotos();
}

function cerrarFichaUI() {
  if (!ficha?.open) return;
  const fin = () => {
    ficha.classList.remove('is-sale');
    ficha.close();
    bloquear(false);
    flotante?.classList.remove('is-oculto-ficha');
    volverA?.focus({ preventScroll: true });
  };
  if (reducido.matches) fin();
  else {
    ficha.classList.add('is-sale');
    setTimeout(fin, 280);
  }
}
function abrirFicha(id: string, desde: HTMLElement | null, conHistorial = true) {
  const p = porId.get(id);
  if (!p || !ficha) return;
  volverA = desde;
  llenarFicha(p);
  ficha.showModal();
  bloquear(true);
  flotante?.classList.add('is-oculto-ficha');
  if (conHistorial) abrirCapa('ficha', cerrarFichaUI, `#p-${id}`);
  else capas.push({ id: 'ficha', cerrar: cerrarFichaUI });
  // El foco va a la galería, no a un botón (el botón de cerrar arriba se lee primero igual).
  $<HTMLElement>('[data-ficha-cerrar]', ficha)?.focus({ preventScroll: true });
}
$('[data-ficha-cerrar]')?.addEventListener('click', () => cerrarCapa('ficha'));
ficha?.addEventListener('cancel', (e) => {
  e.preventDefault();
  cerrarCapa('ficha');
});
// Clic en el velo (fuera de la caja) cierra.
ficha?.addEventListener('click', (e) => {
  if (e.target === ficha) cerrarCapa('ficha');
});
d.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLElement>('[data-abrir]');
  if (!a || e.defaultPrevented || (e as MouseEvent).ctrlKey || (e as MouseEvent).metaKey) return;
  e.preventDefault();
  abrirFicha(a.dataset.abrir!, a);
});

// Enlace directo a un producto (#p-id): abre su ficha sobre la página, con «atrás» que la cierra.
function abrirDesdeHash() {
  const m = location.hash.match(/^#p-(.+)$/);
  if (!m || !porId.has(m[1])) return;
  const id = decodeURIComponent(m[1]);
  const t = tarjetas.find((x) => x.dataset.id === id);
  if (t) {
    // Que la tarjeta quede visible debajo de la ficha (al cerrarla se vuelve a ella).
    mostrar = Math.max(POR_PAGINA, Math.ceil((tarjetas.indexOf(t) + 1) / POR_PAGINA) * POR_PAGINA);
    pintarCatalogo();
  }
  // La entrada con el hash ya existe: se reemplaza por la página sin hash y se apila la ficha.
  history.replaceState(null, '', location.pathname + location.search);
  abrirFicha(id, t?.querySelector<HTMLElement>('[data-abrir]') ?? null);
}

// Un enlace #p-… abierto con la página ya cargada (pegado en la barra, «adelante» del historial).
addEventListener('hashchange', () => {
  if (/^#p-/.test(location.hash) && !ficha?.open) abrirDesdeHash();
});

/* ---------------- Enlaces de WhatsApp de cada tarjeta ---------------- */
d.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-producto]');
  if (a) a.href = conEnlace(a.href, a.dataset.producto!);
});

/* ---------------- Arranque ---------------- */
function arrancar() {
  activarEntradas();
  activarParallax();
}
pintarCatalogo();
activarFlechasFiltros();
activarNavActiva();
activarFlotante();
abrirDesdeHash();
if (html.classList.contains('con-intro')) d.addEventListener('jb:listo', arrancar, { once: true });
else arrancar();
