/* ═══════════════════════════════════════════════════════
   KIMOCHI — script.js  (v3 — corrigé)
   Fix : window.scrollTo n'est plus écrasé
         Les liens mailto fonctionnent normalement
         Mobile nav ferme proprement
═══════════════════════════════════════════════════════ */

'use strict';

/* ─── UTILITAIRES ───────────────────────────── */
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/* ─── SCROLL VERS SECTION (nom distinct) ────── */
/* NE PAS nommer "scrollTo" → écraserait window.scrollTo natif */
function goToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH = 68;
  const top  = el.getBoundingClientRect().top + window.scrollY - navH;
  window.scrollTo({ top, behavior: 'smooth' }); /* ← utilise le natif */
}

/* ─── FERMER LE MENU MOBILE ─────────────────── */
function closeNav() {
  const burger = document.getElementById('nav-burger');
  const menu   = document.getElementById('nav-mobile');
  if (!burger || !menu) return;
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  menu.classList.remove('open');
  menu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
/* Rend globale pour les onclick HTML */
window.closeNav = closeNav;


/* ═══════════════════════════════════════════════
   1. NAVBAR MOBILE TOGGLE
═══════════════════════════════════════════════ */
(function initNavbar() {
  const burger = document.getElementById('nav-burger');
  const menu   = document.getElementById('nav-mobile');
  if (!burger || !menu) return;

  /* Hamburger toggle */
  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = burger.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(isOpen));
    menu.classList.toggle('open', isOpen);
    menu.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* Ferme en cliquant en dehors de la navbar */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) closeNav();
  });

  /* Ferme sur Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  /* ─── Liens desktop — smooth scroll ─────────── */
  /* IMPORTANT : on ne preventDefault que pour les liens #hash
     Les liens mailto:// ne sont PAS interceptés */
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) {
        e.preventDefault();
        goToSection(href.slice(1));
      }
      /* Si href = "mailto:..." → comportement natif du navigateur */
    });
  });

  /* ─── Liens mobile — smooth scroll ──────────── */
  menu.querySelectorAll('.nm-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) {
        e.preventDefault();
        closeNav();
        /* Légère attente pour que l'animation de fermeture se finisse */
        setTimeout(() => goToSection(href.slice(1)), 300);
      }
      /* Si href = "mailto:..." → comportement natif */
    });
  });

  /* ─── Scroll indicator hero ──────────────────── */
  const heroBtn = document.getElementById('hero-scroll-btn');
  if (heroBtn) {
    heroBtn.addEventListener('click', () => goToSection('about'));
  }
})();


