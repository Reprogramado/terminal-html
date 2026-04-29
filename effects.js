/* =========================================================
   EFFECTS — particles, glitch, matrix rain, scan, viz
   ========================================================= */

(function () {
  const root = document.documentElement;

  /* respeitar prefers-reduced-motion / dispositivos fracos */
  const REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* cache de cores do tema — invalidado quando o tema muda (chame window.refreshThemeColors) */
  let themeCache = null;
  function readThemeColors() {
    const styles = getComputedStyle(root);
    themeCache = {
      n1: styles.getPropertyValue('--neon-1').trim() || '#ff2bd6',
      n2: styles.getPropertyValue('--neon-2').trim() || '#00f0ff',
      n3: styles.getPropertyValue('--neon-3').trim() || '#b07bff',
      ink: styles.getPropertyValue('--ink').trim() || '#e8e0ff',
      warn: styles.getPropertyValue('--warn').trim() || '#ffd24a',
      hot: styles.getPropertyValue('--hot').trim() || '#ff5470',
    };
    return themeCache;
  }
  readThemeColors();
  window.refreshThemeColors = readThemeColors;

  /* ---------- BACKGROUND PARTICLES (ambient drifting dots) ---------- */
  const bgCanvas = document.getElementById('bg-particles');
  const bgCtx = bgCanvas.getContext('2d', { alpha: true });
  let bgParticles = [];
  let burstParticles = [];
  let bgRunning = true;

  function resizeBg() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    bgCanvas.width = window.innerWidth * dpr;
    bgCanvas.height = window.innerHeight * dpr;
    bgCanvas.style.width = window.innerWidth + 'px';
    bgCanvas.style.height = window.innerHeight + 'px';
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeBg);
  resizeBg();

  function pickColor() {
    const t = themeCache || readThemeColors();
    const palette = [t.n1, t.n2, t.n3];
    return palette[(Math.random() * palette.length) | 0];
  }

  function spawnAmbient() {
    bgParticles = [];
    if (REDUCED) return; // nada de partículas em modo reduzido
    /* contagem reduzida: 40 max e densidade menor */
    const count = Math.min(40, Math.floor((window.innerWidth * window.innerHeight) / 45000));
    for (let i = 0; i < count; i++) {
      bgParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.08 - Math.random() * 0.15,
        r: Math.random() * 1.4 + 0.3,
        c: pickColor(),
        a: Math.random() * 0.5 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }
  spawnAmbient();
  window.addEventListener('resize', spawnAmbient);

  /* ---------- BURST PARTICLES (command-triggered) ---------- */
  window.spawnBurst = function (opts = {}) {
    const cx = opts.x ?? window.innerWidth / 2;
    const cy = opts.y ?? window.innerHeight / 2;
    const count = opts.count ?? 80;
    const palette = opts.palette ?? null;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1.2;
      burstParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 2.5 + 0.5,
        c: palette ? palette[Math.floor(Math.random() * palette.length)] : pickColor(),
        life: 1,
        decay: 0.012 + Math.random() * 0.015,
      });
    }
  };

  /* tick: limita a ~40fps, agrupa partículas por cor pra cortar troca de estado,
     usa globalCompositeOperation 'lighter' pra fingir glow sem shadowBlur por partícula
     (shadowBlur por shape é uma das operações mais caras do canvas). */
  let lastTick = 0;
  const FRAME_BUDGET = 1000 / 40;

  function drawParticles(now) {
    if (!bgRunning) return;
    if (now - lastTick < FRAME_BUDGET) {
      requestAnimationFrame(drawParticles);
      return;
    }
    lastTick = now;

    const W = window.innerWidth, H = window.innerHeight;
    bgCtx.clearRect(0, 0, W, H);
    bgCtx.globalCompositeOperation = 'lighter';

    // ambient — sem shadowBlur por partícula
    let lastColor = null;
    for (let i = 0; i < bgParticles.length; i++) {
      const p = bgParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.twinkle += 0.04;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      else if (p.x > W + 10) p.x = -10;
      bgCtx.globalAlpha = (Math.sin(p.twinkle) * 0.3 + 0.7) * p.a;
      if (p.c !== lastColor) { bgCtx.fillStyle = p.c; lastColor = p.c; }
      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      bgCtx.fill();
    }

    // bursts (curtos, podem manter sutil shadowBlur)
    if (burstParticles.length) {
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const p = burstParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.99;
        p.life -= p.decay;
        if (p.life <= 0) { burstParticles.splice(i, 1); continue; }
        bgCtx.globalAlpha = p.life;
        bgCtx.fillStyle = p.c;
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        bgCtx.fill();
      }
    }

    bgCtx.globalCompositeOperation = 'source-over';
    bgCtx.globalAlpha = 1;
    requestAnimationFrame(drawParticles);
  }
  if (!REDUCED) requestAnimationFrame(drawParticles);

  /* pausar quando aba inativa */
  document.addEventListener('visibilitychange', () => {
    bgRunning = !document.hidden;
    if (bgRunning && !REDUCED) requestAnimationFrame(drawParticles);
  });

  /* ---------- GLITCH ---------- */
  let glitchTimer = null;
  window.triggerGlitch = function (durationMs = 400) {
    document.body.classList.add('glitching');
    // random horizontal slice
    const holo = document.querySelector('.holo');
    if (holo) {
      for (let i = 0; i < 3; i++) {
        const slice = document.createElement('div');
        slice.className = 'glitch-slice';
        const top = Math.random() * 100;
        const h = Math.random() * 12 + 2;
        slice.style.top = top + '%';
        slice.style.height = h + '%';
        const c = ['#ff00aa', '#00f0ff', '#b07bff'][i % 3];
        slice.style.background = `linear-gradient(90deg, transparent, ${c}55, transparent)`;
        slice.style.opacity = '0.7';
        slice.style.transform = `translateX(${(Math.random() - 0.5) * 30}px)`;
        holo.appendChild(slice);
        setTimeout(() => slice.remove(), durationMs - 50);
      }
    }
    clearTimeout(glitchTimer);
    glitchTimer = setTimeout(() => {
      document.body.classList.remove('glitching');
    }, durationMs);
  };

  /* ambient glitch — random tiny bursts when toggled */
  let ambientGlitchOn = false;
  let ambientGlitchTimer = null;
  function scheduleAmbient() {
    if (!ambientGlitchOn) return;
    const wait = 2200 + Math.random() * 4500;
    ambientGlitchTimer = setTimeout(() => {
      window.triggerGlitch(180 + Math.random() * 250);
      scheduleAmbient();
    }, wait);
  }
  window.setAmbientGlitch = function (on) {
    ambientGlitchOn = on;
    clearTimeout(ambientGlitchTimer);
    if (on) scheduleAmbient();
  };

  /* ---------- SCREEN SHAKE ---------- */
  window.screenShake = function () {
    const holo = document.querySelector('.holo');
    if (!holo) return;
    holo.classList.remove('shake');
    void holo.offsetWidth;
    holo.classList.add('shake');
    setTimeout(() => holo.classList.remove('shake'), 450);
  };

  /* ---------- MATRIX RAIN ---------- */
  const mxOverlay = document.getElementById('matrix-overlay');
  const mxCanvas = document.getElementById('matrix-canvas');
  const mxCtx = mxCanvas.getContext('2d');
  let mxRAF = null;
  let mxColumns = [];

  function resizeMatrix() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mxCanvas.width = window.innerWidth * dpr;
    mxCanvas.height = window.innerHeight * dpr;
    mxCanvas.style.width = window.innerWidth + 'px';
    mxCanvas.style.height = window.innerHeight + 'px';
    mxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fontSize = 16;
    const cols = Math.ceil(window.innerWidth / fontSize);
    mxColumns = new Array(cols).fill(0).map(() => Math.random() * -100);
  }
  window.addEventListener('resize', resizeMatrix);

  const mxChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/$#@%&';

  /* throttle do matrix pra ~30fps + sem shadowBlur por caractere
     (cores são lidas uma vez ao iniciar, não por frame) */
  let mxLast = 0;
  let mxColors = { main: '#4dffb0', head: '#e8e0ff' };
  const MX_BUDGET = 1000 / 30;

  function mxFrame(now) {
    if (now - mxLast < MX_BUDGET) {
      mxRAF = requestAnimationFrame(mxFrame);
      return;
    }
    mxLast = now;

    const fontSize = 16;
    const W = window.innerWidth, H = window.innerHeight;
    mxCtx.fillStyle = 'rgba(2, 8, 10, 0.10)';
    mxCtx.fillRect(0, 0, W, H);
    mxCtx.font = `${fontSize}px JetBrains Mono, monospace`;

    // primeira passada: trilhas (todas mesma cor — uma única troca de fillStyle)
    mxCtx.fillStyle = mxColors.main;
    for (let i = 0; i < mxColumns.length; i++) {
      const ch = mxChars.charAt((Math.random() * mxChars.length) | 0);
      const y = mxColumns[i] * fontSize;
      mxCtx.fillText(ch, i * fontSize, y - fontSize);
    }
    // segunda passada: cabeças brilhantes (uma cor)
    mxCtx.fillStyle = mxColors.head;
    for (let i = 0; i < mxColumns.length; i++) {
      const ch = mxChars.charAt((Math.random() * mxChars.length) | 0);
      const y = mxColumns[i] * fontSize;
      mxCtx.fillText(ch, i * fontSize, y);
      if (y > H && Math.random() > 0.975) mxColumns[i] = 0;
      mxColumns[i] += 0.6 + Math.random() * 0.6;
    }
    mxRAF = requestAnimationFrame(mxFrame);
  }

  window.startMatrix = function () {
    resizeMatrix();
    mxOverlay.classList.add('on');
    mxCtx.fillStyle = 'rgba(2, 8, 10, 1)';
    mxCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    /* lê cores do tema só ao iniciar, não a cada frame */
    const t = themeCache || readThemeColors();
    mxColors.main = t.n2 || '#4dffb0';
    mxColors.head = t.ink || '#e8e0ff';
    cancelAnimationFrame(mxRAF);
    mxLast = 0;
    mxRAF = requestAnimationFrame(mxFrame);
  };
  window.stopMatrix = function () {
    mxOverlay.classList.remove('on');
    cancelAnimationFrame(mxRAF);
    mxRAF = null;
  };
  mxOverlay.addEventListener('click', () => window.stopMatrix());

  /* ---------- SCAN VIZ — animated network nodes ---------- */
  window.renderScan = function (container) {
    const wrap = document.createElement('div');
    wrap.className = 'viz-wrap';
    wrap.innerHTML = `
      <div class="viz-title">
        <span><span class="violet">▚</span> NEXUS-NET · varredura ativa</span>
        <span class="dim"><span class="live-dot"></span> live</span>
      </div>
      <canvas class="scan-canvas" width="800" height="200"></canvas>
      <div class="dim" style="font-size:11px;margin-top:8px;display:flex;justify-content:space-between">
        <span><span class="ok">●</span> seguros · <span class="violet">●</span> sondando · <span class="warn">●</span> alerta</span>
        <span class="scan-status">aguardando…</span>
      </div>
    `;
    container.appendChild(wrap);
    const c = wrap.querySelector('canvas');
    const ctx = c.getContext('2d');
    const status = wrap.querySelector('.scan-status');
    const t = themeCache || readThemeColors();
    const colors = { ok: t.n2, probe: t.n3, warn: t.warn, hot: t.hot };

    const W = 800, H = 200;
    const nodes = [];
    const N = 22;
    for (let i = 0; i < N; i++) {
      nodes.push({
        x: 40 + Math.random() * (W - 80),
        y: 30 + Math.random() * (H - 60),
        r: 2.5 + Math.random() * 2.5,
        state: 'idle',
        pulse: 0,
        label: 'NX-' + (Math.random().toString(36).slice(2, 5).toUpperCase()),
      });
    }
    // edges (nearest neighbors)
    const edges = [];
    for (let i = 0; i < N; i++) {
      const dists = nodes.map((n, j) => ({ j, d: Math.hypot(nodes[i].x - n.x, nodes[i].y - n.y) }))
        .filter(o => o.j !== i).sort((a, b) => a.d - b.d).slice(0, 2);
      for (const o of dists) edges.push([i, o.j]);
    }

    let scanIdx = 0;
    let stopped = false;
    let raf;

    function frame() {
      ctx.clearRect(0, 0, W, H);
      // edges
      for (const [a, b] of edges) {
        const na = nodes[a], nb = nodes[b];
        const active = (na.state !== 'idle' && nb.state !== 'idle');
        ctx.strokeStyle = active ? colors.probe + 'cc' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = active ? 1.2 : 0.6;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      }
      // nodes
      for (const n of nodes) {
        const c =
          n.state === 'ok' ? colors.ok :
          n.state === 'probe' ? colors.probe :
          n.state === 'warn' ? colors.warn :
          'rgba(255,255,255,0.18)';
        n.pulse *= 0.94;
        if (n.pulse > 0.05) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + n.pulse * 14, 0, Math.PI * 2);
          ctx.strokeStyle = c + '88';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.fillStyle = c;
        ctx.shadowBlur = n.state === 'idle' ? 0 : 10;
        ctx.shadowColor = c;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      if (!stopped) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // step the scan
    const steps = [];
    const order = [...nodes.keys()].sort(() => Math.random() - 0.5);
    let i = 0;
    function step() {
      if (i >= order.length) {
        status.textContent = 'varredura completa · 0 ameaças';
        setTimeout(() => { stopped = true; cancelAnimationFrame(raf); }, 1200);
        return;
      }
      const idx = order[i++];
      const n = nodes[idx];
      n.state = 'probe';
      n.pulse = 1;
      status.innerHTML = `sondando <span class="violet">${n.label}</span>… ${i}/${order.length}`;
      setTimeout(() => {
        const r = Math.random();
        n.state = r > 0.94 ? 'warn' : 'ok';
        n.pulse = 1;
        step();
      }, 90 + Math.random() * 120);
    }
    setTimeout(step, 200);
  };

  /* ---------- VIZ — animated bars + sparkline ---------- */
  window.renderViz = function (container) {
    const wrap = document.createElement('div');
    wrap.className = 'viz-wrap';
    wrap.innerHTML = `
      <div class="viz-title">
        <span><span class="violet">▚</span> TELEMETRIA · sistema</span>
        <span class="dim"><span class="live-dot"></span> live</span>
      </div>
      <div class="bars"></div>
      <div class="viz-title" style="margin-top:14px">
        <span><span class="violet">▚</span> THROUGHPUT · 60s</span>
        <span class="dim accent">2.4 Gb/s</span>
      </div>
      <div class="spark-row"></div>
    `;
    container.appendChild(wrap);

    const metrics = [
      { label: 'CPU',     val: 0, target: 34 },
      { label: 'GPU',     val: 0, target: 71 },
      { label: 'MEMÓRIA', val: 0, target: 52 },
      { label: 'I/O',     val: 0, target: 88 },
      { label: 'NEURAL',  val: 0, target: 96 },
    ];
    const bars = wrap.querySelector('.bars');
    metrics.forEach(m => {
      const row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML = `<span class="label">${m.label}</span><div class="bar-track"><div class="bar-fill" style="width:0%"></div></div><span class="num">0%</span>`;
      bars.appendChild(row);
      m.row = row;
    });

    let progress = 0;
    const animBars = setInterval(() => {
      progress += 0.04;
      let allDone = true;
      for (const m of metrics) {
        const target = m.target;
        m.val += (target - m.val) * 0.12;
        if (Math.abs(target - m.val) > 0.5) allDone = false;
        const f = m.row.querySelector('.bar-fill');
        const n = m.row.querySelector('.num');
        f.style.width = m.val.toFixed(1) + '%';
        n.textContent = Math.round(m.val) + '%';
      }
      if (allDone && progress > 1) clearInterval(animBars);
    }, 40);

    // sparkline
    const spark = wrap.querySelector('.spark-row');
    const SPK = 60;
    const data = Array.from({ length: SPK }, () => 20 + Math.random() * 40);
    for (let i = 0; i < SPK; i++) {
      const b = document.createElement('div');
      b.className = 'spark-bar';
      b.style.height = '2px';
      spark.appendChild(b);
    }
    const bs = spark.querySelectorAll('.spark-bar');
    let frame = 0;
    const sparkInt = setInterval(() => {
      data.shift();
      data.push(15 + Math.random() * 75);
      bs.forEach((b, i) => { b.style.height = data[i] + '%'; });
      frame++;
      if (frame > 200) clearInterval(sparkInt);
    }, 120);
  };

  /* ---------- ASCII LOGO ---------- */
  window.NEXUS_BANNER = String.raw`
 ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
 ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
 ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
 ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
 ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
 ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝`;
})();
