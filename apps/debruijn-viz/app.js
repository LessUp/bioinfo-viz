(function(){
  const els = {
    refSeq: document.getElementById('refSeq'),
    kVal: document.getElementById('kVal'),
    buildBtn: document.getElementById('buildBtn'),
    playBtn: document.getElementById('playBtn'),
    resetBtn: document.getElementById('resetBtn'),
    logPanel: document.getElementById('logPanel'),
    kmerPanel: document.getElementById('kmerPanel'),
    buildPanel: document.getElementById('buildPanel'),
    graphCanvas: document.getElementById('graphCanvas'),
  };

  const state = { text: 'ATGATGAC', k: 3, nodes: [], edges: [], euler: [], playing: false, timer: null };
  function sanitizeDNA(s){ return (s||'').toUpperCase().replace(/[^ACGT]/g,''); }
  function log(msg){ const d=document.createElement('div'); d.textContent=msg; els.logPanel.appendChild(d); els.logPanel.scrollTop=els.logPanel.scrollHeight; }

  function build(){
    state.text = sanitizeDNA(els.refSeq.value); state.k = Math.max(2, Math.min(10, parseInt(els.kVal.value||'3')));
    const kmers = []; for(let i=0;i+state.k<=state.text.length;i++){ kmers.push(state.text.slice(i,i+state.k)); }
    const nodesMap = new Map(); const edges = [];
    for(const kmer of kmers){ const u = kmer.slice(0,state.k-1), v = kmer.slice(1); if(!nodesMap.has(u)) nodesMap.set(u,{id:u}); if(!nodesMap.has(v)) nodesMap.set(v,{id:v}); edges.push({u,v,kmer}); }
    // compress linear paths: build out-degree/in-degree
    const degIn = new Map(), degOut = new Map(); for(const e of edges){ degOut.set(e.u,(degOut.get(e.u)||0)+1); degIn.set(e.v,(degIn.get(e.v)||0)+1); }
    state.nodes = Array.from(nodesMap.values()); state.edges = edges;
    // Euler trail on multigraph using Hierholzer
    const adj = new Map(); for(const e of edges){ const key=e.u; const arr=adj.get(key)||[]; arr.push(e); adj.set(key,arr); }
    let start = state.nodes[0]?.id; for(const n of state.nodes){ const o=degOut.get(n.id)||0, i=degIn.get(n.id)||0; if(o>i){ start=n.id; break; } }
    const stack=[start], path=[]; const used=new Set();
    while(stack.length){ const v=stack[stack.length-1]; const arr=adj.get(v)||[]; const e=arr.find(x=>!x._used); if(e){ e._used=true; stack.push(e.v); } else { path.push(stack.pop()); } }
    path.reverse(); state.euler = path;
    // panels
    els.kmerPanel.textContent = kmers.join(' ');
    els.buildPanel.textContent = `节点数=${state.nodes.length} 边数=${state.edges.length} Euler起点=${start}`;
    draw(0);
    log('构建完成');
  }

  function draw(progress){
    const canvas=els.graphCanvas; const ctx=canvas.getContext('2d'); const W=canvas.width, H=canvas.height; ctx.clearRect(0,0,W,H);
    // layout circle
    const R=Math.min(W,H)/2-60; const cx=W/2, cy=H/2; const pos=new Map();
    for(let i=0;i<state.nodes.length;i++){ const a=i/state.nodes.length*2*Math.PI; const x=cx+R*Math.cos(a), y=cy+R*Math.sin(a); pos.set(state.nodes[i].id,{x,y}); }
    // edges
    ctx.strokeStyle='#2a3b66'; ctx.lineWidth=1;
    for(const e of state.edges){ const p1=pos.get(e.u), p2=pos.get(e.v); if(!p1||!p2) continue; ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke(); }
    // nodes
    for(const n of state.nodes){ const p=pos.get(n.id); ctx.fillStyle='#0c1322'; ctx.strokeStyle='#2a3b66'; ctx.beginPath(); ctx.arc(p.x,p.y,18,0,2*Math.PI); ctx.fill(); ctx.stroke(); ctx.fillStyle='#e8edf4'; ctx.font='12px monospace'; ctx.textAlign='center'; ctx.fillText(n.id,p.x,p.y+4); }
    // Euler path highlight
    if(state.euler && state.euler.length>1){ const max=Math.floor(Math.min(progress, state.euler.length-1)); ctx.strokeStyle='#6affc1'; ctx.lineWidth=3; ctx.beginPath(); for(let i=0;i<max;i++){ const a=state.euler[i], b=state.euler[i+1]; const p1=pos.get(a), p2=pos.get(b); if(i===0){ ctx.moveTo(p1.x,p1.y); } ctx.lineTo(p2.x,p2.y);} ctx.stroke(); }
  }

  function play(){ if(state.playing) return; state.playing=true; let t=0; const tick=()=>{ if(t>=state.euler.length){ reset(); return; } draw(t++); }; state.timer=setInterval(tick, 160); }
  function reset(){ if(state.timer){ clearInterval(state.timer); state.timer=null; } state.playing=false; draw(0); }

  els.buildBtn.addEventListener('click', build);
  els.playBtn.addEventListener('click', play);
  els.resetBtn.addEventListener('click', reset);
  build();
})();