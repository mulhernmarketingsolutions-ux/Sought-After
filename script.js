// Sought After Co. Homepage V2 interactions
const body = document.body;
const header = document.querySelector('[data-header]');
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const progress = document.querySelector('.scroll-progress');

window.addEventListener('load', () => {
  body.classList.add('is-loaded');
});

// Header + scroll progress
const handleScroll = () => {
  const scrolled = window.scrollY > 12;
  if (header) header.classList.toggle('is-scrolled', scrolled);

  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${pct}%`;
  }
};

handleScroll();
window.addEventListener('scroll', handleScroll, { passive: true });

// Mobile menu
if (hamburger && mobileMenu) {
  const setMenu = (open) => {
    hamburger.classList.toggle('is-open', open);
    mobileMenu.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    body.classList.toggle('menu-open', open);
  };

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    setMenu(!isOpen);
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });
}

// Reveal system
const revealEls = document.querySelectorAll('.reveal, .reveal-fast');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px'
  });

  revealEls.forEach((el) => observer.observe(el));
}

// Smooth anchor fallback + tactile tap
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
});

// Tally embed fallback
const loadTally = () => {
  if (typeof Tally !== 'undefined') {
    Tally.loadEmbeds();
    return;
  }

  document.querySelectorAll('iframe[data-tally-src]:not([src])').forEach((iframe) => {
    iframe.src = iframe.dataset.tallySrc;
  });
};

if (document.readyState === 'complete') {
  loadTally();
} else {
  window.addEventListener('load', loadTally);
}
