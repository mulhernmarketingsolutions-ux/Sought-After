// Hamburger
const btn = document.querySelector('.hamburger');
const menu = document.querySelector('.mobile-menu');
if (btn && menu) {
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('is-open');
    btn.classList.toggle('is-open');
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('is-open');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }));
}
// Scroll reveal
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
// Case card tap-to-flip
document.querySelectorAll('.case-card').forEach(card => {
  card.addEventListener('click', () => card.classList.toggle('is-flipped'));
});
// Hero photo — subtle cursor-tilt, desktop pointer only
const heroPhoto = document.querySelector('.hero-photo');
if (heroPhoto && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const collage = document.querySelector('.hero-collage');
  collage.addEventListener('mousemove', (e) => {
    const rect = heroPhoto.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    heroPhoto.style.transform = `rotate(${-1 + x * 2.5}deg) rotateX(${y * -4}deg) rotateY(${x * 4}deg)`;
  });
  collage.addEventListener('mouseleave', () => {
    heroPhoto.style.transform = '';
  });
}
// Contact toggle: Book a Call vs Send an Inquiry
const contactToggleBtns = document.querySelectorAll('.contact-toggle-btn');
contactToggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    contactToggleBtns.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    document.querySelectorAll('.contact-panel').forEach(p => p.classList.remove('is-active'));
    const target = document.getElementById(btn.dataset.target);
    if (target) target.classList.add('is-active');
  });
});
