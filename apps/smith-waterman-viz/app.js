(function(){
  const Core = (()=>{ try { return window.DPCore; } catch(_){ return null; } })();
  const els = {
    seqA: document.getElementById('seqA'),
    seqB: document.getElementById('seqB'),
    scoreMatch: document.getElementById('scoreMatch'),
    scoreMismatch: document.getElementById('scoreMismatch'),
    scoreGap: document.getElementById('scoreGap'),
    buildBtn: document.getElementById('buildBtn'),
    playBtn: document.getElementById('playBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    stepBtn: document.getElementById('stepBtn'),
    resetBtn: document.getElementById('resetBtn'),
    mode: document.getElementById('mode'),
    logPanel: document.getElementById('logPanel'),
    dpCanvas: document.getElementById('dpCanvas'),
    inputPanel: document.getElementById('inputPanel'),
    outputPanel: document.getElementById('outputPanel'),
  };

  const state = {
    a: 'GATTACA', b: 'GCATGCU',
    match: 2, mismatch: -1, gap: -1,
    mode: 'sw',
    S: [], T: [], rows: 0, cols: 0,
    steps: [], stepIdx: 0, playing: false, timer: null
  };

  function sanitize(s){ return (s||'').toUpperCase().replace(/[^A-Z]/g,''); }
  function log(msg){ const d = document.createElement('div'); d.textContent = msg; els.logPanel.appendChild(d); els.logPanel.scrollTop = els.logPanel.scrollHeight; }

  function initFromUI(){
    state.a = sanitize(els.seqA.value); state.b = sanitize(els.seqB.value);
    state.match = parseInt(els.scoreMatch.value||state.match);
    state.mismatch = parseInt(els.scoreMismatch.value||state.mismatch);
    state.gap = parseInt(els.scoreGap.value||state.gap);
    state.mode = els.mode.value;
  }

  function buildMatrix(){
    initFromUI(); els.logPanel.textContent = '';
    const dp = (Core && Core.buildDP) ? Core.buildDP(state.a, state.b, { match: state.match, mismatch: state.mismatch, gap: state.gap, mode: state.mode }) : null;
    if(dp){ state.rows = dp.rows; state.cols = dp.cols; state.S = dp.S; state.T = dp.T; state.steps = dp.steps; }
    else {
      const a = state.a, b = state.b; const n = a.length, m = b.length;
      state.rows = n+1; state.cols = m+1; const sz = (n+1)*(m+1);
      state.S = new Array(sz).fill(0); state.T = new Array(sz).fill(0);
      const idx = (i,j)=> i*(m+1)+j;
      if(state.mode==='nw'){
        for(let i=1;i<=n;i++){ state.S[idx(i,0)] = state.gap*i; state.T[idx(i,0)] = 2; }
        for(let j=1;j<=m;j++){ state.S[idx(0,j)] = state.gap*j; state.T[idx(0,j)] = 3; }
      }
      state.steps = [];
      for(let i=1;i<=n;i++){
        for(let j=1;j<=m;j++){
          const sDiag = state.S[idx(i-1,j-1)] + (a[i-1]===b[j-1]?state.match:state.mismatch);
          const sUp = state.S[idx(i-1,j)] + state.gap;
          const sLeft = state.S[idx(i,j-1)] + state.gap;
          let sc = sDiag, tr = 1;
          if(sUp > sc){ sc = sUp; tr = 2; }
          if(sLeft > sc){ sc = sLeft; tr = 3; }
          if(state.mode==='sw' && sc<0){ sc = 0; tr = 0; }
          state.steps.push({i,j, sDiag, sUp, sLeft, sc, tr});
          state.S[idx(i,j)] = sc; state.T[idx(i,j)] = tr;
        }
      }
    }
    state.stepIdx = 0; log(`构建完成：${state.mode==='sw'?'SW':'NW'}，矩阵 ${state.rows}×${state.cols}`);
    render(0);
  }

  function traceback(){
    if(Core && Core.traceback){ return Core.traceback({ a: state.a, b: state.b, rows: state.rows, cols: state.cols, S: state.S, T: state.T }, state.mode); }
    const a = state.a, b = state.b; const n = a.length, m = b.length; const idx = (i,j)=> i*(m+1)+j;
    let bi = 0, bj = 0, best = -Infinity; if(state.mode==='sw'){ for(let i=0;i<=n;i++){ for(let j=0;j<=m;j++){ const v = state.S[idx(i,j)]; if(v>best){ best=v; bi=i; bj=j; } } } } else { bi=n; bj=m; best=state.S[idx(n,m)]; }
    const path = []; let ti=bi, tj=bj; while(ti>0 && tj>0){ const tr = state.T[idx(ti,tj)]; if(state.mode==='sw' && state.S[idx(ti,tj)]===0) break; if(tr===0) break; path.push([ti,tj]); if(tr===1){ ti--; tj--; } else if(tr===2){ ti--; } else if(tr===3){ tj--; } else break; }
    return {bi,bj,best,path};
  }

  function render(stepCount){
    const canvas = els.dpCanvas; if(!canvas) return; const ctx = canvas.getContext('2d'); const W=canvas.width, H=canvas.height; ctx.clearRect(0,0,W,H);
    const cell = 26, margin=60; const a = state.a, b = state.b; const n=a.length, m=b.length; const idx=(i,j)=> i*(m+1)+j;
    // axes labels
    ctx.fillStyle = '#9fb2c8'; ctx.font = '12px sans-serif';
    for(let i=0;i<n;i++){ ctx.fillText(a[i], margin-20, margin + (i+1)*cell + 16); }
    for(let j=0;j<m;j++){ ctx.fillText(b[j], margin + (j+1)*cell + 8, margin-24); }
    // grid
    ctx.strokeStyle = '#2a3b66'; ctx.lineWidth = 1; ctx.strokeRect(margin, margin, (m+1)*cell, (n+1)*cell);
    // draw filled cells up to stepCount
    let filled = 0;
    for(const st of state.steps){
      if(filled>=stepCount) break; filled++;
      const x = margin + st.j*cell; const y = margin + st.i*cell;
      const t = Math.min(1, Math.max(0, st.sc/10)); ctx.fillStyle = `rgba(106,161,255,${0.1 + 0.5*t})`;
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = '#e8edf4'; ctx.font='12px sans-serif'; ctx.fillText(String(st.sc), x+6, y+18);
    }
    // final path
    const tb = traceback();
    ctx.strokeStyle = '#f7768e'; ctx.lineWidth = 2; ctx.beginPath();
    const pLen = Math.max(1, Math.floor(tb.path.length * Math.min(1, stepCount / Math.max(1, state.steps.length))));
    for(let k=0;k<pLen;k++){ const [i,j] = tb.path[k]; const cx = margin + j*cell + cell/2; const cy = margin + i*cell + cell/2; if(k===0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy); }
    ctx.stroke();
    ctx.fillStyle = '#9fb2c8'; ctx.fillText(`bestScore=${tb.best}`, margin, margin + (n+1)*cell + 24);
    if(els.inputPanel){ els.inputPanel.textContent = `A=${state.a} B=${state.b} mode=${state.mode} match=${state.match} mismatch=${state.mismatch} gap=${state.gap}`; }
    if(els.outputPanel){ els.outputPanel.textContent = `alignA=${tb.alignA||''}\nalignB=${tb.alignB||''}`; }
  }

  function play(){ if(state.playing) return; state.playing=true; const tick=()=>{ if(state.stepIdx>=state.steps.length){ pause(); return; } state.stepIdx++; render(state.stepIdx); }; state.timer=setInterval(tick, 120); }
  function pause(){ state.playing=false; if(state.timer){ clearInterval(state.timer); state.timer=null; } }
  function reset(){ pause(); state.stepIdx=0; render(0); }
  function step(){ if(state.stepIdx<state.steps.length){ state.stepIdx++; render(state.stepIdx); } }

  els.buildBtn.addEventListener('click', buildMatrix);
  els.playBtn.addEventListener('click', play);
  els.pauseBtn.addEventListener('click', pause);
  els.stepBtn.addEventListener('click', step);
  els.resetBtn.addEventListener('click', reset);

  function applyPreset(a, b){ els.seqA.value=a; els.seqB.value=b; buildMatrix(); }
  if(els.preset1) els.preset1.addEventListener('click', ()=> applyPreset('GATTACA','GCATGCU'));
  if(els.preset2) els.preset2.addEventListener('click', ()=> applyPreset('BAOBAB','BAHABA'));
  if(els.preset3) els.preset3.addEventListener('click', ()=> applyPreset('AAAAAA','AAAA'));

  buildMatrix();
})();