/* ═══════════════════════════════════════════════
   2. TRANSITION DE FOND AU SCROLL
      #170000 → #ffd9d9
═══════════════════════════════════════════════ */
(function initScrollBg() {
  const bgLayer = document.getElementById('bg-layer');
  if (!bgLayer) return;
  let ticking = false;
  let lastP   = -1;

  function update() {
    const scrollY = window.scrollY;
    const heroH   = window.innerHeight;
    const start   = heroH * 0.25;
    const end     = heroH * 0.85;
    const p       = clamp((scrollY - start) / (end - start), 0, 1);

    if (Math.abs(p - lastP) < 0.002) return;
    lastP = p;

    bgLayer.style.opacity = p;
    document.body.classList.toggle('light-mode', p > 0.42);
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  update();
})();


/* ═══════════════════════════════════════════════
   3. CARROUSEL
      Boutons · Dots · Swipe · Autoplay
═══════════════════════════════════════════════ */
(function initCarousel() {
  const track   = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('car-prev');
  const nextBtn = document.getElementById('car-next');
  const dotsWrap= document.getElementById('car-dots');
  const wrap    = document.getElementById('carousel-wrap');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.slide'));
  const total  = slides.length;
  let current  = 0;
  let timer;
  let isHovered = false;
  let interactionPauseUntil = 0;

  /* Création des dots */
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = `dot${i === 0 ? ' active' : ''}`;
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', `Photo ${i + 1}`);
    d.addEventListener('click', () => interact(i));
    dotsWrap.appendChild(d);
  });
  const dots = Array.from(dotsWrap.querySelectorAll('.dot'));

  function updateDOM() {
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === current);
      d.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
  }

  function interact(idx) {
    current = ((idx % total) + total) % total;
    updateDOM();
    interactionPauseUntil = Date.now() + 10000;
    start();
  }

  function autoplayNext() {
    current = (current + 1) % total;
    updateDOM();
    start();
  }

  prevBtn?.addEventListener('click', () => interact(current - 1));
  nextBtn?.addEventListener('click', () => interact(current + 1));

  /* Clavier - activé uniquement quand visible (évite Reflows) */
  let isVisible = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(e => isVisible = e[0].isIntersecting).observe(wrap);
  } else {
    isVisible = true;
  }

  document.addEventListener('keydown', (e) => {
    if (!isVisible) return;
    if (e.key === 'ArrowLeft')  { interact(current - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { interact(current + 1); e.preventDefault(); }
  });

  /* Swipe tactile */
  let tx = 0, ty = 0, drag = false;
  wrap.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; drag = false; }, { passive: true });
  wrap.addEventListener('touchmove', e => {
    if (!drag) {
      const dx = Math.abs(e.touches[0].clientX - tx);
      const dy = Math.abs(e.touches[0].clientY - ty);
      if (dx > dy && dx > 8) drag = true;
    }
    if (drag) e.preventDefault();
  }, { passive: false });
  wrap.addEventListener('touchend', e => {
    if (!drag) return;
    const d = e.changedTouches[0].clientX - tx;
    if (d < -45) interact(current + 1);
    else if (d > 45) interact(current - 1);
    drag = false;
  });

  /* Autoplay */
  function start() { 
    stop();
    if (isHovered || document.hidden) return;
    const now = Date.now();
    const delay = now < interactionPauseUntil ? interactionPauseUntil - now : 5000;
    timer = setTimeout(autoplayNext, delay); 
  }
  function stop() { clearTimeout(timer); }

  wrap.addEventListener('mouseenter', () => { isHovered = true; stop(); });
  wrap.addEventListener('mouseleave', () => { isHovered = false; start(); });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  updateDOM();
  start();
})();


/* ═══════════════════════════════════════════════
   4. REVEAL AU SCROLL
═══════════════════════════════════════════════ */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => obs.observe(el));
})();


/* ═══════════════════════════════════════════════
   5. FALLBACK BOUTONS CONTACT (MAILTO)
      Copie l'email si le client mail par défaut échoue
═══════════════════════════════════════════════ */
(function initMailtoFallback() {
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', () => {
      const email = link.getAttribute('href').replace('mailto:', '').split('?')[0];
      
      navigator.clipboard.writeText(email).then(() => {
        let toast = document.getElementById('kimochi-toast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'kimochi-toast';
          Object.assign(toast.style, {
            position: 'fixed', bottom: '24px', right: '24px',
            background: 'var(--red)', color: 'white',
            padding: '12px 24px', borderRadius: '8px',
            fontWeight: '600', fontSize: '0.9rem',
            zIndex: '9999', opacity: '0', transform: 'translateY(20px)',
            transition: 'opacity 0.3s var(--ease), transform 0.3s var(--ease)',
            boxShadow: '0 8px 24px rgba(182, 0, 0, 0.4)'
          });
          document.body.appendChild(toast);
        }
        
        toast.textContent = 'Adresse email copiée : ' + email;
        
        // Afficher
        requestAnimationFrame(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateY(0)';
        });
        
        // Masquer
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(20px)';
        }, 3000);
      }).catch(err => console.error('Erreur copie presse-papier', err));
    });
  });
})();

/* ─── Console ────────────────────────────────── */
console.log('%c KIMOCHI 3D ▸ OK ', 'background:#b60000;color:#fff;font-weight:700;padding:3px 10px;border-radius:4px;');
