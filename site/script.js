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
// Quiz: What's your brand actually missing?
const quizBox = document.getElementById('quiz-box');
if (quizBox) {
  const questions = Array.from(quizBox.querySelectorAll('.quiz-question'));
  const resultPanel = document.getElementById('quiz-result');
  const resultTitle = document.getElementById('quiz-result-title');
  const resultDesc = document.getElementById('quiz-result-desc');
  const retakeBtn = document.getElementById('quiz-retake');
  const scores = { consistency: 0, presence: 0, positioning: 0, momentum: 0 };

  const results = {
    consistency: {
      title: 'Consistency',
      desc: "Your brand says something a little different everywhere someone finds it — which quietly makes people trust it a little less each time. This isn't a taste problem, it's a system problem: one voice, one look, everywhere."
    },
    presence: {
      title: 'Presence',
      desc: "People already like your work enough to talk about it — there just isn't a real home to send them to yet. Word of mouth can only carry a business so far without something solid to land on."
    },
    positioning: {
      title: 'Positioning',
      desc: "Once people actually see the work, they're surprised. That means your brand is underselling you before you even open your mouth — and you're likely leaving money on the table because of it."
    },
    momentum: {
      title: 'Momentum',
      desc: "You already know exactly what needs to happen. What's missing isn't clarity — it's a deadline that actually holds."
    }
  };

  function showQuestion(index) {
    questions.forEach((q, i) => q.classList.toggle('is-active', i === index));
  }

  questions.forEach((q, index) => {
    q.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        scores[btn.dataset.tag]++;
        if (index < questions.length - 1) {
          showQuestion(index + 1);
        } else {
          const winner = Object.keys(scores).reduce((a, b) => scores[b] > scores[a] ? b : a);
          resultTitle.textContent = 'Your missing piece is ' + results[winner].title + '.';
          resultDesc.textContent = results[winner].desc;
          questions.forEach(qq => qq.classList.remove('is-active'));
          resultPanel.classList.add('is-active');
        }
      });
    });
  });

  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      Object.keys(scores).forEach(k => scores[k] = 0);
      resultPanel.classList.remove('is-active');
      showQuestion(0);
    });
  }
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
