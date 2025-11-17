export function sanitizeSeq(s){ return (s||'').toUpperCase().replace(/[^A-Z]/g,''); }

export function buildDP(a, b, { match=2, mismatch=-1, gap=-1, mode='sw' }={}){
  a = sanitizeSeq(a); b = sanitizeSeq(b);
  const n = a.length, m = b.length; const rows = n+1, cols = m+1;
  const S = new Array(rows*cols).fill(0); const T = new Array(rows*cols).fill(0);
  const idx = (i,j)=> i*cols + j;
  if(mode==='nw'){
    for(let i=1;i<=n;i++){ S[idx(i,0)] = gap*i; T[idx(i,0)] = 2; }
    for(let j=1;j<=m;j++){ S[idx(0,j)] = gap*j; T[idx(0,j)] = 3; }
  }
  const steps = [];
  for(let i=1;i<=n;i++){
    for(let j=1;j<=m;j++){
      const sDiag = S[idx(i-1,j-1)] + (a[i-1]===b[j-1]?match:mismatch);
      const sUp = S[idx(i-1,j)] + gap;
      const sLeft = S[idx(i,j-1)] + gap;
      let sc = sDiag, tr = 1;
      if(sUp > sc){ sc = sUp; tr = 2; }
      if(sLeft > sc){ sc = sLeft; tr = 3; }
      if(mode==='sw' && sc<0){ sc = 0; tr = 0; }
      steps.push({i,j, sDiag, sUp, sLeft, sc, tr});
      S[idx(i,j)] = sc; T[idx(i,j)] = tr;
    }
  }
  return { a, b, rows, cols, S, T, steps };
}

export function traceback(dp, mode='sw'){
  const { a, b, rows, cols, S, T } = dp; const n=a.length, m=b.length;
  const idx = (i,j)=> i*cols + j;
  let bi = 0, bj = 0, best = -Infinity;
  if(mode==='sw'){
    for(let i=0;i<=n;i++){ for(let j=0;j<=m;j++){ const v = S[idx(i,j)]; if(v>best){ best=v; bi=i; bj=j; } } }
  }else{ bi=n; bj=m; best = S[idx(bi,bj)]; }
  const path = []; let ti=bi, tj=bj;
  while(ti>0 && tj>0){ const tr = T[idx(ti,tj)]; if(mode==='sw' && S[idx(ti,tj)]===0) break; if(tr===0) break; path.push([ti,tj]); if(tr===1){ ti--; tj--; } else if(tr===2){ ti--; } else if(tr===3){ tj--; } else break; }
  path.reverse();
  // 生成对齐字符串
  let ai = 0, bi2 = 0; const al = [], bl = [];
  let pi = 0, pj = 0; for(const [i,j] of path){ const di=i-pi, dj=j-pj; if(di===1 && dj===1){ al.push(a[i-1]); bl.push(b[j-1]); } else if(di===1 && dj===0){ al.push(a[i-1]); bl.push('-'); } else if(di===0 && dj===1){ al.push('-'); bl.push(b[j-1]); } pi=i; pj=j; }
  return { score: best, path, alignA: al.join(''), alignB: bl.join('') };
}