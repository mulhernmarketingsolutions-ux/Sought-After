// Lead capture — inquiry form + checklist signup, both submit to the same
// Google Apps Script Web App (see /Lead Automation/Code.gs for setup).
// Swap in your real Web App URL after deploying — it currently points at
// a placeholder, so submissions won't go anywhere until that's done.
const LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbwxmM4E7ozwZp4ccmc52ghtQ8nsPf-ju-MkrYb6CefOEuj2FJkko6V5ThbCHl2mXrGI/exec";

const PUZZLE_PATH = "M9,7 H14 C14,3 22,3 22,7 H27 A2,2 0 0 1 29,9 V14 C33,14 33,22 29,22 V27 A2,2 0 0 1 27,29 H9 A2,2 0 0 1 7,27 V9 A2,2 0 0 1 9,7 Z";

function showFormSuccess(form, successMsg) {
  const wrap = document.createElement('div');
  wrap.className = 'form-success';
  wrap.innerHTML = `<span class="form-success-check" aria-hidden="true"><svg viewBox="0 0 36 36"><path class="fs-slot" d="${PUZZLE_PATH}"/><path class="fs-piece" d="${PUZZLE_PATH}"/></svg></span><p class="form-success-text"></p>`;
  wrap.querySelector('.form-success-text').textContent = successMsg;
  form.style.display = 'none';
  form.insertAdjacentElement('afterend', wrap);
}

function wireForm(form, msgEl, successMsg) {
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const required = form.querySelectorAll('[required]');
    let missing = false;
    required.forEach(field => { if (!field.value.trim()) missing = true; });
    if (missing) {
      if (msgEl) { msgEl.textContent = 'Please fill in the required field(s) before submitting.'; msgEl.style.color = 'var(--terracotta)'; }
      return;
    }

    if (LEAD_ENDPOINT.indexOf('REPLACE_WITH') === 0) {
      if (msgEl) { msgEl.textContent = 'Form isn\'t connected yet — set LEAD_ENDPOINT in script.js after deploying the Apps Script.'; msgEl.style.color = 'var(--terracotta)'; }
      return;
    }

    const submitBtn = form.querySelector('button[type=submit]');
    if (submitBtn) submitBtn.disabled = true;
    if (msgEl) { msgEl.textContent = 'Sending...'; msgEl.style.color = 'var(--sage-stone)'; }

    // Apps Script Web Apps don't return CORS headers, so the browser
    // requires no-cors mode — the response is opaque, so a resolved
    // fetch is treated as success.
    fetch(LEAD_ENDPOINT, { method: 'POST', mode: 'no-cors', body: new FormData(form) })
      .then(() => {
        if (msgEl) { msgEl.textContent = ''; msgEl.style.display = 'none'; }
        showFormSuccess(form, successMsg);
      })
      .catch(() => {
        if (msgEl) { msgEl.textContent = 'Something went wrong — please email hello@soughtafter.design directly.'; msgEl.style.color = 'var(--terracotta)'; }
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

wireForm(document.getElementById('inquiry-form'), document.getElementById('inquiry-msg'), "Found it. We'll follow up within a couple of days.");

// Every checklist signup form on the page (footer + the dedicated section)
// shares the same behavior — wire each one to its own adjacent status line.
document.querySelectorAll('.lead-magnet-form').forEach((form) => {
  wireForm(form, form.nextElementSibling, "Found it — check your inbox for the checklist.");
});

// Missing-piece scroll tracker — the dashed circle fills in as you scroll
// the page, then swaps to solid once you've reached the bottom. Same
// "the metaphor is the interaction" idea as Jessie's scroll-sipper.
const pieceRing = document.querySelector('.piece-tracker-ring');
const pieceLabel = document.querySelector('.piece-tracker-label');
if (pieceRing) {
  let pieceTicking = false;
  const updatePieceTracker = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = scrollable > 0 ? window.scrollY / scrollable : 0;
    const clamped = Math.max(0, Math.min(1, fraction));
    document.documentElement.style.setProperty('--piece-progress', clamped.toFixed(3));
    const complete = clamped > 0.92;
    pieceRing.classList.toggle('is-complete', complete);
    if (pieceLabel) pieceLabel.textContent = complete ? 'Found it.' : 'Missing Piece';
    pieceTicking = false;
  };
  updatePieceTracker();
  window.addEventListener('scroll', () => {
    if (!pieceTicking) { window.requestAnimationFrame(updatePieceTracker); pieceTicking = true; }
  });
  window.addEventListener('resize', updatePieceTracker);
}

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

// Deep link straight to the inquiry form — any link to #contact-form
// switches the toggle to "Send an Inquiry" and scrolls it into view,
// so the form isn't only reachable by scrolling to the bottom and clicking.
function openInquiryForm() {
  const formToggle = document.querySelector('.contact-toggle-btn[data-target="panel-form"]');
  if (formToggle) formToggle.click();
  const section = document.getElementById('contact');
  if (section) setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
}
if (window.location.hash === '#contact-form') openInquiryForm();
// Exact-match only — case study pages link to "index.html#contact-form"
// and should navigate normally; the hash check above handles it on arrival.
document.querySelectorAll('a[href="#contact-form"]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    openInquiryForm();
  });
});
