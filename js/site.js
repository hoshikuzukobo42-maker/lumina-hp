(() => {
  'use strict';
  const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: true };
  const animations = new Set();
  const state = window.__luminaRefresh = { version: 'draft-20261009-r2', motion: motion.matches ? 'reduced' : 'normal', continuousFrames: 0, imagesReady: false };
  const stop = () => {
    animations.forEach(animation => animation.cancel());
    animations.clear();
    state.motion = motion.matches ? 'reduced' : 'normal';
  };
  if (motion.addEventListener) motion.addEventListener('change', stop);
  else if (motion.addListener) motion.addListener(stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (motion.matches || document.hidden || !entry.target.animate) continue;
        const animation = entry.target.animate([
          { opacity: .86, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 350, easing: 'ease-out' });
        animations.add(animation);
        animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
      }
    }, { threshold: .08 });
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
  }

  const dialog = document.querySelector('.art-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('img');
  const caption = dialog.querySelector('.dialog-caption');
  const closeButton = dialog.querySelector('.dialog-close');
  const navigation = dialog.querySelector('.dialog-navigation');
  const counter = dialog.querySelector('.dialog-count');
  const links = Array.from(document.querySelectorAll('[data-art-open]'));
  if (!image || !caption || !closeButton || !links.length) return;
  let opener;
  let currentIndex = 0;
  const show = index => {
    currentIndex = (index + links.length) % links.length;
    const link = links[currentIndex];
    const source = link.querySelector('img');
    image.src = link.href;
    image.alt = source ? source.alt : '';
    if (source) {
      image.width = Number(source.getAttribute('width'));
      image.height = Number(source.getAttribute('height'));
    }
    caption.textContent = image.alt;
    if (counter) counter.textContent = `${currentIndex + 1} / ${links.length}`;
  };
  links.forEach((link, index) => link.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    show(index);
    dialog.showModal();
  }));
  if (navigation && links.length > 1) {
    navigation.hidden = false;
    navigation.querySelectorAll('[data-art-step]').forEach(button => {
      button.addEventListener('click', () => show(currentIndex + Number(button.dataset.artStep)));
    });
    dialog.addEventListener('keydown', event => {
      if (!dialog.open || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      show(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    });
  }
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { if (opener && opener.isConnected) opener.focus(); });
})();
