/* ============================================================
   INGENIA — mejoras progresivas compartidas por las 5 páginas.
   Nada de lo que hace este script es necesario para ver el
   contenido: si no corre (JS bloqueado, navegador viejo), cada
   página se ve completa igual, solo sin estos agregados puntuales
   (scroll a nulo en el reload, swipe en los carruseles, botón de
   modo nocturno). El modo nocturno en sí necesita JS sí o sí para
   poder cambiarse a mano y recordarse — no hay forma de hacerlo
   sólo con CSS. El pequeño script inline en el <head> de cada
   página es el que aplica el tema ANTES de pintar, para que no
   haya parpadeo; este archivo hace el resto. ============================================================ */
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1) al recargar/refrescar, siempre arriba del todo ----------
     Por defecto el navegador restaura la posición de scroll que tenías
     al recargar (o al volver con atrás/adelante). Lo desactivamos y,
     si la URL no apunta a una sección con #, forzamos el tope. */
  if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
  window.addEventListener('pageshow', function(){
    if (!location.hash) { window.scrollTo(0, 0); }
  });

  /* ---------- 2) logo / "iNGENIA" del menú: siempre vuelve al inicio,
     estés donde estés (otra sección scrolleada, u otra página). ---------- */
  document.querySelectorAll('a.brand').forEach(function(link){
    link.addEventListener('click', function(e){
      var here = location.pathname.replace(/index\.html$/, '');
      var there = link.pathname.replace(/index\.html$/, '');
      if (here === there) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      /* si es otra página, la navegación normal ya alcanza: el fix #1
         de arriba hace que esa página cargue arrancando en el tope. */
    });
  });

  /* ---------- 3) modo nocturno: alterna y recuerda la elección ---------- */
  var THEME_KEY = 'ingenia-theme';
  document.querySelectorAll('[data-theme-toggle]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      var next = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* modo privado, etc. */ }
    });
  });

  /* ---------- 4) carruseles automáticos: cada tarjeta ahora dura 6s
     (2s más que antes), se puede pasar con el dedo (swipe) o tocando
     los puntitos, y siempre arranca en la tarjeta 01 al entrar en
     pantalla. Con "reducir movimiento" activado no tocamos nada: se ve
     el fallback estático de siempre (las 3 tarjetas ya visibles).

     El riel se mueve con "transform" (translateX) + transition: la
     tarjeta actual sale por un costado y la siguiente entra desde
     afuera, tal cual el carrusel de "Cómo pedimos" de Casa de Pollos.
     El recorte de los bordes redondeados corre por cuenta de
     .carousel-viewport (ver el comentario largo en style.css sobre por
     qué ese recorte vive en un wrapper aparte). ---------- */
  if (!reduceMotion) {
    var AUTOPLAY_MS = 6000;
    var SWIPE_THRESHOLD = 40;

    document.querySelectorAll('[data-auto-carousel]').forEach(function(carousel){
      var viewport = carousel.querySelector(':scope > .carousel-viewport');
      var track = viewport ? viewport.querySelector(':scope > .carousel-track') : null;
      if (!track) return;
      var slides = track.querySelectorAll(':scope > .step-slide');
      var dots = carousel.querySelectorAll('.steps-dots .dot');
      if (!slides.length) return;

      carousel.classList.add('js-carousel');

      /* riel real: el track mide (n * 100)% y cada tarjeta 100/n% de eso,
         así trasladar el track un "paso" mueve exactamente el ancho de
         una tarjeta — la actual sale por un costado, la próxima entra
         desde afuera, en vez de un fundido. */
      var n = slides.length;
      track.style.width = (n * 100) + '%';
      slides.forEach(function(s){ s.style.width = (100 / n) + '%'; });

      var index = 0;
      var timer = null;

      function render(){
        track.style.transform = 'translateX(-' + (index * (100 / n)) + '%)';
        dots.forEach(function(d, i){ d.classList.toggle('is-active', i === index); });
      }
      function goTo(i){ index = (i + slides.length) % slides.length; render(); }
      function next(){ goTo(index + 1); }
      function prev(){ goTo(index - 1); }
      function stop(){ if (timer) { clearInterval(timer); timer = null; } }
      function start(){ stop(); timer = setInterval(next, AUTOPLAY_MS); }
      function afterManualMove(){ start(); } /* reinicia la cuenta tras tocar */

      dots.forEach(function(dot, i){
        dot.addEventListener('click', function(){ goTo(i); afterManualMove(); });
      });

      var touchX = null;
      carousel.addEventListener('touchstart', function(e){
        touchX = e.touches[0].clientX;
      }, { passive: true });
      carousel.addEventListener('touchend', function(e){
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          if (dx < 0) { next(); } else { prev(); }
          afterManualMove();
        }
        touchX = null;
      }, { passive: true });

      goTo(0);

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if (entry.isIntersecting) { goTo(0); start(); }
            else { stop(); }
          });
        }, { threshold: 0.45 });
        io.observe(carousel);
      } else {
        start();
      }
    });
  }
})();
