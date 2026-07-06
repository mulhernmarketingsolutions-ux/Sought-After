// Hamburger
const btn=document.querySelector('.hamburger');
const menu=document.querySelector('.mobile-menu');
if(btn&&menu){
btn.addEventListener('click',()=>{
const open=btn.getAttribute('aria-expanded')==='true';
btn.setAttribute('aria-expanded',String(!open));
menu.classList.toggle('is-open');
btn.classList.toggle('is-open');
});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
menu.classList.remove('is-open');
btn.classList.remove('is-open');
btn.setAttribute('aria-expanded','false');
}));
}
const obs=new IntersectionObserver(entries=>{
entries.forEach(e=>{
if(e.isIntersecting){
e.target.classList.add('is-visible');
obs.unobserve(e.target);
}
});
},{threshold:0.08});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.querySelectorAll('.case-card').forEach(card=>{
card.addEventListener('click',()=>{
if(window.innerWidth<900){
card.classList.toggle('is-flipped');
}
});
});
