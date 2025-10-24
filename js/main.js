// =====================================================
// main.js — Arte Urbano
// Tema global (oscuro/claro), propagación entre páginas
// y actualización del banner (con fade solo al togglear).
// =====================================================

(function(){
  const root = document.documentElement;
  const KEY = 'arte-urbano-theme';

  // --- Tema actual (light / dark)
  function currentTheme(){ 
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; 
  }

  // --- Cambia el banner. 'animate' = true solo cuando togglean tema.
  function updateBanner(theme, animate = true){
    const img = document.querySelector(".banner img");
    if (!img) return;

    const newSrc = theme === "light"
      ? "img/banner-light.svg"
      : "img/banner-dark.svg";

    // Si ya está correcto, no hacer nada
    if (img.getAttribute("src") === newSrc) return;

    // Si no queremos animación (carga inicial / cambio de página mismo tema)
    if (!animate){
      img.src = newSrc;
      return;
    }

    // Respeta prefers-reduced-motion para accesibilidad
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce){
      img.src = newSrc;
      return;
    }

    // --- Animación con pre-carga y crossfade ---
    const pre = new Image();
    pre.onload = () => {
      img.classList.add("is-fading");
      const onFadeOutEnd = () => {
        img.removeEventListener("transitionend", onFadeOutEnd);
        img.src = newSrc;
        requestAnimationFrame(() => {
          img.classList.remove("is-fading");
        });
      };
      img.addEventListener("transitionend", onFadeOutEnd, { once: true });
    };
    pre.src = newSrc;
  }

  // --- Aplica el tema global (oscuro o claro)
  function applyTheme(theme, updateURL = true){
    if(theme === 'light'){
      root.setAttribute('data-theme','light');
      localStorage.setItem(KEY, 'light');
    } else {
      root.removeAttribute('data-theme'); // dark
      localStorage.setItem(KEY, 'dark');
    }

    // Actualiza el parámetro ?theme en la URL
    if(updateURL){
      try{
        const url = new URL(window.location.href);
        url.searchParams.set('theme', theme);
        history.replaceState(null, '', url.toString());
      }catch(e){}
    }

    propagateLinks(theme); // sincroniza los enlaces internos
    // OJO: no actualizamos el banner aquí con animación;
    // el que llama decide si anima o no (toggle vs carga inicial).
  }

  // --- Propaga el ?theme= a todos los enlaces relativos
  function propagateLinks(theme){
    document.querySelectorAll('a[href]').forEach(a=>{
      const href = a.getAttribute('href');
      if(!href) return;
      if(/^https?:\/\//i.test(href) || /^mailto:|^tel:|^#/i.test(href)) return;
      try{
        const u = new URL(href, window.location.href);
        u.searchParams.set('theme', theme);
        a.setAttribute('href', u.pathname + (u.search||'') + (u.hash||''));
      }catch(e){}
    });
  }

  // --- Evento: click en el botón de cambio de tema (¡aquí sí animamos!)
  document.addEventListener('click', e=>{
    const btn = e.target.closest('[data-action="toggle-theme"]');
    if(!btn) return;
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    applyTheme(next, true);
    updateBanner(next, true); // fade SOLO al togglear
  });

  // --- Al cargar: aplica tema y banner SIN animación (evita fade molesto entre páginas)
  document.addEventListener('DOMContentLoaded', ()=>{
    const p = new URLSearchParams(location.search).get('theme');
    const initial = p ? p : (localStorage.getItem(KEY) === 'light' ? 'light' : 'dark');
    applyTheme(initial, false);     // fija atributo + propaga enlaces
    updateBanner(initial, false);   // SIN animación en carga/navegación
  });

})();

