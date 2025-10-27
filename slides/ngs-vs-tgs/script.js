(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const pageIndexEl = document.getElementById('pageIndex');
  const pageTotalEl = document.getElementById('pageTotal');
  const progressBar = document.getElementById('progressBar');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnToc = document.getElementById('btnToc');
  const tocOverlay = document.getElementById('tocOverlay');
  const btnCloseToc = document.getElementById('btnCloseToc');
  const tocList = document.getElementById('tocList');
  const btnHelp = document.getElementById('btnHelp');
  const btnHelp2 = document.getElementById('btnHelp2');
  const helpOverlay = document.getElementById('helpOverlay');
  const btnCloseHelp = document.getElementById('btnCloseHelp');
  const timerDisplay = document.getElementById('timerDisplay');
  const progressContainer = document.getElementById('progressContainer');
  const btnFull = document.getElementById('btnFull');
  const btnTheme = document.getElementById('btnTheme');
  const presenterOverlay = document.getElementById('presenterOverlay');
  const btnClosePresenter = document.getElementById('btnClosePresenter');
  const timerDisplay2 = document.getElementById('timerDisplay2');
  const btnTimerToggle = document.getElementById('btnTimerToggle');
  const btnTimerReset = document.getElementById('btnTimerReset');
  const presenterCurrent = document.getElementById('presenterCurrent');
  const presenterNext = document.getElementById('presenterNext');
  const presenterNotes = document.getElementById('presenterNotes');
  const btnLaser = document.getElementById('btnLaser');
  const btnDraw = document.getElementById('btnDraw');
  const inkCanvas = document.getElementById('inkCanvas');
  const laserDot = document.getElementById('laserDot');

  let current = 0;
  let currentStep = 0; // 当前页已揭示的要点数

  // 全局备注与计时器状态
  let notesVisible = false;
  let timerRunning = false;
  let elapsedSec = 0;
  let timerHandle = null;
  let autoHandle = null;
  let autoIntervalSec = 6; // 自动播放默认间隔
  const themes = ['default', 'theme-cyan', 'theme-violet', 'theme-amber'];
  let themeIndex = 0;
  // 批注与激光笔
  let drawingEnabled = false;
  let isDrawing = false;
  let ctx = null;
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let strokes = []; // { points: [{x,y}], width: number, color: string }
  let currentStroke = null;
  let laserEnabled = false;

  function formatTime(total) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  }

  function updateTimerDisplay() {
    const t = formatTime(elapsedSec);
    if (timerDisplay) timerDisplay.textContent = t;
    if (timerDisplay2) timerDisplay2.textContent = t;
  }

  function startTimer() {
    if (timerHandle) return;
    timerHandle = setInterval(() => {
      elapsedSec += 1;
      updateTimerDisplay();
    }, 1000);
    timerRunning = true;
    updateTimerDisplay();
    saveState();
  }

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
    timerRunning = false;
    saveState();
  }

  function resetTimer() {
    elapsedSec = 0;
    updateTimerDisplay();
    saveState();
  }

  // 自动播放
  function startAutoplay() {
    if (autoHandle) return;
    autoHandle = setInterval(() => {
      const before = current;
      nextStep();
      // 如果已在最后且没有 fragment 可展示，则停止
      if (before === current && current === slides.length - 1) {
        stopAutoplay();
      }
    }, autoIntervalSec * 1000);
  }
  function stopAutoplay() {
    if (autoHandle) clearInterval(autoHandle);
    autoHandle = null;
  }

  // 主题切换
  function applyTheme() {
    document.body.classList.remove('theme-cyan', 'theme-violet', 'theme-amber');
    const name = themes[themeIndex];
    if (name !== 'default') document.body.classList.add(name);
  }
  function cycleTheme() {
    themeIndex = (themeIndex + 1) % themes.length;
    applyTheme();
    saveState();
  }

  // 颜色获取（使用 CSS 变量 --accent）
  function getAccentColor() {
    const root = getComputedStyle(document.documentElement);
    const val = root.getPropertyValue('--accent').trim();
    return val || '#10b981';
  }

  // 批注画布
  function resizeCanvas() {
    if (!inkCanvas) return;
    dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    inkCanvas.width = Math.floor(w * dpr);
    inkCanvas.height = Math.floor(h * dpr);
    inkCanvas.style.width = w + 'px';
    inkCanvas.style.height = h + 'px';
    ctx = inkCanvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redrawStrokes();
    }
  }
  function redrawStrokes() {
    if (!ctx) return;
    ctx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    for (const s of strokes) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      for (let i = 0; i < s.points.length; i++) {
        const p = s.points[i];
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }
  function toggleDrawing() {
    drawingEnabled = !drawingEnabled;
    document.body.classList.toggle('drawing', drawingEnabled);
  }
  function clearDrawing() {
    strokes = [];
    if (ctx) ctx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
  }
  function pointerToCanvas(e) {
    return { x: e.clientX, y: e.clientY };
  }
  function handleCanvasPointerDown(e) {
    if (!drawingEnabled) return;
    e.preventDefault();
    isDrawing = true;
    inkCanvas.setPointerCapture && inkCanvas.setPointerCapture(e.pointerId);
    const p = pointerToCanvas(e);
    currentStroke = { points: [p], width: 3, color: getAccentColor() };
    strokes.push(currentStroke);
    redrawStrokes();
  }
  function handleCanvasPointerMove(e) {
    if (laserEnabled) {
      if (laserDot) { laserDot.style.left = e.clientX + 'px'; laserDot.style.top = e.clientY + 'px'; }
    }
    if (!isDrawing || !drawingEnabled) return;
    const p = pointerToCanvas(e);
    if (currentStroke) {
      currentStroke.points.push(p);
      // 增量绘制
      if (ctx) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = currentStroke.color; ctx.lineWidth = currentStroke.width;
        const pts = currentStroke.points;
        const n = pts.length;
        if (n >= 2) {
          ctx.beginPath();
          ctx.moveTo(pts[n - 2].x, pts[n - 2].y);
          ctx.lineTo(pts[n - 1].x, pts[n - 1].y);
          ctx.stroke();
        }
      }
    }
  }
  function handleCanvasPointerUp(e) {
    if (!drawingEnabled) return;
    isDrawing = false;
    currentStroke = null;
  }

  // 激光笔
  function toggleLaser() {
    laserEnabled = !laserEnabled;
    document.body.classList.toggle('laser', laserEnabled);
  }

  // 状态持久化
  function saveState() {
    try {
      const state = {
        page: current,
        step: currentStep,
        notesVisible,
        themeIndex,
        timer: { elapsedSec, running: timerRunning }
      };
      localStorage.setItem('slidesState', JSON.stringify(state));
    } catch (_) {}
  }
  function loadState() {
    try {
      const raw = localStorage.getItem('slidesState');
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return null;
      if (typeof s.notesVisible === 'boolean') {
        notesVisible = s.notesVisible;
        document.querySelectorAll('.notes').forEach(n => n.classList.toggle('hidden', !notesVisible));
      }
      if (typeof s.themeIndex === 'number') themeIndex = s.themeIndex;
      if (s.timer && typeof s.timer === 'object') {
        elapsedSec = Number(s.timer.elapsedSec) || 0;
        timerRunning = !!s.timer.running;
        updateTimerDisplay();
      }
      return s;
    } catch (_) { return null; }
  }

  // Hash: #/page/step
  function updateHash() {
    const newHash = `#/${current + 1}/${currentStep}`;
    if (location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  }
  function parsePageStepFromHash() {
    const m = location.hash.match(/^#\/(\d+)(?:\/(\d+))?/);
    if (!m) return { pageIndex: null, step: null };
    const pageIndex = Math.max(1, Math.min(slides.length, parseInt(m[1], 10))) - 1;
    const step = m[2] != null ? Math.max(0, parseInt(m[2], 10) || 0) : null;
    return { pageIndex, step };
  }
  function revealStep(step) {
    const s = slides[current];
    if (!s) return;
    const frags = Array.from(s.querySelectorAll('.fragment'));
    currentStep = Math.max(0, Math.min(frags.length, step || 0));
    frags.forEach((f, i) => {
      if (i < currentStep) f.classList.add('visible'); else f.classList.remove('visible');
    });
    updateHash();
    saveState();
  }

  // 演讲者视图
  function cloneForPresenter(slide) {
    const node = slide.cloneNode(true);
    node.classList.remove('slide', 'active');
    // 显示所有要点
    node.querySelectorAll('.fragment').forEach(f => f.classList.add('visible'));
    // 不显示内部 notes
    node.querySelectorAll('.notes').forEach(n => n.remove());
    return node.innerHTML;
  }
  function updatePresenter() {
    if (!presenterOverlay || presenterOverlay.classList.contains('hidden')) return;
    const currSlide = slides[current];
    const nextSlide = slides[current + 1];
    if (presenterCurrent) presenterCurrent.innerHTML = currSlide ? cloneForPresenter(currSlide) : '';
    if (presenterNext) presenterNext.innerHTML = nextSlide ? cloneForPresenter(nextSlide) : '<div class="text-slate-500">已到最后一页</div>';
    if (presenterNotes) {
      const notesEl = currSlide ? currSlide.querySelector('.notes') : null;
      presenterNotes.textContent = notesEl ? notesEl.textContent.trim() : '（无备注）';
    }
    updateTimerDisplay();
  }
  function showPresenter() {
    if (!presenterOverlay) return;
    presenterOverlay.classList.remove('hidden');
    updatePresenter();
  }
  function hidePresenter() {
    if (!presenterOverlay) return;
    presenterOverlay.classList.add('hidden');
  }
  function togglePresenter() {
    if (!presenterOverlay) return;
    presenterOverlay.classList.toggle('hidden');
    updatePresenter();
  }

  // 全屏切换
  function toggleFullScreen() {
    const doc = document;
    const el = doc.documentElement;
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if (req) req.call(el);
    } else {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
      if (exit) exit.call(doc);
    }
  }

  // 初始化页面总数
  pageTotalEl.textContent = String(slides.length);

  // 构建目录
  slides.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = 'px-5 py-3 hover:bg-slate-800 cursor-pointer flex items-center gap-4';
    const title = s.getAttribute('data-title') || `第 ${i + 1} 页`;
    li.innerHTML = `<span class="text-slate-400 w-10">${i + 1}</span><span class="text-slate-100">${title}</span>`;
    li.addEventListener('click', () => {
      hideToc();
      goTo(i);
    });
    tocList.appendChild(li);
  });

  // 从 hash 读取初始页
  function parseHash() {
    const m = location.hash.match(/#\/(\d+)/);
    if (m) {
      const idx = Math.max(1, Math.min(slides.length, parseInt(m[1], 10)));
      return idx - 1;
    }
    return 0;
  }

  // 展示 slide
  function showSlide(index) {
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
      if (i === index) {
        // 重置 fragments 可见性
        s.querySelectorAll('.fragment').forEach(f => f.classList.remove('visible'));
        // 同步备注显示状态
        s.querySelectorAll('.notes').forEach(n => n.classList.toggle('hidden', !notesVisible));
      }
    });

    current = index;
    currentStep = 0;
    pageIndexEl.textContent = String(index + 1);
    progressBar.style.width = `${((index + 1) / slides.length) * 100}%`;

    // 更新 hash + 保存状态
    updateHash();
    saveState();
    // 若演讲者视图打开，同步内容
    updatePresenter();
  }

  function nextStep() {
    const s = slides[current];
    const frags = Array.from(s.querySelectorAll('.fragment'));
    const nextHidden = frags.find(f => !f.classList.contains('visible'));
    if (nextHidden) {
      nextHidden.classList.add('visible');
      currentStep = Math.min(frags.length, currentStep + 1);
      updateHash();
      saveState();
      return;
    }
    // 没有可揭示 fragment，进入下一页
    if (current < slides.length - 1) {
      goTo(current + 1);
    }
  }

  function prevStep() {
    const s = slides[current];
    const frags = Array.from(s.querySelectorAll('.fragment'));
    const lastShown = [...frags].reverse().find(f => f.classList.contains('visible'));
    if (lastShown) {
      lastShown.classList.remove('visible');
      currentStep = Math.max(0, currentStep - 1);
      updateHash();
      saveState();
      return;
    }
    if (current > 0) {
      const prevFragCount = slides[current - 1].querySelectorAll('.fragment').length;
      goTo(current - 1);
      revealStep(prevFragCount);
    }
  }

  function goTo(index) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    showSlide(index);
  }

  // 进度条点击跳转
  if (progressContainer) {
    progressContainer.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const idx = Math.floor(ratio * slides.length);
      goTo(idx);
    });
  }

  // 目录显示/隐藏
  function showToc() {
    tocOverlay.classList.remove('hidden');
  }
  function hideToc() {
    tocOverlay.classList.add('hidden');
  }
  function toggleToc() {
    tocOverlay.classList.toggle('hidden');
  }

  // 帮助显示/隐藏
  function showHelp() {
    if (helpOverlay) helpOverlay.classList.remove('hidden');
  }
  function hideHelp() {
    if (helpOverlay) helpOverlay.classList.add('hidden');
  }
  function toggleHelp() {
    if (!helpOverlay) return;
    helpOverlay.classList.toggle('hidden');
  }

  function isOverlayOpen() {
    const tocOpen = tocOverlay && !tocOverlay.classList.contains('hidden');
    const helpOpen = helpOverlay && !helpOverlay.classList.contains('hidden');
    const presenterOpen = presenterOverlay && !presenterOverlay.classList.contains('hidden');
    return tocOpen || helpOpen || presenterOpen;
  }

  // 备注切换（当前页）
  function toggleNotes() {
    notesVisible = !notesVisible;
    document.querySelectorAll('.notes').forEach(n => n.classList.toggle('hidden', !notesVisible));
    saveState();
  }

  // 事件绑定
  btnPrev.addEventListener('click', prevStep);
  btnNext.addEventListener('click', nextStep);
  btnToc.addEventListener('click', toggleToc);
  btnCloseToc.addEventListener('click', hideToc);
  tocOverlay.addEventListener('click', (e) => {
    // 点击遮罩关闭
    if (e.target === tocOverlay) hideToc();
  });
  if (btnHelp) btnHelp.addEventListener('click', toggleHelp);
  if (btnHelp2) btnHelp2.addEventListener('click', toggleHelp);
  if (btnCloseHelp) btnCloseHelp.addEventListener('click', hideHelp);
  if (helpOverlay) helpOverlay.addEventListener('click', (e) => {
    if (e.target === helpOverlay) hideHelp();
  });
  if (btnFull) btnFull.addEventListener('click', toggleFullScreen);
  if (btnTheme) btnTheme.addEventListener('click', cycleTheme);
  if (btnClosePresenter) btnClosePresenter.addEventListener('click', hidePresenter);
  if (presenterOverlay) presenterOverlay.addEventListener('click', (e) => {
    if (e.target === presenterOverlay) hidePresenter();
  });
  if (btnTimerToggle) btnTimerToggle.addEventListener('click', () => { if (timerRunning) stopTimer(); else startTimer(); updatePresenter(); });
  if (btnTimerReset) btnTimerReset.addEventListener('click', () => { resetTimer(); updatePresenter(); });
  if (btnDraw) btnDraw.addEventListener('click', toggleDrawing);
  if (btnLaser) btnLaser.addEventListener('click', toggleLaser);
  if (inkCanvas) {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    inkCanvas.addEventListener('pointerdown', handleCanvasPointerDown);
    window.addEventListener('pointermove', handleCanvasPointerMove, { passive: true });
    window.addEventListener('pointerup', handleCanvasPointerUp, { passive: true });
  }

  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    const key = e.key;
    if (isOverlayOpen()) {
      if (key === 'Escape') { hideToc(); hideHelp(); e.preventDefault(); }
      else if (key === 'm' || key === 'M') { toggleToc(); e.preventDefault(); }
      else if (key === 'h' || key === 'H' || key === '?') { toggleHelp(); e.preventDefault(); }
      return;
    }
    switch (key) {
      case 'ArrowRight':
      case 'PageDown':
      case 'Enter':
      case ' ': // 空格
        e.preventDefault();
        nextStep();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        prevStep();
        break;
      case 'm':
      case 'M':
        toggleToc();
        break;
      case 'n':
      case 'N':
        toggleNotes();
        break;
      case 'h':
      case 'H':
      case '?':
        toggleHelp();
        break;
      case 'f':
      case 'F':
        toggleFullScreen();
        break;
      case 'l':
      case 'L':
        cycleTheme();
        break;
      case 'v':
      case 'V':
        togglePresenter();
        break;
      case 'p':
      case 'P':
        window.print();
        break;
      case 'g':
      case 'G': {
        const input = prompt(`跳转到页码 (1-${slides.length})`, String(current + 1));
        if (input) {
          const n = parseInt(input, 10);
          if (!isNaN(n) && n >= 1 && n <= slides.length) {
            goTo(n - 1);
          }
        }
        break; }
      case 'c':
      case 'C': {
        const url = new URL(window.location.href);
        url.hash = `#/${current + 1}/${currentStep}`;
        const text = url.toString();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {
            try { prompt('复制以下链接：Ctrl+C 后回车', text); } catch (_) {}
          });
        } else {
          try { prompt('复制以下链接：Ctrl+C 后回车', text); } catch (_) {}
        }
        break; }
      case 's': {
        const s = slides[current];
        s.querySelectorAll('.fragment').forEach(f => f.classList.add('visible'));
        currentStep = s.querySelectorAll('.fragment').length;
        updateHash();
        saveState();
        break; }
      case 'S': {
        const s = slides[current];
        s.querySelectorAll('.fragment').forEach(f => f.classList.remove('visible'));
        currentStep = 0;
        updateHash();
        saveState();
        break; }
      case 't':
      case 'T':
        if (timerRunning) stopTimer(); else startTimer();
        break;
      case 'r':
      case 'R':
        resetTimer();
        break;
      case 'a':
      case 'A': {
        if (e.shiftKey) {
          const input = prompt('设置自动播放间隔（秒）', String(autoIntervalSec));
          if (input) {
            const sec = parseInt(input, 10);
            if (!isNaN(sec) && sec > 0) {
              autoIntervalSec = sec;
              if (autoHandle) { stopAutoplay(); startAutoplay(); }
            }
          }
        } else {
          if (autoHandle) stopAutoplay(); else startAutoplay();
        }
        break; }
      case 'd':
      case 'D':
        toggleDrawing();
        break;
      case 'x':
      case 'X':
        clearDrawing();
        break;
      case 'z':
      case 'Z':
        toggleLaser();
        break;
      case 'Escape':
        if (isOverlayOpen()) { hideToc(); hideHelp(); }
        hidePresenter();
        break;
      case 'Home':
        goTo(0);
        break;
      case 'End':
        goTo(slides.length - 1);
        break;
      default:
        break;
    }
  });

  // 触摸手势：左右滑动切换
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;
  const SWIPE_THRESHOLD = 50; // px
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    touchActive = true;
    touchStartX = e.clientX;
    touchStartY = e.clientY;
  }, { passive: true });
  window.addEventListener('pointerup', (e) => {
    if (!touchActive || e.pointerType !== 'touch') return;
    touchActive = false;
    const dx = e.clientX - touchStartX;
    const dy = e.clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) {
        nextStep();
      } else {
        prevStep();
      }
    }
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    const { pageIndex, step } = parsePageStepFromHash();
    if (pageIndex != null) {
      goTo(pageIndex);
      if (typeof step === 'number') revealStep(step);
    }
  });

  // 初始化：优先使用 URL 中的页与步，否则使用本地状态
  const state = loadState();
  applyTheme();
  const parsed = parsePageStepFromHash();
  let initPage = parsed.pageIndex != null ? parsed.pageIndex : (state && typeof state.page === 'number' ? state.page : 0);
  let initStep = parsed.step != null ? parsed.step : (state && typeof state.step === 'number' ? state.step : 0);
  goTo(initPage);
  if (initStep) revealStep(initStep);
  // 初始化计时器
  if (!state) { startTimer(); }
  else { if (timerRunning) startTimer(); else updateTimerDisplay(); }
})();
