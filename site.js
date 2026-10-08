(() => {
  const mechanism = document.getElementById('mechanism-video');
  const playback = document.getElementById('playback-toggle');
  const fullscreen = document.getElementById('fullscreen-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let manuallyPaused = reducedMotion.matches;
  const updatePlayback = () => {
    playback.textContent = mechanism.paused ? 'Play animation' : 'Pause animation';
  };
  mechanism.addEventListener('play', updatePlayback);
  mechanism.addEventListener('pause', updatePlayback);
  playback.addEventListener('click', async () => {
    if (mechanism.paused) {
      manuallyPaused = false;
      try { await mechanism.play(); } catch { updatePlayback(); }
    } else {
      manuallyPaused = true;
      mechanism.pause();
    }
  });
  fullscreen.addEventListener('click', async () => {
    try {
      if (mechanism.requestFullscreen) await mechanism.requestFullscreen();
      else if (mechanism.webkitEnterFullscreen) mechanism.webkitEnterFullscreen();
    } catch { /* The video remains available in the page. */ }
  });
  if (!mechanism.requestFullscreen && !mechanism.webkitEnterFullscreen) fullscreen.hidden = true;
  if (reducedMotion.matches) mechanism.pause();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !manuallyPaused) mechanism.play().catch(updatePlayback);
      else mechanism.pause();
    }, { threshold: 0.2 }).observe(mechanism);
  }
  updatePlayback();

  const speed = document.getElementById('speed-video');
  const cover = document.getElementById('speed-play');
  const status = document.getElementById('speed-status');
  speed.controls = false;
  cover.addEventListener('click', () => {
    // Keep play() inside the user gesture so mobile browsers allow sound.
    speed.muted = false;
    speed.volume = 1;
    speed.controls = true;
    status.hidden = true;
    cover.hidden = true;
    speed.play().then(() => speed.focus({preventScroll: true})).catch(() => {
      cover.hidden = false;
      speed.controls = false;
      status.textContent = 'Unable to play the video. Please try again.';
      status.hidden = false;
    });
  });
  speed.addEventListener('error', () => {
    cover.hidden = false;
    status.textContent = 'Video unavailable. Please reload.';
    status.hidden = false;
  });
})();

const hardwareResults = [{"hardware": "GB300", "rows": [{"label": "Diffuplex", "tps": 1872, "precision": "ours"}, {"label": "Phi-4", "tps": 481.7, "precision": "FP8"}, {"label": "N3-Omni", "tps": 393.6, "precision": "FP8"}, {"label": "Qwen2-A", "tps": 344.2, "precision": "FP8"}, {"label": "BR-Voice", "tps": 327.3, "precision": "BF16"}, {"label": "Q3-Omni", "tps": 300.5, "precision": "FP8"}, {"label": "Kimi", "tps": 293.3, "precision": "BF16"}, {"label": "MiniCPM-o", "tps": 289.2, "precision": "BF16"}, {"label": "Baichuan-1.5", "tps": 281.3, "precision": "BF16"}, {"label": "LFG-1", "tps": 254.2, "precision": "BF16"}, {"label": "GLM4-V", "tps": 214, "precision": "BF16"}, {"label": "DIFFA-2", "tps": 101, "precision": "BF16"}, {"label": "LFG-3", "tps": 74, "precision": "BF16"}]}, {"hardware": "H100", "rows": [{"label": "Diffuplex", "tps": 1045, "precision": "ours"}, {"label": "Phi-4", "tps": 343.7, "precision": "FP8"}, {"label": "N3-Omni", "tps": 332.7, "precision": "FP8"}, {"label": "Qwen2-A", "tps": 228.4, "precision": "FP8"}, {"label": "MiniCPM-o 4.5", "tps": 218, "precision": "FP8"}, {"label": "BR-Voice", "tps": 206.7, "precision": "BF16"}, {"label": "Q3-Omni", "tps": 206.5, "precision": "BF16"}, {"label": "LFG-1", "tps": 204.4, "precision": "BF16"}, {"label": "Kimi", "tps": 173.2, "precision": "BF16"}, {"label": "MiniCPM-o 2.6", "tps": 167.2, "precision": "BF16"}, {"label": "Baichuan-1.5", "tps": 165.6, "precision": "BF16"}, {"label": "GLM4-V", "tps": 134.5, "precision": "BF16"}, {"label": "LFG-3", "tps": 41.7, "precision": "BF16"}]}, {"hardware": "RTX 6000", "rows": [{"label": "Diffuplex", "tps": 473.2, "precision": "ours"}, {"label": "N3-Omni", "tps": 192, "precision": "BF16"}, {"label": "Q3-Omni", "tps": 147, "precision": "BF16"}, {"label": "Phi-4", "tps": 105, "precision": "BF16"}, {"label": "Qwen2-A", "tps": 100, "precision": "BF16"}, {"label": "Kimi", "tps": 96, "precision": "BF16"}, {"label": "GLM4-V", "tps": 78, "precision": "BF16"}, {"label": "DIFFA-2", "tps": 31, "precision": "BF16"}, {"label": "LFG-3", "tps": 17, "precision": "BF16"}]}];
(() => {
 const tabs = Array.from(document.querySelectorAll('[data-hardware]'));
 const bars = document.getElementById('hardware-bars');
 const panel = document.getElementById('hardware-panel');
 const note = document.getElementById('hardware-note');
 const format = value => value.toLocaleString('en-US', {maximumFractionDigits: 1});
 const notes = {'GB300':'Diffuplex: 1,872 tokens/s on average. Optimized BF16 DIFFA-2: 101 tokens/s.', 'H100':'Diffuplex uses the final r9s GRIT configuration with FP8 dense layers and experts.', 'RTX 6000':'RTX PRO 6000 Blackwell. Diffuplex throughput is calculated as 364 × 1.3 = 473.2 tokens/s; baselines use BF16.'};
 function select(tab) {
  tabs.forEach(t => {t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1;});
  const data = hardwareResults.find(p => p.hardware === tab.dataset.hardware);
  panel.setAttribute('aria-labelledby',tab.id);
  const max = Math.max(...data.rows.map(r => r.tps));
  bars.replaceChildren(...data.rows.map(row => {
   const el = document.createElement('div'); el.className = 'hw-row '+row.precision.toLowerCase();
   const name = document.createElement('span'); name.className = 'hw-model'; name.textContent = row.label;
   if(row.precision !== 'ours') {const badge = document.createElement('small'); badge.textContent=row.precision; name.append(badge);}
   const track = document.createElement('div'); track.className='hw-track';
   const fill = document.createElement('div'); fill.className='hw-fill';fill.style.setProperty('--width', (row.tps/max*100)+'%');track.append(fill);
   const value = document.createElement('span');value.className='hw-value';value.textContent=format(row.tps);
   el.setAttribute('aria-label',row.label+': '+format(row.tps)+' decode tokens per second'+(row.precision==='ours'?'':', '+row.precision));
   el.append(name,track,value);return el;
  }));
  note.textContent=notes[data.hardware];
 }
 tabs.forEach((tab,index) => {
  tab.addEventListener('click',() => select(tab));
  tab.addEventListener('keydown',e => {
   let next;
   if(e.key==='ArrowRight') next=(index+1)%tabs.length;
   if(e.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
   if(e.key==='Home') next=0;
   if(e.key==='End') next=tabs.length-1;
   if(next!==undefined){e.preventDefault();select(tabs[next]);tabs[next].focus();}
  });
 });select(tabs[0]);
})();
