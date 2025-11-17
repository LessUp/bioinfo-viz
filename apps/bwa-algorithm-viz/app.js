(function(){
  const els = {
    refInput: document.getElementById('refInput'),
    readInput: document.getElementById('readInput'),
    generateBtn: document.getElementById('generateBtn'),
    playBtn: document.getElementById('playBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    stepBtn: document.getElementById('stepBtn'),
    resetBtn: document.getElementById('resetBtn'),
    speedRange: document.getElementById('speedRange'),
    speedLabel: document.getElementById('speedLabel'),
    toggleOcc: document.getElementById('toggleOcc'),

    refSeq: document.getElementById('refSeq'),
    saTable: document.getElementById('saTable'),
    bwtPanel: document.getElementById('bwtPanel'),
    cTable: document.getElementById('cTable'),
    occSection: document.getElementById('occSection'),
    occTable: document.getElementById('occTable'),
    searchPanel: document.getElementById('searchPanel'),
    matchPanel: document.getElementById('matchPanel'),

    stepCounter: document.getElementById('stepCounter'),
    logPanel: document.getElementById('logPanel'),

    // Enhancements
    smemStrip: document.getElementById('smemStrip'),
    smemList: document.getElementById('smemList'),
    chainCanvas: document.getElementById('chainCanvas'),
    chainInfo: document.getElementById('chainInfo'),
    swText: document.getElementById('swText'),
    mapqResult: document.getElementById('mapqResult'),
    swCanvas: document.getElementById('swCanvas'),
    mapqCanvas: document.getElementById('mapqCanvas'),
    mapqWDelta: document.getElementById('mapqWDelta'),
    mapqWDup: document.getElementById('mapqWDup'),
    mapqWPair: document.getElementById('mapqWPair'),

    // Params UI
    paramMinSeed: document.getElementById('paramMinSeed'),
    paramMaxOcc: document.getElementById('paramMaxOcc'),
    paramChainWin: document.getElementById('paramChainWin'),
    paramGapOpen: document.getElementById('paramGapOpen'),
    paramGapExtend: document.getElementById('paramGapExtend'),
    paramSWBand: document.getElementById('paramSWBand'),
    paramZDrop: document.getElementById('paramZDrop'),
    paramDiagSlack: document.getElementById('paramDiagSlack'),
    paramOverlapPenalty: document.getElementById('paramOverlapPenalty'),
    paramEnableRC: document.getElementById('paramEnableRC'),
    paramEnableReseed: document.getElementById('paramEnableReseed'),
    applyParamsBtn: document.getElementById('applyParamsBtn')
  };

  const ABC = ['$', 'A', 'C', 'G', 'T'];
  const BASE_INTERVAL = 900;
  const COLORS = ['#6aa1ff','#6affc1','#ffb86a','#f7768e','#bd93f9','#8be9fd'];
  const DPR = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

  const state = {
    model: null,
    steps: 0,
    segments: null,
    stepIndex: 0,
    playing: false,
    speed: 1,
    timer: null,
    // extras
    smems: [],
    chains: null,
    mapq: null,
    mermaidInited: false,
    params: {
      minSeed: 3,
      maxOcc: 20,
      chainWin: 1000,
      gapOpen: 4,
      gapExtend: 1,
      swBand: 8,
      zdrop: 20,
      diagSlack: 50,
      overlapPenalty: 10,
      enableRC: false,
      enableReseed: false
    }
  };

  // ---------- MAPQ chart & sliders ----------
  function drawMapqChart(){
    const canvas = els.mapqCanvas; if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    const data = state._mapqContrib || {contribDelta:0, penaltyDup:0, bonusPair:0, mapq:0};
    const labels = ['Δ分差','-重复惩罚','+配对一致'];
    const values = [data.contribDelta, -data.penaltyDup, data.bonusPair];
    const colors = ['#6aa1ff','#f7768e','#6affc1'];
    const maxVal = Math.max(10, ...values.map(v=>Math.abs(v)));
    const barW = Math.floor(W/6);
    for(let i=0;i<values.length;i++){
      const x = (i*2+1)*barW;
      const v = values[i];
      const y0 = H*0.6;
      const h = (Math.abs(v)/maxVal) * (H*0.5);
      ctx.fillStyle = colors[i];
      ctx.fillRect(x, v>=0? (y0-h) : y0, barW, h);
      ctx.fillStyle = '#9fb2c8'; ctx.font = '12px sans-serif'; ctx.textAlign='center';
      ctx.fillText(labels[i], x+barW/2, H-10);
    }
    ctx.fillStyle = '#fff'; ctx.font='14px sans-serif'; ctx.textAlign='left';
    ctx.fillText(`MAPQ ≈ ${state._mapqContrib?.mapq??0}`, 12, 18);
    try{ els.mapqCanvas.classList.add('mapq-bars-enter'); setTimeout(()=> els.mapqCanvas.classList.remove('mapq-bars-enter'), 700); }catch(_){ }
  }

  function syncMapqWeights(){
    if(els.mapqWDelta) state.params.mapqWDelta = parseInt(els.mapqWDelta.value||'4');
    if(els.mapqWDup) state.params.mapqWDup = parseInt(els.mapqWDup.value||'1');
    if(els.mapqWPair) state.params.mapqWPair = parseInt(els.mapqWPair.value||'2');
  }
  function onMapqWeightChange(){
    if(!state.model) return;
    syncMapqWeights();
    state.mapq = approxMAPQ(state.chains, state.smems);
    renderMAPQ(state.mapq);
  }
  if(els.mapqWDelta) els.mapqWDelta.addEventListener('input', onMapqWeightChange);
  if(els.mapqWDup) els.mapqWDup.addEventListener('input', onMapqWeightChange);
  if(els.mapqWPair) els.mapqWPair.addEventListener('input', onMapqWeightChange);

  function log(msg){
    const d = new Date();
    const time = d.toLocaleTimeString();
    const line = document.createElement('div');
    line.textContent = `[${time}] ${msg}`;
    els.logPanel.appendChild(line);
    els.logPanel.scrollTop = els.logPanel.scrollHeight;
  }

  function sanitizeDNA(s){
    return (s||'').toUpperCase().replace(/[^ACGT]/g,'');
  }

  function pulse(el){
    if(!el) return;
    el.classList.remove('pulse');
    void el.offsetWidth; // reflow
    el.classList.add('pulse');
    setTimeout(()=>el.classList.remove('pulse'), 600);
  }

  function buildModel(ref, read){
    const text = sanitizeDNA(ref);
    const pattern = sanitizeDNA(read);
    if(!text) throw new Error('参考序列为空或包含非法字符');
    if(!pattern) throw new Error('读段为空或包含非法字符');

    const T = text + '$';
    const n = T.length;

    const rotations = Array.from({length: n}, (_,i)=> T.slice(i) + T.slice(0,i));
    const saOrder = Array.from({length: n}, (_,i)=>i).sort((a,b)=>{
      const ra = rotations[a], rb = rotations[b];
      return ra < rb ? -1 : (ra > rb ? 1 : 0);
    });
    const sortedRot = saOrder.map(i=>rotations[i]);
    const SA = saOrder.slice();

    const L = SA.map(si => T[(si - 1 + n) % n]);
    const F = T.split('').sort((a,b)=> ABC.indexOf(a) - ABC.indexOf(b));

    const counts = Object.fromEntries(ABC.map(c=>[c,0]));
    L.forEach(c => counts[c] = (counts[c]||0) + 1);
    const C = {};
    let cum = 0;
    for(const c of ABC){
      C[c] = cum;
      cum += (counts[c]||0);
    }

    const Occ = {};
    for(const c of ABC){ Occ[c] = new Array(n+1).fill(0); }
    for(let i=0;i<n;i++){
      const ch = L[i];
      for(const c of ABC){ Occ[c][i+1] = Occ[c][i] + (ch===c?1:0); }
    }

    const searchSteps = [];
    let l = 0, r = n;
    for(let i=pattern.length-1;i>=0;i--){
      const ch = pattern[i];
      if(!ABC.includes(ch)){
        searchSteps.push({i, ch, l, r, l2:0, r2:0, invalid:true});
        l = r = 0;
        continue;
      }
      const l2 = C[ch] + Occ[ch][l];
      const r2 = C[ch] + Occ[ch][r];
      searchSteps.push({i, ch, l, r, l2, r2, invalid:false});
      l = l2; r = r2;
    }

    const finalL = l, finalR = r;
    const matchSAIdx = [];
    if(finalR>finalL){
      for(let k=finalL;k<finalR;k++){
        const pos = SA[k];
        if(pos + pattern.length <= n-1) matchSAIdx.push({saIndex:k, pos});
      }
    }

    return {
      text,
      T, n,
      rotations,
      sortedRot,
      SA,
      L, F,
      C, Occ,
      pattern,
      searchSteps,
      finalRange: {l:finalL, r:finalR},
      matches: matchSAIdx
    };
  }

  function planSteps(model){
    const n = model.n;
    const m = model.pattern.length;
    const segments = {
      ref: {start: 0, len: 1},
      sa: {start: 1, len: n},
      fl: {start: 1 + n, len: 1},
      c: {start: 2 + n, len: 1},
      occ: {start: 3 + n, len: 1},
      search: {start: 4 + n, len: m},
      match: {start: 4 + n + m, len: 1}
    };
    const total = segments.match.start + segments.match.len;
    return {segments, total};
  }

  function clearContainer(el){ while(el.firstChild) el.removeChild(el.firstChild); }

  function makeCell(text, cls){
    const d = document.createElement('div');
    d.className = 'cell' + (cls?(' '+cls):'');
    d.textContent = text;
    if(text === '$') d.classList.add('sentinel');
    return d;
  }

  // ---------- Enhancements: SMEM ----------
  function charPositions(text){
    const pos = {A:[],C:[],G:[],T:[]};
    for(let i=0;i<text.length;i++){
      const c = text[i];
      if(pos[c]) pos[c].push(i);
    }
    return pos;
  }

  function rcDNA(s){
    const map = {A:'T',T:'A',C:'G',G:'C'};
    let out = '';
    for(let i=s.length-1;i>=0;i--){ const c=s[i]; out += (map[c]||c); }
    return out;
  }

  function findOccurrences(text, subseq, limit){
    const res = [];
    if(!subseq || subseq.length===0) return res;
    let pos = 0;
    while(true){
      const i = text.indexOf(subseq, pos);
      if(i === -1) break;
      res.push(i);
      pos = i + 1;
      if(limit && res.length>=limit) break;
    }
    return res;
  }

  function aggregateSMEMs(raw){
    // 合并相同读段区间但不同 refPos 的出现计数
    const bySpan = new Map();
    for(const s of raw){
      const k = s.readStart+':'+s.readEnd;
      if(!bySpan.has(k)) bySpan.set(k, {readStart:s.readStart, readEnd:s.readEnd, len:s.len, refPosList:[s.refPos]});
      else bySpan.get(k).refPosList.push(s.refPos);
    }
    return Array.from(bySpan.values()).sort((a,b)=> a.readStart-b.readStart || b.len-a.len);
  }

  function findSMEMsForPattern(text, read, minLen){
    const res = [];
    const seen = new Set();
    const posMap = charPositions(text);
    const rlen = read.length, tlen = text.length;
    for(let i=0;i<rlen;i++){
      const c = read[i];
      const arr = posMap[c] || [];
      for(const p0 of arr){
        let l=0; while(i-1-l>=0 && p0-1-l>=0 && read[i-1-l]===text[p0-1-l]) l++;
        let r=0; while(i+1+r<rlen && p0+1+r<tlen && read[i+1+r]===text[p0+1+r]) r++;
        const readStart = i - l;
        const readEnd = i + r + 1;
        const refPos = p0 - l;
        const len = readEnd - readStart;
        if(len < (minLen||2)) continue;
        const key = readStart+':'+len+':'+refPos;
        if(seen.has(key)) continue;
        seen.add(key);
        res.push({readStart, readEnd, len, refPos});
        if(res.length>4000) break;
      }
      if(res.length>4000) break;
    }
    // 去包含（SMEM 过滤）
    res.sort((a,b)=> a.readStart!==b.readStart ? a.readStart-b.readStart : b.len-a.len);
    const keep = [];
    for(let i=0;i<res.length;i++){
      const a = res[i];
      let contained = false;
      for(let j=0;j<res.length;j++){
        if(i===j) continue;
        const b = res[j];
        if(b.readStart <= a.readStart && b.readEnd >= a.readEnd && b.len > a.len){ contained=true; break; }
      }
      if(!contained) keep.push(a);
    }
    return keep;
  }

  function findSMEMs(text, read, minLen, maxOcc, enableRC, enableReseed){
    const rawF = findSMEMsForPattern(text, read, minLen);
    let all = rawF.slice();
    if(enableRC){
      const rcrc = rcDNA(read);
      const rawR = findSMEMsForPattern(text, rcrc, minLen);
      // 映射回原读段坐标
      const n = read.length;
      for(const s of rawR){
        const oStart = n - s.readEnd;
        const oEnd = n - s.readStart;
        all.push({readStart:oStart, readEnd:oEnd, len:s.len, refPos:s.refPos});
      }
    }
    // 合并与统计出现次数
    let agg = aggregateSMEMs(all);
    // reseed: 对出现次数过多或过长的片段进行切分
    if(enableReseed){
      const extra = [];
      for(const s of agg){
        const occ = s.refPosList.length;
        if(occ > (maxOcc||Infinity) || s.len >= 2*minLen){
          const mid = s.readStart + Math.floor(s.len/2);
          const a = read.slice(s.readStart, mid);
          const b = read.slice(mid, s.readEnd);
          if(a.length>=minLen){
            const posa = findOccurrences(text, a, (maxOcc||2000));
            if(posa.length){ extra.push({readStart:s.readStart, readEnd:mid, len:a.length, refPosList:posa}); }
          }
          if(b.length>=minLen){
            const posb = findOccurrences(text, b, (maxOcc||2000));
            if(posb.length){ extra.push({readStart:mid, readEnd:s.readEnd, len:b.length, refPosList:posb}); }
          }
        }
      }
      if(extra.length){
        // 合并原有与新增
        agg = aggregateSMEMs(agg.flatMap(s=> s.refPosList.map(p=>({readStart:s.readStart, readEnd:s.readEnd, len:s.len, refPos:p}))).concat(
          extra.flatMap(s=> s.refPosList.map(p=>({readStart:s.readStart, readEnd:s.readEnd, len:s.len, refPos:p})))
        ));
      }
    }
    // 限制出现次数并记录 occCount
    for(const s of agg){
      s.occCount = s.refPosList.length;
      if(maxOcc && s.refPosList.length > maxOcc){ s.refPosList = s.refPosList.slice(0, maxOcc); }
    }
    return agg;
  }

  function renderSMEM(model, smems){
    if(!els.smemStrip || !els.smemList) return;
    // strip
    clearContainer(els.smemStrip);
    for(let i=0;i<model.pattern.length;i++){
      els.smemStrip.appendChild(makeCell(model.pattern[i]));
    }
    // overlay by setting classes
    for(let idx=0; idx<smems.length; idx++){
      const s = smems[idx];
      const color = COLORS[idx % COLORS.length];
      for(let k=s.readStart; k<s.readEnd; k++){
        const cell = els.smemStrip.children[k];
        if(cell){
          cell.classList.add('match');
          cell.style.boxShadow = `0 0 0 1px ${color} inset`;
        }
      }
    }
    // list
    clearContainer(els.smemList);
    const head = document.createElement('div'); head.className='table-row';
    head.appendChild(makeCell('#'));
    head.appendChild(makeCell('read[Start,End)'));
    head.appendChild(makeCell('len'));
    head.appendChild(makeCell('occ'));
    head.appendChild(makeCell('ref pos(前几项)'));
    els.smemList.appendChild(head);
    smems.slice(0,50).forEach((s, i)=>{
      const row = document.createElement('div'); row.className='table-row';
      row.appendChild(makeCell(String(i+1)));
      row.appendChild(makeCell(`[${s.readStart},${s.readEnd})`));
      row.appendChild(makeCell(String(s.len)));
      row.appendChild(makeCell(String(s.occCount!=null?s.occCount:s.refPosList.length)));
      row.appendChild(makeCell(s.refPosList.slice(0,6).join(', ')));
      row.dataset.readStart = s.readStart;
      row.dataset.readEnd = s.readEnd;
      row.addEventListener('mouseenter', ()=>{
        for(let k=0;k<els.smemStrip.children.length;k++){
          els.smemStrip.children[k].classList.toggle('active', k>=s.readStart && k<s.readEnd);
        }
      });
      row.addEventListener('mouseleave', ()=>{
        for(let k=0;k<els.smemStrip.children.length;k++){
          els.smemStrip.children[k].classList.remove('active');
        }
      });
      els.smemList.appendChild(row);
    });
  }

  // ---------- Enhancements: Chaining ----------
  function computeChain(model, smems){
    // 将每个 SMEM 取其第一个参考位置生成候选
    const cands = [];
    for(const s of smems){
      if(!s.refPosList || s.refPosList.length===0) continue;
      const refPos = s.refPosList[0];
      cands.push({refStart:refPos, refEnd:refPos + s.len, readStart:s.readStart, readEnd:s.readEnd, len:s.len});
    }
    cands.sort((a,b)=> a.refStart - b.refStart || a.readStart - b.readStart);
    const n = cands.length;
    const dp = new Array(n).fill(0);
    const par = new Array(n).fill(-1);
    for(let j=0;j<n;j++){
      dp[j] = cands[j].len;
      for(let i=0;i<j;i++){
        // 惩罚非一致位移与重叠
        const dr = (cands[j].refStart - cands[i].refEnd);
        const dq = (cands[j].readStart - cands[i].readEnd);
        // 链式窗口限制（只考虑 ref 上距离过大的前驱时跳过）
        if(dr > state.params.chainWin) continue;
        const overlap = (cands[j].readStart < cands[i].readEnd || cands[j].refStart < cands[i].refEnd) ? state.params.overlapPenalty : 0;
        const diff = Math.abs((cands[j].refStart - cands[i].refStart) - (cands[j].readStart - cands[i].readStart));
        if(diff > state.params.diagSlack) continue; // 过离散的对角偏移：跳过
        const gapLen = Math.max(0, Math.abs(dr - dq));
        const gapCost = (gapLen>0 ? (state.params.gapOpen + state.params.gapExtend * gapLen) : 0) + 2*diff + overlap;
        const val = dp[i] + cands[j].len - gapCost;
        if(val > dp[j]){ dp[j] = val; par[j] = i; }
      }
    }
    // 取最佳与次优
    let bestIdx = 0, secondIdx = -1;
    for(let i=1;i<n;i++){ if(dp[i] > dp[bestIdx]){ secondIdx = bestIdx; bestIdx = i; } else if(secondIdx===-1 || dp[i]>dp[secondIdx]){ secondIdx = i; } }
    const best = [];
    let cur = bestIdx; while(cur!==-1){ best.push(cur); cur = par[cur]; }
    best.reverse();
    let second = [];
    if(secondIdx>=0){ let c2 = secondIdx; while(c2!==-1){ second.push(c2); c2 = par[c2]; } second.reverse(); }
    return { cands, pathIdx: best, secondPathIdx: second, bestScore: dp[bestIdx]||0, secondScore: (secondIdx>=0?dp[secondIdx]:0) };
  }

  function drawChain(model, chains){
    if(!els.chainCanvas) return;
    const canvas = els.chainCanvas;
    const ctx = canvas.getContext('2d');
    // scale for DPR
    const viewW = canvas.width, viewH = canvas.height;
    if(DPR && (canvas.dataset.scaled!=='1')){
      canvas.style.width = viewW + 'px';
      canvas.style.height = viewH + 'px';
      canvas.width = Math.floor(viewW * DPR);
      canvas.height = Math.floor(viewH * DPR);
      canvas.dataset.scaled = '1';
    }
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    const margin = 50 * DPR;
    const sx = (W - margin*2) / Math.max(1, model.text.length);
    const sy = (H - margin*2) / Math.max(1, model.pattern.length);
    // axes
    ctx.strokeStyle = '#2a3b66'; ctx.lineWidth = 1*DPR;
    ctx.strokeRect(margin, margin, W - margin*2, H - margin*2);
    ctx.fillStyle = '#9fb2c8'; ctx.font = `${12*DPR}px sans-serif`;
    ctx.fillText('ref', margin, margin - 10*DPR);
    ctx.save(); ctx.translate(margin-20*DPR, margin); ctx.rotate(-Math.PI/2); ctx.fillText('read', 0,0); ctx.restore();
    // draw cands & cache for tooltip
    const cache = [];
    for(let i=0;i<chains.cands.length;i++){
      const s = chains.cands[i];
      const x = margin + s.refStart * sx;
      const y = margin + s.readStart * sy;
      const w = Math.max(1, s.len * sx);
      const h = Math.max(2*DPR, 6*DPR);
      ctx.fillStyle = 'rgba(110, 170, 255, 0.35)';
      ctx.fillRect(x,y,w,h);
      cache.push({i, x, y, w, h, s});
    }
    // draw best path
    const path = chains.pathIdx.map(i => chains.cands[i]);
    ctx.strokeStyle = '#6affc1'; ctx.lineWidth = 2*DPR;
    const tNow = canvas._animTime || performance.now();
    const dur = 1200;
    const t0 = canvas._chainStartTime || tNow; if(!canvas._chainStartTime) canvas._chainStartTime = tNow;
    const p = Math.min(1, (tNow - t0)/dur);
    const nDraw = Math.max(1, Math.floor(path.length * p));
    ctx.beginPath();
    for(let k=0;k<nDraw;k++){
      const s = path[k];
      const cx = margin + (s.refStart + s.len/2) * sx;
      const cy = margin + (s.readStart + s.len/2) * sy;
      if(k===0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    // draw second path
    if(chains.secondPathIdx && chains.secondPathIdx.length){
      const path2 = chains.secondPathIdx.map(i => chains.cands[i]);
      ctx.strokeStyle = 'rgba(189,147,249,0.9)'; ctx.setLineDash([6*DPR, 4*DPR]); ctx.lineWidth = 2*DPR;
      const tNow2 = canvas._animTime || performance.now();
      const dur2 = 900;
      const t02 = canvas._chainStartTime2 || tNow2; if(!canvas._chainStartTime2) canvas._chainStartTime2 = tNow2;
      const p2 = Math.min(1, (tNow2 - t02)/dur2);
      const nDraw2 = Math.max(1, Math.floor(path2.length * p2));
      ctx.beginPath();
      for(let k=0;k<nDraw2;k++){
        const s = path2[k];
        const cx = margin + (s.refStart + s.len/2) * sx;
        const cy = margin + (s.readStart + s.len/2) * sy;
        if(k===0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    // info
    if(els.chainInfo){
      els.chainInfo.textContent = `候选种子: ${chains.cands.length}，最佳链长度: ${path.length}，最佳分: ${chains.bestScore.toFixed(1)}，次优分: ${chains.secondScore.toFixed(1)}`;
    }
    // store cache for tooltip handlers
    canvas._chainCache = { boxes: cache, margin, sx, sy };
  }

  // ---------- Enhancements: SW + Z-drop demo (简化) ----------
  function simulateBandedSW(model, chains){
    if(!chains || !chains.pathIdx || chains.pathIdx.length===0) return {w:state.params.swBand, Z:state.params.zdrop, best:0, drop:false};
    const first = chains.cands[chains.pathIdx[0]];
    const refStart = Math.max(0, first.refStart - 5);
    const w = state.params.swBand, Z = state.params.zdrop;
    let best = 0, cur = 0, drop = false;
    const L = Math.min(model.text.length - refStart, model.pattern.length + 10);
    for(let i=0;i<L;i++){
      const a = model.text[refStart + i] || '';
      const b = model.pattern[i] || '';
      cur += (a===b ? 2 : -1); // 简化：match +2, mismatch -1
      if(cur < 0) cur = 0; // 局部比对
      if(cur > best) best = cur;
      if(best - cur > Z){ drop = true; break; }
    }
    return {w,Z,best,drop, refStart};
  }

  function renderSW(sw){
    if(!els.swText) return;
    els.swText.textContent = `带宽 w=${sw.w}，Z=${sw.Z}，bestScore=${sw.best}，Z-drop触发=${sw.drop}`;
  }

  // ---------- Enhancements: MAPQ demo (启发式) ----------
  function approxMAPQ(chains, smems){
    const delta = Math.max(0, (chains?.bestScore||0) - (chains?.secondScore||0));
    const wDelta = state.params.mapqWDelta||4;
    const wDup = state.params.mapqWDup||1;
    const wPair = state.params.mapqWPair||2;
    let occSum = 0; for(const s of (smems||[])) occSum += Math.max(0, (s.refPosList?.length||0)-1);
    const contribDelta = wDelta * delta;
    const penaltyDup = wDup * Math.log2(occSum+1);
    const pairConsistency = Math.min(10, (chains?.pathIdx?.length||0));
    const bonusPair = wPair * (pairConsistency*0.5);
    let mapq = Math.round(contribDelta - penaltyDup + bonusPair);
    if(mapq<0) mapq=0; if(mapq>60) mapq=60;
    state._mapqContrib = {contribDelta, penaltyDup, bonusPair, mapq};
    return mapq;
  }

  function renderMAPQ(mapq){
    if(!els.mapqResult) return;
    els.mapqResult.textContent = `示意 MAPQ ≈ ${mapq}`;
    drawMapqChart();
  }

  // ---------- Tabs & Mermaid ----------
  function initMermaid(){
    try{
      if(window.mermaid && !state.mermaidInited){
        window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
        state.mermaidInited = true;
      }
    }catch(_){ /* noop */ }
  }

  function runMermaid(){
    try{
      if(window.mermaid){ window.mermaid.run({ querySelector: '.mermaid' }); }
    }catch(_){ /* noop */ }
  }

  function activateTab(name){
    const buttons = document.querySelectorAll('.tab');
    buttons.forEach(btn=>{
      const active = btn.dataset.tab === name;
      btn.classList.toggle('active', active);
    });
    const panels = ['smem','chain','sw','mapq','docs'];
    panels.forEach(p=>{
      const el = document.getElementById('tab-'+p);
      if(el) el.hidden = (p!==name);
    });
    if(name==='docs'){ initMermaid(); runMermaid(); }
    if(name==='smem'){ renderSMEM(state.model, state.smems); }
    if(name==='chain'){ drawChain(state.model, state.chains); }
    if(name==='sw'){ const sw = simulateBandedSW(state.model, state.chains); renderSW(sw); drawSWMatrix(state.model, state.chains, sw); }
    if(name==='mapq'){ renderMAPQ(state.mapq); }
  }

  function renderReference(model){
    clearContainer(els.refSeq);
    for(const ch of (model.T)){
      els.refSeq.appendChild(makeCell(ch));
    }
  }

  function renderMatchPanel(model, active){
    clearContainer(els.matchPanel);
    const m = model.pattern.length;
    for(let i=0;i<model.T.length;i++){
      const cell = makeCell(model.T[i]);
      els.matchPanel.appendChild(cell);
    }
    if(!active) return;
    for(const {pos} of model.matches){
      for(let j=0;j<m;j++){
        const idx = pos + j;
        const cell = els.matchPanel.children[idx];
        if(cell){ cell.classList.add('match'); }
      }
    }
  }

  function renderSATable(model, revealCount){
    clearContainer(els.saTable);
    const n = model.n;
    const head = document.createElement('div');
    head.className = 'table-row';
    head.appendChild(makeCell('#','idx'));
    const rotTitle = document.createElement('div'); rotTitle.className='rotation'; rotTitle.style.color='var(--muted)'; rotTitle.textContent='排序后的旋转';
    head.appendChild(rotTitle);
    head.appendChild(makeCell('SA','sa'));
    els.saTable.appendChild(head);

    for(let i=0;i<n;i++){
      const row = document.createElement('div'); row.className='table-row';
      const idx = document.createElement('div'); idx.className='idx'; idx.textContent = String(i);
      row.appendChild(idx);
      const rot = document.createElement('div'); rot.className='rotation';
      for(const ch of model.sortedRot[i]) rot.appendChild(makeCell(ch));
      if(i<revealCount){ rot.classList.add('pulse'); }
      row.appendChild(rot);
      const sa = document.createElement('div'); sa.className='sa'; sa.textContent = String(model.SA[i]);
      row.appendChild(sa);
      els.saTable.appendChild(row);
    }
  }

  function renderBWTPanel(model, showFL, activeRange){
    clearContainer(els.bwtPanel);
    const makeBlock = (title, arr) => {
      const wrap = document.createElement('div'); wrap.className='bwt-block';
      const t = document.createElement('div'); t.className='bwt-title'; t.textContent = title; wrap.appendChild(t);
      const col = document.createElement('div'); col.className='bwt-col'; col.style.flexDirection='column';
      arr.forEach((ch, i)=>{
        const cell = makeCell(ch);
        if(activeRange && i>=activeRange.l && i<activeRange.r){ cell.classList.add('active'); }
        col.appendChild(cell);
      });
      wrap.appendChild(col);
      return wrap;
    };
    if(showFL){
      els.bwtPanel.appendChild(makeBlock('F（排序列）', model.F));
      els.bwtPanel.appendChild(makeBlock('L（BWT 列）', model.L));
    }
  }

  function renderCTable(model, show){
    clearContainer(els.cTable);
    if(!show) return;
    const row = document.createElement('div'); row.className='table-row';
    for(const c of ABC){
      const g = document.createElement('div'); g.style.display='flex'; g.style.alignItems='center'; g.style.gap='6px';
      g.appendChild(makeCell(c));
      g.appendChild(makeCell(String(model.C[c])));
      row.appendChild(g);
    }
    els.cTable.appendChild(row);
  }

  function renderOccTable(model, show){
    clearContainer(els.occTable);
    if(!show) return;
    const header = document.createElement('div'); header.className='table-row';
    const idxh = document.createElement('div'); idxh.className='idx'; idxh.textContent = 'i'; header.appendChild(idxh);
    for(const c of ABC){ header.appendChild(makeCell(c)); }
    els.occTable.appendChild(header);
    const limit = model.n>200 ? 200 : model.n;
    for(let i=0;i<=limit;i++){
      const row = document.createElement('div'); row.className='table-row';
      const idc = document.createElement('div'); idc.className='idx'; idc.textContent = String(i);
      row.appendChild(idc);
      for(const c of ABC){ row.appendChild(makeCell(String(model.Occ[c][i]))); }
      els.occTable.appendChild(row);
    }
    if(model.n>200){
      const more = document.createElement('div'); more.className='table-row';
      more.appendChild(makeCell('...')); els.occTable.appendChild(more);
    }
  }

  function renderSearchPanel(model, processed){
    clearContainer(els.searchPanel);
    const top = document.createElement('div'); top.className='row';
    top.appendChild(document.createTextNode('模式串（从右往左）：'));
    const bar = document.createElement('div'); bar.className='row';
    for(let i=0;i<model.pattern.length;i++){
      const ch = model.pattern[i];
      const cell = makeCell(ch);
      if(i>=processed) cell.style.opacity = 0.45;
      if(i===processed-1) { cell.classList.add('active'); }
      bar.appendChild(cell);
    }
    top.appendChild(bar);
    els.searchPanel.appendChild(top);

    const table = document.createElement('div'); table.className='table';
    for(let k=0;k<processed;k++){
      const st = model.searchSteps[model.pattern.length-1 - k];
      const row = document.createElement('div'); row.className='table-row';
      row.appendChild(makeCell(`#${k+1}`));
      row.appendChild(makeCell(`ch=${st.ch}`));
      row.appendChild(makeCell(`l=${st.l}`));
      row.appendChild(makeCell(`r=${st.r}`));
      row.appendChild(makeCell(`l'=${st.l2}`));
      row.appendChild(makeCell(`r'=${st.r2}`));
      table.appendChild(row);
    }
    els.searchPanel.appendChild(table);
  }

  function render(step){
    if(!state.model) return;
    const m = state.model;
    const seg = state.segments;

    renderReference(m);

    const saReveal = Math.max(0, Math.min(m.n, step - seg.sa.start + 1));
    renderSATable(m, saReveal);

    const showFL = step >= seg.fl.start;
    let activeRange = null;
    let processed = 0;
    if(step >= seg.search.start){
      processed = Math.min(m.pattern.length, step - seg.search.start + 1);
      if(processed>0){
        const st = m.searchSteps[m.pattern.length - processed];
        const curL = st ? st.l2 : 0;
        const curR = st ? st.r2 : 0;
        activeRange = {l: curL, r: curR};
      }
    }
    renderBWTPanel(m, showFL, activeRange);

    const showC = step >= seg.c.start;
    renderCTable(m, showC);

    const showOcc = step >= seg.occ.start && els.toggleOcc.checked;
    renderOccTable(m, showOcc);

    renderSearchPanel(m, processed);
    try{
      const rows = els.searchPanel.querySelectorAll('.table .table-row');
      const activeIdx = Math.max(0, Math.min(rows.length-1, processed-1));
      rows.forEach((row, idx)=> row.classList.toggle('active', idx===activeIdx));
    }catch(_){ }

    const showMatch = step >= seg.match.start;
    renderMatchPanel(m, showMatch);

    els.stepCounter.textContent = `${Math.min(step, state.steps)} / ${state.steps}`;
  }

  function stop(){
    state.playing = false;
    if(state.timer){ clearInterval(state.timer); state.timer = null; }
    try{
      if(els.playBtn) els.playBtn.classList.remove('playing');
      if(els.pauseBtn) els.pauseBtn.classList.add('paused');
    }catch(_){ }
  }

  function play(){
    if(!state.model) return;
    if(state.playing) return;
    state.playing = true;
    const tick = ()=>{
      if(state.stepIndex >= state.steps){ stop(); return; }
      state.stepIndex++;
      render(state.stepIndex);
    };
    const interval = Math.max(200, BASE_INTERVAL / state.speed);
    state.timer = setInterval(tick, interval);
    try{
      if(els.playBtn) els.playBtn.classList.add('playing');
      if(els.pauseBtn) els.pauseBtn.classList.remove('paused');
    }catch(_){ }
  }

  function pause(){ stop(); }

  function reset(){
    stop();
    state.stepIndex = 0;
    render(state.stepIndex);
  }

  function singleStep(){
    if(!state.model) return;
    if(state.stepIndex < state.steps){
      state.stepIndex++;
      render(state.stepIndex);
      try{
        const rows = els.searchPanel.querySelectorAll('.table .table-row');
        const activeIdx = Math.max(0, Math.min(rows.length-1, state.stepIndex - state.segments.search.start));
        const row = rows[activeIdx]; if(row) pulse(row);
      }catch(_){ }
    }
  }

  function onGenerate(){
    try{
      els.logPanel.textContent = '';
      const ref = els.refInput.value;
      const read = els.readInput.value;
      const model = buildModel(ref, read);
      const plan = planSteps(model);
      state.model = model;
      state.segments = plan.segments;
      state.steps = plan.total - 1;
      state.stepIndex = 0;
      render(0);
      log('生成成功：已构建 BWT/F/Occ/C 与回溯步骤');

      // sync params
      syncParamsFromUI();
      // compute SMEMs & chain & mapq
      state.smems = findSMEMs(model.text, model.pattern, state.params.minSeed, state.params.maxOcc, state.params.enableRC, state.params.enableReseed);
      renderSMEM(model, state.smems);
      state.chains = computeChain(model, state.smems);
      drawChain(model, state.chains);
      const sw = simulateBandedSW(model, state.chains); renderSW(sw); drawSWMatrix(model, state.chains, sw);
      state.mapq = approxMAPQ(state.chains, state.smems); renderMAPQ(state.mapq);
    }catch(e){
      log('错误：' + e.message);
      console.error(e);
    }
  }

  els.generateBtn.addEventListener('click', ()=>{ onGenerate(); });
  els.playBtn.addEventListener('click', ()=>{ play(); });
  els.pauseBtn.addEventListener('click', ()=>{ pause(); });
  els.stepBtn.addEventListener('click', ()=>{ singleStep(); });
  els.resetBtn.addEventListener('click', ()=>{ reset(); });

  els.speedRange.addEventListener('input', ()=>{
    const v = parseFloat(els.speedRange.value||'1');
    state.speed = v;
    els.speedLabel.textContent = v.toFixed(2).replace(/\.00$/, '') + '×';
    if(state.playing){ stop(); play(); }
  });

  els.toggleOcc.addEventListener('change', ()=>{
    els.occSection.style.display = els.toggleOcc.checked ? '' : 'none';
    render(state.stepIndex);
  });

  onGenerate();

  // tabs
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=> activateTab(btn.dataset.tab));
  });
  // default active tab is smem
  activateTab('smem');

  // ---------- Params ----------
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function syncParamsFromUI(){
    if(!els.paramMinSeed) return;
    const p = state.params;
    p.minSeed = clamp(parseInt(els.paramMinSeed.value||p.minSeed), 1, 100);
    p.maxOcc = clamp(parseInt(els.paramMaxOcc.value||p.maxOcc), 1, 1000);
    p.chainWin = clamp(parseInt(els.paramChainWin.value||p.chainWin), 10, 100000);
    p.gapOpen = clamp(parseInt(els.paramGapOpen.value||p.gapOpen), 1, 20);
    p.gapExtend = clamp(parseInt(els.paramGapExtend.value||p.gapExtend), 0, 10);
    p.swBand = clamp(parseInt(els.paramSWBand.value||p.swBand), 1, 64);
    p.zdrop = clamp(parseInt(els.paramZDrop.value||p.zdrop), 1, 200);
    p.diagSlack = clamp(parseInt(els.paramDiagSlack.value||p.diagSlack), 0, 2000);
    p.overlapPenalty = clamp(parseInt(els.paramOverlapPenalty.value||p.overlapPenalty), 0, 50);
    p.enableRC = !!els.paramEnableRC.checked;
    p.enableReseed = !!els.paramEnableReseed.checked;
  }
  function applyParams(){
    if(!state.model) return;
    syncParamsFromUI();
    // recompute pipeline under new params
    state.smems = findSMEMs(state.model.text, state.model.pattern, state.params.minSeed, state.params.maxOcc, state.params.enableRC, state.params.enableReseed);
    renderSMEM(state.model, state.smems);
    state.chains = computeChain(state.model, state.smems);
    drawChain(state.model, state.chains);
    const sw = simulateBandedSW(state.model, state.chains);
    renderSW(sw);
    drawSWMatrix(state.model, state.chains, sw);
    state.mapq = approxMAPQ(state.chains, state.smems);
    renderMAPQ(state.mapq);
  }
  if(els.applyParamsBtn){ els.applyParamsBtn.addEventListener('click', applyParams); }

  // export PNG for canvases
  function exportCanvasPNG(canvas, name){
    try{
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = name || 'export.png'; a.click();
    }catch(e){ log('导出失败：' + e.message); }
  }
  const exportChainBtn = document.getElementById('exportChainBtn');
  if(exportChainBtn && els.chainCanvas){ exportChainBtn.addEventListener('click', ()=> exportCanvasPNG(els.chainCanvas, 'chain.png')); }
  const exportSWBtn = document.getElementById('exportSWBtn');
  if(exportSWBtn && els.swCanvas){ exportSWBtn.addEventListener('click', ()=> exportCanvasPNG(els.swCanvas, 'sw.png')); }

  // tooltip for chain
  const chainTooltip = document.getElementById('chainTooltip');
  if(els.chainCanvas && chainTooltip){
    els.chainCanvas.addEventListener('mousemove', (ev)=>{
      const rect = els.chainCanvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * DPR; const y = (ev.clientY - rect.top) * DPR;
      const cache = els.chainCanvas._chainCache; if(!cache){ chainTooltip.style.display='none'; return; }
      const hit = cache.boxes?.find(b => x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h);
      if(hit){
        chainTooltip.style.display='block';
        chainTooltip.textContent = `ref:[${hit.s.refStart},${hit.s.refEnd}) read:[${hit.s.readStart},${hit.s.readEnd}) len=${hit.s.len}`;
        chainTooltip.style.left = (ev.clientX + 12) + 'px';
        chainTooltip.style.top = (ev.clientY + 12) + 'px';
      }else{
        chainTooltip.style.display='none';
      }
    });
    els.chainCanvas.addEventListener('mouseleave', ()=>{ chainTooltip.style.display='none'; });
  }

  // ---------- SW Matrix Drawing (banded) ----------
  function drawSWMatrix(model, chains, swStat){
    if(!els.swCanvas || !chains || !chains.pathIdx || chains.pathIdx.length===0) return;
    const canvas = els.swCanvas;
    const ctx = canvas.getContext('2d');
    // scale for DPR
    const viewW = canvas.width, viewH = canvas.height;
    if(DPR && (canvas.dataset.scaled!=='1')){
      canvas.style.width = viewW + 'px';
      canvas.style.height = viewH + 'px';
      canvas.width = Math.floor(viewW * DPR);
      canvas.height = Math.floor(viewH * DPR);
      canvas.dataset.scaled = '1';
    }
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    const margin = 40 * DPR;
    const first = chains.cands[chains.pathIdx[0]];
    const refStart = Math.max(0, (swStat?.refStart!=null?swStat.refStart:first.refStart) - 0);
    const pat = model.pattern;
    const ref = model.text.slice(refStart);
    const maxPat = Math.min(60, pat.length);
    const maxRef = Math.min(60 + 20, ref.length);
    const n = maxPat, m = maxRef; // rows (pattern), cols (ref)
    if(n<=0 || m<=0){ return; }
    const cellSize = Math.max(6*DPR, Math.min(14*DPR, Math.min((W - margin*2)/m, (H - margin*2)/n)));
    const ox = margin, oy = margin;
    // DP arrays (banded)
    const w = state.params.swBand;
    const match = 2, mismatch = -1, gap = -1;
    const S = new Array((n+1)*(m+1)).fill(0);
    const T = new Array((n+1)*(m+1)).fill(0); // 0 none, 1 diag, 2 up, 3 left
    const idx = (i,j)=> i*(m+1)+j;
    let best = 0, bi = 0, bj = 0;
    for(let i=1;i<=n;i++){
      const lo = Math.max(1, i - w);
      const hi = Math.min(m, i + w);
      for(let j=lo;j<=hi;j++){
        const scoreDiag = S[idx(i-1,j-1)] + (pat[i-1]===ref[j-1] ? match : mismatch);
        const scoreUp = S[idx(i-1,j)] + gap;
        const scoreLeft = S[idx(i,j-1)] + gap;
        let sc = scoreDiag, tr = 1;
        if(scoreUp > sc){ sc = scoreUp; tr = 2; }
        if(scoreLeft > sc){ sc = scoreLeft; tr = 3; }
        if(sc < 0){ sc = 0; tr = 0; }
        S[idx(i,j)] = sc; T[idx(i,j)] = tr;
        if(sc > best){ best = sc; bi = i; bj = j; }
      }
    }
    // traceback
    const path = [];
    let ti = bi, tj = bj;
    while(ti>0 && tj>0){
      const tr = T[idx(ti,tj)];
      if(tr===0) break;
      path.push([ti,tj]);
      if(tr===1){ ti--; tj--; }
      else if(tr===2){ ti--; }
      else if(tr===3){ tj--; }
    }
    // draw cells (band only)
    for(let i=1;i<=n;i++){
      const lo = Math.max(1, i - w);
      const hi = Math.min(m, i + w);
      for(let j=lo;j<=hi;j++){
        const sc = S[idx(i,j)];
        const x = ox + (j-1)*cellSize;
        const y = oy + (i-1)*cellSize;
        const t = Math.min(1, sc/10);
        ctx.fillStyle = `rgba(106,161,255,${0.15 + 0.55*t})`;
        ctx.fillRect(x,y,cellSize,cellSize);
      }
    }
    // grid lines (sparse)
    ctx.strokeStyle = 'rgba(42,59,102,0.8)'; ctx.lineWidth = 1;
    for(let i=0;i<=n;i++){
      const y = oy + i*cellSize; ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + m*cellSize, y); ctx.stroke();
    }
    for(let j=0;j<=m;j++){
      const x = ox + j*cellSize; ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy + n*cellSize); ctx.stroke();
    }
    // highlight band borders
    ctx.strokeStyle = '#6affc1'; ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, m*cellSize, n*cellSize);
    // draw path
    if(path.length){
      ctx.strokeStyle = '#f7768e'; ctx.lineWidth = Math.max(2, 2*DPR);
      const tNow = canvas._animTime || performance.now();
      const dur = 1000;
      const t0 = canvas._swStartTime || tNow; if(!canvas._swStartTime) canvas._swStartTime = tNow;
      const p = Math.min(1, (tNow - t0)/dur);
      const nDraw = Math.max(1, Math.floor(path.length * p));
      ctx.beginPath();
      for(let k=0;k<nDraw;k++){
        const [i,j] = path[path.length-1-k];
        const cx = ox + (j-0.5)*cellSize; const cy = oy + (i-0.5)*cellSize;
        if(k===0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  }
})();
