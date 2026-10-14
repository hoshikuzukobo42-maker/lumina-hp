(() => {
  'use strict';
  const root = document.getElementById('response-demo');
  if (!root) return;
  const timings = [7726.878,1197.009209,1172.785709,1594.192667,1463.140875,1320.187209,1073.137208,6966.390042,1170.753083,1473.091584,1316.955208,7181.084042,1228.756625,1207.430709,1574.695750,7186.151584,1374.996250,1182.253958,1196.693417,7199.699667];
  const status = root.querySelector('#bench-status');
  const time = root.querySelector('#bench-time');
  const selected = root.querySelector('#bench-selected');
  const progress = root.querySelector('#bench-progress');
  const samples = root.querySelector('#bench-samples');
  const resetButton = root.querySelector('#bench-reset');
  const toggleButton = root.querySelector('#bench-toggle');
  const panel = root.querySelector('#bench-panel');
  if (!status || !time || !selected || !progress || !samples || !resetButton || !toggleButton || !panel) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let running = false;
  let frame = 0;
  const seconds = ms => (ms / 1000).toFixed(2);
  // Status messages are built from short phrases that never break inside (.nw), with a <wbr>
  // between them, so narrow screens wrap between phrases instead of mid-word. A ' ' part stays a
  // plain breakable space.
  const phrase = text => {
    const span = document.createElement('span');
    span.className = 'nw';
    span.textContent = text;
    return span;
  };
  const say = (...parts) => status.replaceChildren(...parts.flatMap((part, i) => {
    if (part === ' ') return [part];
    return i && parts[i - 1] !== ' ' ? [document.createElement('wbr'), phrase(part)] : [phrase(part)];
  }));
  const lock = value => root.querySelectorAll('[data-bench-run]').forEach(button => { button.disabled = value; });
  const reset = () => {
    cancelAnimationFrame(frame);
    running = false;
    frame = 0;
    lock(false);
    resetButton.disabled = true;
    time.textContent = '0.00 秒';
    selected.textContent = '20回とも返事が届きました';
    progress.style.transform = 'scaleX(0)';
    say('下のボタンを押すと、', '返事の文章が', '届くまでの時間を', '体験できます。');
    samples.querySelectorAll('button').forEach(button => button.removeAttribute('aria-current'));
  };
  const run = index => {
    if (running || !Number.isInteger(index) || index < 0 || index >= timings.length) return;
    running = true;
    lock(true);
    resetButton.disabled = false;
    const duration = timings[index];
    const start = performance.now();
    selected.textContent = (index + 1) + '回目を再現（' + seconds(duration) + ' 秒）';
    say('返事が届くまでの', '時間を', '再現しています…');
    time.textContent = '0.00 秒';
    progress.style.transform = 'scaleX(0)';
    samples.querySelectorAll('button').forEach((button, i) => { if (i === index) button.setAttribute('aria-current','true'); else button.removeAttribute('aria-current'); });
    const tick = now => {
      if (!running) return;
      const elapsed = Math.min(Math.max(now - start, 0), duration);
      time.textContent = seconds(elapsed) + ' 秒';
      if (!reducedMotion.matches || elapsed === duration) progress.style.transform = 'scaleX(' + (elapsed / duration) + ')';
      if (elapsed < duration) { frame = requestAnimationFrame(tick); return; }
      running = false;
      frame = 0;
      lock(false);
      say('✦ この回は、', '返事の文章が', '最後まで届くまで', ' ', seconds(duration) + ' 秒かかりました。');
    };
    frame = requestAnimationFrame(tick);
  };
  timings.forEach((duration, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(index + 1);
    button.setAttribute('data-bench-run','');
    button.setAttribute('data-slow',String(duration >= 6000));
    button.setAttribute('aria-label',(index + 1) + '回目、' + seconds(duration) + '秒を再現');
    button.addEventListener('click',() => run(index));
    samples.appendChild(button);
  });
  root.querySelector('#bench-random').addEventListener('click',() => run(Math.floor(Math.random() * timings.length)));
  root.querySelector('#bench-fast').addEventListener('click',() => run(timings.indexOf(Math.min(...timings))));
  root.querySelector('#bench-slow').addEventListener('click',() => run(timings.indexOf(Math.max(...timings))));
  resetButton.addEventListener('click',reset);
  const closePanel = () => {
    reset();
    panel.hidden = true;
    toggleButton.setAttribute('aria-expanded','false');
    toggleButton.textContent = '待ち時間を体験する';
  };
  // The measurement conditions sit outside the panel in the markup so they stay readable without
  // JavaScript; with JavaScript they move to the end of the experience panel.
  const conditions = root.querySelector('#bench-conditions');
  if (conditions) panel.append(conditions);
  toggleButton.disabled = false;
  toggleButton.addEventListener('click',() => {
    if (!panel.hidden) { closePanel(); return; }
    panel.hidden = false;
    toggleButton.setAttribute('aria-expanded','true');
    toggleButton.textContent = '体験を閉じる';
  });
  window.addEventListener('pagehide',closePanel);
  reset();
})();
