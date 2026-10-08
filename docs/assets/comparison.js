(() => {
  'use strict';
  const choices = document.getElementById('case-choices');
  const row = document.getElementById('method-videos');
  const status = document.getElementById('comparison-status');
  let cases = [], selected = -1, epoch = 0;
  const videos = () => [...row.querySelectorAll('video')];
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  function selectCase(index) {
    if (index === selected) return;
    epoch++; selected = index;
    videos().forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
    row.replaceChildren(); row.scrollLeft = 0;
    [...choices.children].forEach((b, i) => { b.setAttribute('aria-selected', String(i === index)); b.tabIndex = i === index ? 0 : -1; });
    const item = cases[index];
    document.getElementById('comparison-panel').setAttribute('aria-labelledby', `case-${item.id}`);
    document.getElementById('case-title').textContent = item.summary;
    document.getElementById('case-id').textContent = `${item.id} / ${item.videos.length} methods`;
    document.getElementById('case-prompt').textContent = item.prompt;
    status.textContent = 'Scroll right to see all methods.';
    item.videos.forEach(m => {
      const card = el('figure', `method-card${m.method === 'h3' ? ' ours-method' : ''}`);
      const caption = el('figcaption');
      caption.append(el('strong', '', m.label), el('span', '', m.conditioning));
      const video = document.createElement('video');
      video.controls = true; video.muted = true; video.playsInline = true;
      video.preload = 'none'; video.poster = m.poster; video.src = m.src;
      video.setAttribute('aria-label', `${item.title}: ${m.label}`);
      video.addEventListener('error', () => { status.textContent = `Unable to load ${m.label}. Please retry or open its video.`; });
      const link = el('a', 'video-open', 'Open video ↗'); link.href = m.src;
      card.append(caption, video, link); row.append(card);
    });
  }
  document.getElementById('play-all').addEventListener('click', async () => {
    const current = epoch;
    status.textContent = 'Loading videos…';
    const result = await Promise.allSettled(videos().map(v => v.play()));
    if (current !== epoch) return;
    status.textContent = result.some(r => r.status === 'rejected') ? 'Some videos need their individual play button.' : 'Playing. Loading and buffering may differ by method.';
  });
  document.getElementById('pause-all').addEventListener('click', () => { epoch++; videos().forEach(v => v.pause()); status.textContent = 'All videos paused.'; });
  document.getElementById('restart-all').addEventListener('click', () => { epoch++; videos().forEach(v => { v.pause(); if (v.readyState > 0) v.currentTime = 0; }); status.textContent = 'Reset to the beginning. Press Play all to start.'; });
  document.getElementById('previous-methods').addEventListener('click', () => row.scrollBy({left:-row.clientWidth * .85, behavior:'smooth'}));
  document.getElementById('next-methods').addEventListener('click', () => row.scrollBy({left:row.clientWidth * .85, behavior:'smooth'}));
  fetch('assets/comparison/cases.json').then(r => { if (!r.ok) throw new Error('manifest'); return r.json(); }).then(data => {
    if (data.cases.length !== 4) throw new Error('case count');
    cases = data.cases;
    cases.forEach((c, index) => {
      const button = el('button', 'case-choice'); button.type = 'button'; button.role = 'tab'; button.id = `case-${c.id}`;
      button.setAttribute('aria-controls', 'comparison-panel');
      const image = document.createElement('img'); image.src = c.firstFrame; image.alt = `${c.title}: task reference first frame`; image.loading = 'lazy';
      button.append(image, el('span', '', c.title), el('small', '', c.summary));
      button.addEventListener('click', () => selectCase(index));
      button.addEventListener('keydown', e => {
        let next;
        if (e.key === 'ArrowRight') next = (index + 1) % cases.length;
        if (e.key === 'ArrowLeft') next = (index + cases.length - 1) % cases.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = cases.length - 1;
        if (next !== undefined) { e.preventDefault(); selectCase(next); choices.children[next].focus(); }
      });
      choices.append(button);
    });
    selectCase(0);
  }).catch(() => { document.getElementById('case-title').textContent = 'Comparison videos could not be loaded.'; status.textContent = 'Please reload the page.'; });
})();
