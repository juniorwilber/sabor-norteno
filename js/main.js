/* =========================================================================
   SABOR NORTEÑO · JavaScript principal
   -------------------------------------------------------------------------
   Toda la interactividad del sitio, en JavaScript puro (sin librerías):
     1. Menú hamburguesa (abrir / cerrar en móvil)
     2. Cierre del menú al hacer clic en un enlace + tecla Escape
     3. Filtro de la carta por categorías
     4. Validación del formulario de reserva + envío por WhatsApp
   El scroll suave se resuelve por CSS (scroll-behavior: smooth).

   Número de WhatsApp del restaurante (ficticio). Cámbialo aquí una sola vez
   y se usará tanto en el botón flotante como en el formulario.
   ========================================================================= */
const WHATSAPP_NUMERO = '51999999999';

// Espera a que el HTML esté cargado antes de buscar elementos.
document.addEventListener('DOMContentLoaded', () => {
  initMenuMovil();
  initFiltroCarta();
  initFormularioReserva();
  initWhatsappFlotante();
});

/* 1 + 2. MENÚ HAMBURGUESA =================================================
   Alterna el menú móvil a pantalla completa. Gestiona accesibilidad:
   - aria-expanded en el botón
   - bloqueo del scroll de fondo mientras el menú está abierto
   - cierre con la tecla Escape y al pulsar cualquier enlace                */
function initMenuMovil() {
  const burger = document.querySelector('[data-burger]');
  const menu   = document.querySelector('[data-mobile-menu]');
  const cerrar = document.querySelector('[data-close-menu]');
  if (!burger || !menu) return;

  const abrirMenu = () => {
    menu.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // evita scroll detrás del menú
    // Mueve el foco al primer enlace para navegación por teclado
    const primerEnlace = menu.querySelector('a, button');
    if (primerEnlace) primerEnlace.focus();
  };

  const cerrarMenu = () => {
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    burger.focus(); // devuelve el foco al botón que abrió el menú
  };

  burger.addEventListener('click', abrirMenu);
  if (cerrar) cerrar.addEventListener('click', cerrarMenu);

  // Al pulsar cualquier enlace del menú, se cierra (y deja hacer scroll suave)
  menu.querySelectorAll('a').forEach((enlace) => {
    enlace.addEventListener('click', cerrarMenu);
  });

  // Tecla Escape cierra el menú si está abierto
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) cerrarMenu();
  });
}

/* 3. FILTRO DE LA CARTA POR CATEGORÍAS ====================================
   Cada botón tiene data-filtro con el nombre de la categoría ("todos",
   "entradas", "fondo", "bebidas", "postres"). Cada bloque de la carta tiene
   data-categoria. Al pulsar un botón se muestran u ocultan los bloques.    */
function initFiltroCarta() {
  const botones   = document.querySelectorAll('[data-filtro]');
  const categorias = document.querySelectorAll('[data-categoria]');
  if (!botones.length || !categorias.length) return;

  const aplicarFiltro = (filtro) => {
    categorias.forEach((bloque) => {
      const coincide = filtro === 'todos' || bloque.dataset.categoria === filtro;
      bloque.classList.toggle('is-hidden', !coincide);
    });
  };

  botones.forEach((boton) => {
    boton.addEventListener('click', () => {
      // Marca visualmente el botón activo y actualiza accesibilidad
      botones.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      boton.classList.add('is-active');
      boton.setAttribute('aria-pressed', 'true');

      aplicarFiltro(boton.dataset.filtro);
    });
  });
}

/* 4. FORMULARIO DE RESERVA ================================================
   Valida los campos antes de "enviar":
   - Campos obligatorios no vacíos
   - Formato de correo válido (si se rellena)
   Si todo es correcto, arma un mensaje y abre WhatsApp con la reserva.     */
function initFormularioReserva() {
  const form = document.querySelector('[data-form-reserva]');
  if (!form) return;

  // Expresión regular sencilla para validar el formato del correo
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Muestra un mensaje de error bajo un campo concreto
  const mostrarError = (campo, mensaje) => {
    const contenedor = campo.closest('.form__field');
    if (!contenedor) return;
    contenedor.classList.add('has-error');
    const hueco = contenedor.querySelector('.form__error');
    if (hueco) hueco.textContent = mensaje;
    campo.setAttribute('aria-invalid', 'true');
  };

  // Limpia el error de un campo
  const limpiarError = (campo) => {
    const contenedor = campo.closest('.form__field');
    if (!contenedor) return;
    contenedor.classList.remove('has-error');
    const hueco = contenedor.querySelector('.form__error');
    if (hueco) hueco.textContent = '';
    campo.removeAttribute('aria-invalid');
  };

  // Limpia el error en cuanto el usuario corrige el campo
  form.querySelectorAll('input, select').forEach((campo) => {
    campo.addEventListener('input', () => limpiarError(campo));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // no recargamos la página; validamos nosotros

    const okBox = form.querySelector('.form__ok');
    if (okBox) okBox.textContent = '';

    let valido = true;
    let primerErroneo = null;

    // Recorre los campos obligatorios y verifica que no estén vacíos
    form.querySelectorAll('[required]').forEach((campo) => {
      limpiarError(campo);
      if (!String(campo.value).trim()) {
        mostrarError(campo, 'Este campo es obligatorio.');
        valido = false;
        if (!primerErroneo) primerErroneo = campo;
      }
    });

    // Validación específica del correo (solo si el campo existe y tiene texto)
    const email = form.elements['email'];
    if (email && email.value.trim() && !regexEmail.test(email.value.trim())) {
      mostrarError(email, 'Escribe un correo válido, p. ej. nombre@correo.com');
      valido = false;
      if (!primerErroneo) primerErroneo = email;
    }

    if (!valido) {
      if (primerErroneo) primerErroneo.focus(); // lleva al usuario al 1er error
      return;
    }

    // Todo correcto: armamos el mensaje de WhatsApp con los datos
    const dato = (n) => (form.elements[n] ? String(form.elements[n].value).trim() : '');
    let msg = '¡Hola Sabor Norteño! Quisiera reservar una mesa.';
    if (dato('nombre'))   msg += '\n\nNombre: '   + dato('nombre');
    if (dato('telefono')) msg += '\nTeléfono: '   + dato('telefono');
    if (dato('email'))    msg += '\nCorreo: '     + dato('email');
    if (dato('fecha'))    msg += '\nFecha: '       + dato('fecha');
    if (dato('hora'))     msg += '\nHora: '        + dato('hora');
    if (dato('personas')) msg += '\nPersonas: '    + dato('personas');

    if (okBox) okBox.textContent = '¡Datos correctos! Te llevamos a WhatsApp…';

    const url = 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank', 'noopener');
  });
}

/* Asegura que el botón flotante y otros enlaces de WhatsApp usen el número
   configurado arriba (por si se cambia en un solo sitio).                  */
function initWhatsappFlotante() {
  const texto = encodeURIComponent('¡Hola Sabor Norteño! Quisiera hacer una reserva.');
  document.querySelectorAll('[data-whatsapp]').forEach((enlace) => {
    enlace.href = 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + texto;
  });
}
