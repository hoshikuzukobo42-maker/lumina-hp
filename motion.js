(() => {
  'use strict';
  const hero = document.querySelector('#hero');
  const plane = document.querySelector('.ambient-plane');
  if (!hero || !plane) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const state = window.__luminaMotion = { mode: 'static', phase: 'visible', depth: 0, updates: 0, introPlayed: false, maxDepth: 0 };
  let frame = 0, introTimer = 0, starTimer = 0, visible = true, listening = false;
  let firstVisit = true;
  try { firstVisit = sessionStorage.getItem('lumina-twilight-intro-v1') !== 'seen'; } catch (_) {}
  const clearIntro = () => {
    document.body.classList.remove('motion-intro');
    clearTimeout(introTimer);
  };
  const cancelMotion = () => {
    clearIntro();
    clearTimeout(starTimer);
    document.body.classList.remove('motion-stars');
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    plane.style.setProperty('--depth', '0');
    state.depth = 0;
    state.phase = 'settled';
  };
  const updateDepth = () => {
    frame = 0;
    if (preference.matches || !visible || document.hidden) return;
    const rect = hero.getBoundingClientRect();
    const limit = innerWidth <= 800 ? 4 : 8;
    const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)));
    const depth = Math.round(progress * limit * 100) / 100;
    plane.style.setProperty('--depth', String(depth));
    state.depth = depth;
    state.maxDepth = Math.max(state.maxDepth, depth);
    state.updates += 1;
  };
  const requestDepth = () => {
    if (!frame && !preference.matches && visible && !document.hidden) frame = requestAnimationFrame(updateDepth);
  };
  const applyPreference = () => {
    cancelMotion();
    if (listening) {
      removeEventListener('scroll', requestDepth);
      removeEventListener('resize', requestDepth);
      listening = false;
    }
    if (preference.matches) { state.mode = 'reduced'; return; }
    state.mode = 'enhanced';
    addEventListener('scroll', requestDepth, { passive: true });
    addEventListener('resize', requestDepth, { passive: true });
    listening = true;
    requestDepth();
    if (!firstVisit || document.hidden) return;
    firstVisit = false;
    try { sessionStorage.setItem('lumina-twilight-intro-v1', 'seen'); } catch (_) {}
    state.introPlayed = true;
    state.phase = 'intro';
    document.body.classList.add('motion-intro', 'motion-stars');
    introTimer = setTimeout(() => { clearIntro(); state.phase = 'glimmer'; }, 800);
    starTimer = setTimeout(() => { document.body.classList.remove('motion-stars'); state.phase = 'settled'; }, 3700);
  };
  document.addEventListener('keydown', e => { if (e.key === 'Tab') clearIntro(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelMotion(); else requestDepth(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) cancelMotion(); else requestDepth();
  }, { threshold: 0 }).observe(hero);
  preference.addEventListener('change', applyPreference);
  applyPreference();
})();
