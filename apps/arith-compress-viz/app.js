'use strict'
;(function () {
  // DOM references
  const el = {
    inputText: document.getElementById('inputText'),
    useSample: document.getElementById('useSample'),
    modelType: document.getElementById('modelType'),
    buildModel: document.getElementById('buildModel'),

    alphabetSize: document.getElementById('alphabetSize'),
    textLength: document.getElementById('textLength'),
    modelTableBody: document.querySelector('#modelTable tbody'),

    resetBtn: document.getElementById('resetBtn'),
    stepBtn: document.getElementById('stepBtn'),
    playBtn: document.getElementById('playBtn'),
    speed: document.getElementById('speed'),
    speedLabel: document.getElementById('speedLabel'),

    stepIdx: document.getElementById('stepIdx'),
    stepTotal: document.getElementById('stepTotal'),
    currSymbol: document.getElementById('currSymbol'),
    lowVal: document.getElementById('lowVal'),
    highVal: document.getElementById('highVal'),
    rangeVal: document.getElementById('rangeVal'),
    bitsVal: document.getElementById('bitsVal'),

    barGlobal: document.getElementById('barGlobal'),
    barZoom: document.getElementById('barZoom'),

    finalVal: document.getElementById('finalVal'),
    finalBin: document.getElementById('finalBin'),
    decodedText: document.getElementById('decodedText'),
    tVal: document.getElementById('tVal'),
    bitPrefix: document.getElementById('bitPrefix'),

    modeEncode: document.getElementById('modeEncode'),
    modeDecode: document.getElementById('modeDecode'),
    decodeValue: document.getElementById('decodeValue'),
    decodeLen: document.getElementById('decodeLen'),
    fillFromEncode: document.getElementById('fillFromEncode'),
    buildDecode: document.getElementById('buildDecode'),

    recBtn: document.getElementById('recBtn'),
    snapBtn: document.getElementById('snapBtn'),
    exportAllBtn: document.getElementById('exportAllBtn'),
    exportGifBtn: document.getElementById('exportGifBtn'),
    exportPptBtn: document.getElementById('exportPptBtn'),

    scrubber: document.getElementById('scrubber'),
    scrubLabel: document.getElementById('scrubLabel'),

    mermaidType: document.getElementById('mermaidType'),
    renderMermaid: document.getElementById('renderMermaid'),
    copyMermaid: document.getElementById('copyMermaid'),
    mermaidOut: document.getElementById('mermaidOut'),

    tooltip: document.getElementById('tooltip'),
    showCaption: document.getElementById('showCaption'),
    caption: document.getElementById('caption'),
    mermaidAuto: document.getElementById('mermaidAuto'),
    saveMermaidPng: document.getElementById('saveMermaidPng'),
  }

  // State
  const state = {
    text: '',
    symbols: [], // sorted unique symbols
    counts: new Map(),
    probs: new Map(),
    cumList: [], // [{ch, p, cumLow, cumHigh, count}]
    cumMap: new Map(), // ch -> {p, low, high, count}

    steps: [], // [{i, ch, prevLow, prevHigh, low, high, range, cumLow, cumHigh}]
    stepIdx: 0, // 0..steps.length

    playing: false,
    timerId: null,
    speed: 1.0,

    // mode & decode
    mode: 'encode', // 'encode' | 'decode'
    codeValue: null, // for decode
    targetLen: 0, // for decode
    decoded: '',
    modelMode: 'static', // 'static' | 'adaptive'

    // recording
    rec: {
      active: false,
      canvas: null,
      ctx: null,
      recorder: null,
      chunks: [],
      fps: 30,
    },

    // cache last encode result
    lastEncode: { bits: null, k: 0, value: null },

    // animation
    anim: {
      active: false,
      index: 0,
      start: 0,
      duration: 280,
      fromLow: 0,
      fromHigh: 1,
      toLow: 0,
      toHigh: 1,
    },
    rafId: null,

    // mermaid
    mermaidText: '',
    cumLists: [],
    mermaidSyncIdx: -1,
  }

  // Utils
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
  const formatNum = (x, digits = 8) => {
    if (!isFinite(x)) return String(x)
    if (Math.abs(x) < 1e-9) return '0'
    return Number(x)
      .toPrecision(10)
      .replace(/\.0+$/, '')
      .replace(/(\..*?)0+$/, '$1')
  }
  const formatPct = (x) => (x * 100).toFixed(2) + '%'
  const colorForSymbol = (ch) => {
    // Deterministic color by hash
    let h = 0
    for (let i = 0; i < ch.length; i++) h = (h * 131 + ch.charCodeAt(i)) % 360
    return `hsl(${h}, 65%, 56%)`
  }
  const lighten = (hslStr, by = 10) => {
    // naive lighten: replace L% value
    return hslStr.replace(/(\d+\.\d+|\d+)%\)$/, (m) => {
      const v = parseFloat(m)
      return `${clamp(v + by, 0, 100)}%)`
    })
  }

  function dprCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    if (
      canvas.width !== Math.round(rect.width * dpr) ||
      canvas.height !== Math.round(rect.height * dpr)
    ) {
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
    }
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return ctx
  }

  // Adaptive helpers
  function buildCumListFromCounts(counts, symbols) {
    let total = 0
    for (const ch of symbols) {
      total += counts.get(ch) || 0
    }
    let cum = 0
    const cumList = []
    for (const ch of symbols) {
      const c = counts.get(ch) || 0
      const p = c / total
      const low = cum
      const high = cum + p
      cumList.push({ ch, p, cumLow: low, cumHigh: high, count: c })
      cum = high
    }
    if (cumList.length > 0) {
      cumList[cumList.length - 1].cumHigh = 1
    }
    return cumList
  }

  function buildAdaptiveEncode(text, symbols) {
    const counts = new Map()
    for (const ch of symbols) {
      counts.set(ch, 1)
    } // Laplace smoothing
    const cumLists = []
    const steps = []
    let low = 0,
      high = 1
    for (let i = 0; i < text.length; i++) {
      const cumList = buildCumListFromCounts(counts, symbols)
      cumLists.push(cumList)
      const ch = text[i]
      const row = cumList.find((r) => r.ch === ch)
      if (!row) throw new Error('自适应模型缺少字符: ' + ch)
      const range = high - low
      const nlow = low + range * row.cumLow
      const nhigh = low + range * row.cumHigh
      steps.push({
        i,
        ch,
        prevLow: low,
        prevHigh: high,
        low: nlow,
        high: nhigh,
        range: nhigh - nlow,
        cumLow: row.cumLow,
        cumHigh: row.cumHigh,
      })
      low = nlow
      high = nhigh
      counts.set(ch, (counts.get(ch) || 0) + 1)
    }
    return {
      steps,
      cumLists,
      initial: buildCumListFromCounts(new Map(Array.from(symbols, (s) => [s, 1])), symbols),
    }
  }

  function buildAdaptiveDecode(codeValue, symbols, targetLen) {
    const counts = new Map()
    for (const ch of symbols) {
      counts.set(ch, 1)
    }
    const cumLists = []
    const steps = []
    let low = 0,
      high = 1
    const eps = 1e-12
    for (let i = 0; i < targetLen; i++) {
      const cumList = buildCumListFromCounts(counts, symbols)
      cumLists.push(cumList)
      const range = high - low
      if (!(range > 0)) break
      let t = (codeValue - low) / range
      t = Math.max(0, Math.min(1 - eps, t))
      let found = null
      for (const row of cumList) {
        if (t >= row.cumLow - eps && t < row.cumHigh - eps) {
          found = row
          break
        }
      }
      if (!found) break
      const nlow = low + range * found.cumLow
      const nhigh = low + range * found.cumHigh
      steps.push({
        i,
        ch: found.ch,
        prevLow: low,
        prevHigh: high,
        low: nlow,
        high: nhigh,
        range: nhigh - nlow,
        cumLow: found.cumLow,
        cumHigh: found.cumHigh,
      })
      low = nlow
      high = nhigh
      counts.set(found.ch, (counts.get(found.ch) || 0) + 1)
    }
    return { steps, cumLists }
  }

  // Build model from text
  function buildModelFromText(text) {
    const n = text.length
    const counts = new Map()
    for (const ch of text) {
      counts.set(ch, (counts.get(ch) || 0) + 1)
    }
    const symbols = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b))
    const probs = new Map()
    for (const ch of symbols) {
      probs.set(ch, counts.get(ch) / n)
    }
    // cumulative
    let cum = 0
    const cumList = []
    const cumMap = new Map()
    for (const ch of symbols) {
      const p = probs.get(ch)
      const low = cum
      const high = cum + p
      cumList.push({ ch, p, cumLow: low, cumHigh: high, count: counts.get(ch) })
      cumMap.set(ch, { p, low, high, count: counts.get(ch) })
      cum = high
    }
    // numerical guard to force last high = 1
    if (cumList.length > 0) cumList[cumList.length - 1].cumHigh = 1
    if (cumList.length > 0) {
      const last = cumMap.get(cumList[cumList.length - 1].ch)
      last.high = 1
    }
    return { symbols, counts, probs, cumList, cumMap, total: n, alphabetSize: symbols.length }
  }

  function buildSteps(text, cumMap) {
    const steps = []
    let low = 0.0,
      high = 1.0
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const c = cumMap.get(ch)
      if (!c) throw new Error(`字符未在模型中: ${ch}`)
      const range = high - low
      const nlow = low + range * c.low
      const nhigh = low + range * c.high
      steps.push({
        i,
        ch,
        prevLow: low,
        prevHigh: high,
        low: nlow,
        high: nhigh,
        range: nhigh - nlow,
        cumLow: c.low,
        cumHigh: c.high,
      })
      low = nlow
      high = nhigh
    }
    return steps
  }

  function estimateBits(range) {
    return Math.max(0, Math.ceil(-Math.log2(range + 1e-18)))
  }

  function deriveBinary(low, high) {
    // Find minimal k<=48 such that exists integer m with ceil((low+eps)*2^k) <= floor((high-eps)*2^k)
    const eps = 1e-12
    const maxBits = 48
    for (let k = 1; k <= maxBits; k++) {
      const pow2 = Math.pow(2, k)
      let L = Math.ceil((low + eps) * pow2)
      let H = Math.floor((high - eps) * pow2)
      if (L <= H) {
        const m = L // choose smallest inside interval
        const bits = m.toString(2).padStart(k, '0')
        const value = m / pow2
        return { bits, k, value }
      }
    }
    // fallback: return midpoint with fixed 24 bits
    const k = 24
    const pow2 = Math.pow(2, k)
    const mid = (low + high) / 2
    const m = Math.floor(mid * pow2)
    const bits = m.toString(2).padStart(k, '0')
    return { bits, k, value: m / pow2 }
  }

  function computeBitPrefix(low, high, maxBits = 64) {
    const eps = 1e-12
    let lo = Math.max(0, Math.min(1 - eps, low))
    let hi = Math.max(0, Math.min(1, high))
    let out = ''
    for (let i = 0; i < maxBits; i++) {
      const l2 = lo * 2,
        h2 = hi * 2
      const bL = Math.floor(l2 + eps)
      const bH = Math.floor(h2 - eps)
      if (bL === bH) {
        out += String(bL)
        lo = l2 - bL
        hi = h2 - bH
      } else {
        break
      }
    }
    return out
  }

  const easeInOut = (t) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  function intervalAtIndex(k) {
    if (k <= 0) return { low: 0, high: 1 }
    const s = state.steps[k - 1]
    return { low: s.low, high: s.high }
  }

  function startTween(newIndex) {
    const from = intervalAtIndex(newIndex - 1)
    const to = intervalAtIndex(newIndex)
    state.anim.active = true
    state.anim.index = newIndex
    state.anim.start = performance.now()
    // duration scales with speed
    const base = 500 // ms
    state.anim.duration = Math.max(120, base / state.speed)
    state.anim.fromLow = from.low
    state.anim.fromHigh = from.high
    state.anim.toLow = to.low
    state.anim.toHigh = to.high
    state.stepIdx = newIndex
    tick()
  }

  function getDisplayInterval(k) {
    if (state.anim.active && state.anim.index === k) {
      const now = performance.now()
      let t = (now - state.anim.start) / state.anim.duration
      if (t >= 1) {
        state.anim.active = false
        return { low: state.anim.toLow, high: state.anim.toHigh }
      }
      t = easeInOut(Math.max(0, Math.min(1, t)))
      const low = state.anim.fromLow + (state.anim.toLow - state.anim.fromLow) * t
      const high = state.anim.fromHigh + (state.anim.toHigh - state.anim.fromHigh) * t
      return { low, high }
    }
    return intervalAtIndex(k)
  }

  function tick() {
    if (state.rafId) cancelAnimationFrame(state.rafId)
    state.rafId = requestAnimationFrame(() => {
      render()
      if (state.anim.active) tick()
    })
  }

  function toBinaryFrac(x, n = 24) {
    let s = ''
    let v = Math.max(0, Math.min(1 - 1e-15, x))
    for (let i = 0; i < n; i++) {
      v *= 2
      if (v >= 1) {
        s += '1'
        v -= 1
      } else {
        s += '0'
      }
    }
    return s
  }

  function parseCodeValue(str) {
    if (!str) return null
    const s = String(str).trim()
    if (!s) return null
    // binary like 0.01011 (only 0/1 after dot)
    if (/^0\.[01]+$/.test(s)) {
      const frac = s.slice(2)
      const m = parseInt(frac, 2)
      return m / Math.pow(2, frac.length)
    }
    // decimal 0.xxxx
    const v = Number(s)
    if (isFinite(v) && v >= 0 && v < 1) return v
    return null
  }

  function buildDecodeSteps(codeValue, cumList, targetLen) {
    const steps = []
    let low = 0.0,
      high = 1.0
    const eps = 1e-12
    for (let i = 0; i < targetLen; i++) {
      const range = high - low
      if (!(range > 0)) break
      // normalize code within current interval
      let t = (codeValue - low) / range
      if (!isFinite(t)) break
      t = Math.max(0, Math.min(1 - eps, t))
      // find symbol
      let found = null
      for (const row of cumList) {
        if (t >= row.cumLow - eps && t < row.cumHigh - eps) {
          found = row
          break
        }
      }
      if (!found) {
        // numeric fallbacks
        for (const row of cumList) {
          if (t >= row.cumLow - 1e-9 && t <= row.cumHigh + 1e-9) {
            found = row
            break
          }
        }
      }
      if (!found) break
      const nlow = low + range * found.cumLow
      const nhigh = low + range * found.cumHigh
      steps.push({
        i,
        ch: found.ch,
        prevLow: low,
        prevHigh: high,
        low: nlow,
        high: nhigh,
        range: nhigh - nlow,
        cumLow: found.cumLow,
        cumHigh: found.cumHigh,
      })
      low = nlow
      high = nhigh
    }
    return steps
  }

  // Table rendering
  function renderModelTable(cumList) {
    const tb = el.modelTableBody
    tb.innerHTML = ''
    for (const row of cumList) {
      const tr = document.createElement('tr')
      const tdCh = document.createElement('td')
      tdCh.textContent = row.ch === ' ' ? '␠(space)' : row.ch
      const tdCnt = document.createElement('td')
      tdCnt.textContent = String(row.count)
      const tdP = document.createElement('td')
      tdP.textContent = formatPct(row.p) + ` (${formatNum(row.p, 6)})`
      const tdCum = document.createElement('td')
      tdCum.textContent = `[${formatNum(row.cumLow, 6)}, ${formatNum(row.cumHigh, 6)})`
      tr.appendChild(tdCh)
      tr.appendChild(tdCnt)
      tr.appendChild(tdP)
      tr.appendChild(tdCum)
      tb.appendChild(tr)
    }
  }

  // Drawing helpers
  function drawGlobal(ctx, width, height, cumList, currLow, currHigh, highlightCh) {
    ctx.clearRect(0, 0, width, height)
    // background
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.fillRect(0, 0, width, height)

    // segments
    for (const row of cumList) {
      const x0 = row.cumLow * width
      const x1 = row.cumHigh * width
      ctx.fillStyle =
        row.ch === highlightCh ? lighten(colorForSymbol(row.ch), 10) : colorForSymbol(row.ch)
      ctx.fillRect(x0, 0, x1 - x0, height)
    }

    // grid and borders
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1)

    // Labels if wide enough
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
    ctx.textBaseline = 'middle'
    for (const row of cumList) {
      const x0 = row.cumLow * width
      const x1 = row.cumHigh * width
      const w = x1 - x0
      if (w > 40) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillText(row.ch, x0 + w / 2 - ctx.measureText(row.ch).width / 2, height / 2)
      }
    }

    // current interval markers
    if (currLow !== undefined && currHigh !== undefined) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(currLow * width, 0)
      ctx.lineTo(currLow * width, height)
      ctx.moveTo(currHigh * width, 0)
      ctx.lineTo(currHigh * width, height)
      ctx.stroke()
    }
  }

  function drawZoom(ctx, width, height, cumList, highlightCh, t) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.fillRect(0, 0, width, height)

    for (const row of cumList) {
      const x0 = row.cumLow * width
      const x1 = row.cumHigh * width
      ctx.fillStyle =
        row.ch === highlightCh ? lighten(colorForSymbol(row.ch), 10) : colorForSymbol(row.ch)
      ctx.fillRect(x0, 0, x1 - x0, height)
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1)

    // t marker in decode mode
    if (typeof t === 'number' && isFinite(t)) {
      const tx = clamp(t, 0, 1) * width
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(tx, 0)
      ctx.lineTo(tx, height)
      ctx.stroke()
    }
  }

  function rebuildZoomCumList(baseCumList, low, high) {
    // For zoomed bar we scale the same probabilities to [0,1], i.e., identical cumLow/cumHigh
    // but we still return a new list to avoid mutating the base one.
    return baseCumList.map((r) => ({
      ch: r.ch,
      p: r.p,
      cumLow: r.cumLow,
      cumHigh: r.cumHigh,
      count: r.count,
    }))
  }

  // Recording helpers
  function ensureRecCanvasDims() {
    if (!state.rec.canvas) return
    const gz = el.barGlobal.getBoundingClientRect()
    const zz = el.barZoom.getBoundingClientRect()
    const width = Math.max(10, Math.floor(Math.max(gz.width, zz.width)))
    const height = Math.floor(gz.height + zz.height + 60)
    if (state.rec.canvas.width !== width || state.rec.canvas.height !== height) {
      state.rec.canvas.width = width
      state.rec.canvas.height = height
    }
  }

  function updateRecFrame() {
    if (!state.rec.active || !state.rec.canvas || !state.rec.ctx) return
    ensureRecCanvasDims()
    const ctx = state.rec.ctx
    const gz = el.barGlobal.getBoundingClientRect()
    const zz = el.barZoom.getBoundingClientRect()
    ctx.fillStyle = '#0f1115'
    ctx.fillRect(0, 0, state.rec.canvas.width, state.rec.canvas.height)
    // draw canvases
    try {
      ctx.drawImage(el.barGlobal, 0, 10, state.rec.canvas.width, gz.height)
      ctx.drawImage(el.barZoom, 0, 20 + gz.height, state.rec.canvas.width, zz.height)
    } catch (_) {
      /* ignore */
    }
    // overlay text
    ctx.fillStyle = '#b8c0cc'
    ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
    const k = state.stepIdx,
      N = state.steps.length
    const mode = state.mode === 'encode' ? '编码' : '解码'
    ctx.fillText(`${mode} 步骤 ${k}/${N}`, 8, state.rec.canvas.height - 36)
    if (state.mode === 'encode') {
      if (N > 0) {
        const last = k > 0 ? state.steps[k - 1] : { low: 0, high: 1 }
        ctx.fillText(
          `low=${formatNum(last.low, 6)}  high=${formatNum(last.high, 6)}`,
          8,
          state.rec.canvas.height - 18
        )
      }
    } else {
      const prefix = state.steps
        .slice(0, k)
        .map((s) => s.ch)
        .join('')
      ctx.fillText(`decoded='${prefix}'`, 8, state.rec.canvas.height - 18)
    }
  }

  // Render current state
  function render() {
    // status
    const k = state.stepIdx // 0..N
    const N = state.steps.length
    el.stepIdx.textContent = String(k)
    el.stepTotal.textContent = String(N)

    let currSymbol = '-'
    const disp = getDisplayInterval(k)
    const currLow = disp.low
    const currHigh = disp.high
    const nextSymbol = k < N ? state.steps[k].ch : '-'

    el.currSymbol.textContent = nextSymbol === ' ' ? '␠' : nextSymbol
    el.lowVal.textContent = formatNum(currLow, 8)
    el.highVal.textContent = formatNum(currHigh, 8)
    el.rangeVal.textContent = formatNum(currHigh - currLow, 8)
    el.bitsVal.textContent = String(estimateBits(currHigh - currLow))

    // bit prefix (encode mode)
    if (state.mode === 'encode') {
      const bp = computeBitPrefix(currLow, currHigh)
      el.bitPrefix.textContent = bp ? `0.${bp}` : '-'
    } else {
      el.bitPrefix.textContent = '-'
    }

    // decoded preview
    if (state.mode === 'decode') {
      const prefix = state.steps
        .slice(0, k)
        .map((s) => s.ch)
        .join('')
      el.decodedText.textContent = prefix.length ? prefix : '-'
    } else {
      el.decodedText.textContent = '-'
    }

    const gctx = dprCanvas(el.barGlobal)
    const gz = el.barGlobal.getBoundingClientRect()
    const renderCum =
      state.modelMode === 'adaptive'
        ? state.cumLists[k] || state.cumLists[state.cumLists.length - 1] || state.cumList
        : state.cumList
    drawGlobal(gctx, gz.width, gz.height, renderCum, currLow, currHigh, nextSymbol)

    const zctx = dprCanvas(el.barZoom)
    const zz = el.barZoom.getBoundingClientRect()
    const zoomCum = rebuildZoomCumList(renderCum, currLow, currHigh)
    let tVal = null
    if (state.mode === 'decode' && state.codeValue != null) {
      const range = currHigh - currLow
      if (range > 0) {
        tVal = (state.codeValue - currLow) / range
      }
    }
    drawZoom(zctx, zz.width, zz.height, zoomCum, nextSymbol, tVal)

    // final info
    if (state.mode === 'encode') {
      if (k === N && N > 0) {
        const last = state.steps[N - 1]
        const { bits, k: bitLen, value } = deriveBinary(last.low, last.high)
        state.lastEncode = { bits, k: bitLen, value }
        el.finalVal.textContent = `${formatNum(last.low, 8)} ~ ${formatNum(last.high, 8)}  中选: ${formatNum(value, 8)}`
        el.finalBin.textContent = `0.${bits}  (${bitLen} bits)`
      } else {
        el.finalVal.textContent = '-'
        el.finalBin.textContent = '-'
      }
    } else {
      if (state.codeValue != null) {
        el.finalVal.textContent = `${formatNum(state.codeValue, 12)}`
        el.finalBin.textContent = `0.${toBinaryFrac(state.codeValue, 24)}`
      } else {
        el.finalVal.textContent = '-'
        el.finalBin.textContent = '-'
      }
    }

    // decoded t value
    if (state.mode === 'decode' && tVal != null && isFinite(tVal)) {
      el.tVal.textContent = formatNum(Math.max(0, Math.min(1, tVal)), 8)
    } else {
      el.tVal.textContent = '-'
    }

    // buttons
    el.stepBtn.disabled = N === 0 || k >= N
    el.resetBtn.disabled = N === 0 || (k === 0 && !state.playing)
    el.playBtn.disabled = N === 0
    el.playBtn.textContent = state.playing ? '暂停' : k >= N ? '重播' : '播放'

    // update recording frame
    updateRecFrame()

    // update scrubber
    if (el.scrubber) {
      el.scrubber.max = String(N)
      el.scrubber.value = String(k)
      if (el.scrubLabel) el.scrubLabel.textContent = `${k}/${N}`
    }

    // captions
    if (el.caption) {
      if (el.showCaption && el.showCaption.checked) {
        let text = ''
        if (state.mode === 'encode') {
          if (k < N) {
            const s = state.steps[k]
            text = `第 ${k + 1}/${N} 步：处理符号 '${s.ch}'，使用累计区间 [${formatNum(s.cumLow, 6)}, ${formatNum(s.cumHigh, 6)}) 将区间更新为 [${formatNum(s.low, 6)}, ${formatNum(s.high, 6)}).`
          } else if (N > 0) {
            const last = state.steps[N - 1]
            const { bits, k: bitLen } = deriveBinary(last.low, last.high)
            text = `编码完成：从最终区间内选择码值，二进制 0.${bits}（${bitLen} bits）。`
          }
        } else {
          if (k < N) {
            const s = state.steps[k]
            const range = s.prevHigh - s.prevLow
            const tNow = range > 0 ? (state.codeValue - s.prevLow) / range : 0
            text = `第 ${k + 1}/${N} 步：t=${formatNum(tNow, 6)} 落在 [${formatNum(s.cumLow, 6)}, ${formatNum(s.cumHigh, 6)})，输出符号 '${s.ch}'，区间更新为 [${formatNum(s.low, 6)}, ${formatNum(s.high, 6)}).`
          } else if (N > 0) {
            text = `解码完成：还原得到 '${state.steps.map((x) => x.ch).join('')}'.`
          }
        }
        el.caption.style.display = ''
        el.caption.textContent = text || ''
      } else {
        el.caption.style.display = 'none'
      }
    }

    // auto sync mermaid with steps
    if (el.mermaidAuto && el.mermaidAuto.checked) {
      const kind = (el.mermaidType && el.mermaidType.value) || 'encode'
      if (kind === 'encode_steps' || kind === 'decode_steps' || kind === 'pie') {
        if (state.mermaidSyncIdx !== k) {
          state.mermaidSyncIdx = k
          renderMermaidNow()
        }
      }
    }
  }

  // Controls
  function stopPlaying() {
    if (state.timerId) {
      clearInterval(state.timerId)
      state.timerId = null
    }
    state.playing = false
    render()
  }

  function startPlaying() {
    if (state.steps.length === 0) return
    if (state.stepIdx >= state.steps.length) {
      state.stepIdx = 0
    }
    state.playing = true
    const baseInterval = 900 // ms
    const interval = Math.max(160, baseInterval / state.speed)
    if (state.timerId) {
      clearInterval(state.timerId)
      state.timerId = null
    }
    state.timerId = setInterval(() => {
      if (state.stepIdx < state.steps.length) {
        startTween(state.stepIdx + 1)
      } else {
        stopPlaying()
      }
    }, interval)
    render()
  }

  // Event bindings
  el.useSample.addEventListener('click', () => {
    const samples = ['BANANA', 'ABRACADABRA', 'HELLO_WORLD', 'TOBEORNOTTOBE', 'LESSUP']
    const s = samples[Math.floor(Math.random() * samples.length)]
    el.inputText.value = s
  })

  el.buildModel.addEventListener('click', () => {
    try {
      stopPlaying()
      const text = el.inputText.value
      if (!text || text.length === 0) {
        alert('请输入要编码的文本')
        return
      }
      if (text.length > 64) {
        const ok = confirm(`输入较长 (${text.length})，可视化范围建议不超过 64 字符。继续吗？`)
        if (!ok) return
      }
      const modelType = el.modelType ? el.modelType.value : 'static'
      if (modelType === 'adaptive') {
        const symbols = Array.from(new Set(Array.from(text))).sort((a, b) => a.localeCompare(b))
        if (!symbols.length) {
          alert('无法从输入构建字母表')
          return
        }
        state.modelMode = 'adaptive'
        state.text = text
        state.symbols = symbols
        const { steps, cumLists, initial } = buildAdaptiveEncode(text, symbols)
        state.cumLists = cumLists
        state.cumList = initial
        state.steps = steps
        state.stepIdx = 0
        el.alphabetSize.textContent = String(symbols.length)
        el.textLength.textContent = String(text.length)
        renderModelTable(initial)
      } else {
        const model = buildModelFromText(text)
        if (model.alphabetSize === 0) {
          alert('无法从输入构建模型')
          return
        }
        state.modelMode = 'static'
        state.text = text
        state.symbols = model.symbols
        state.counts = model.counts
        state.probs = model.probs
        state.cumList = model.cumList
        state.cumMap = model.cumMap
        state.steps = buildSteps(text, model.cumMap)
        state.stepIdx = 0
        el.alphabetSize.textContent = String(model.alphabetSize)
        el.textLength.textContent = String(model.total)
        renderModelTable(model.cumList)
      }

      // enable controls
      el.resetBtn.disabled = true
      el.stepBtn.disabled = state.steps.length === 0
      el.playBtn.disabled = state.steps.length === 0

      render()
      renderMermaidNow()
    } catch (err) {
      console.error(err)
      alert('构建模型失败：' + err.message)
    }
  })

  // Mode toggle
  el.modeEncode.addEventListener('click', () => {
    stopPlaying()
    state.mode = 'encode'
    el.modeEncode.classList.add('primary')
    el.modeDecode.classList.remove('primary')
    state.stepIdx = 0
    // keep current encode steps
    render()
  })

  el.modeDecode.addEventListener('click', () => {
    if (!state.cumList.length) {
      alert('请先生成模型')
      return
    }
    stopPlaying()
    state.mode = 'decode'
    el.modeDecode.classList.add('primary')
    el.modeEncode.classList.remove('primary')
    state.steps = []
    state.stepIdx = 0
    render()
  })

  // Build decode steps
  el.buildDecode.addEventListener('click', () => {
    try {
      if (state.modelMode === 'static') {
        if (!state.cumList.length) {
          alert('请先生成模型')
          return
        }
      } else {
        if (!state.symbols || !state.symbols.length) {
          alert('请先通过输入文本生成模型以确定字母表')
          return
        }
      }
      stopPlaying()
      const v = parseCodeValue(el.decodeValue.value)
      if (v == null) {
        alert('请输入有效的码值：二进制 0.01... 或十进制 0.xxxx')
        return
      }
      let L = parseInt(el.decodeLen.value, 10)
      if (!(L > 0)) {
        if (state.text && state.text.length > 0) L = state.text.length
        else {
          alert('请填写解码步数')
          return
        }
      }
      let steps, cumLists
      if (state.modelMode === 'adaptive') {
        const out = buildAdaptiveDecode(v, state.symbols, L)
        steps = out.steps
        cumLists = out.cumLists
      } else {
        steps = buildDecodeSteps(v, state.cumList, L)
      }
      if (steps.length < L) {
        const ok = confirm(`仅生成了 ${steps.length}/${L} 步（可能数值边界导致）。继续？`)
        if (!ok) return
      }
      state.mode = 'decode'
      el.modeDecode.classList.add('primary')
      el.modeEncode.classList.remove('primary')
      state.codeValue = v
      state.targetLen = L
      state.steps = steps
      if (state.modelMode === 'adaptive') {
        state.cumLists = cumLists
      }
      state.stepIdx = 0
      render()
    } catch (err) {
      console.error(err)
      alert('构建解码失败：' + err.message)
    }
  })

  // Fill decode value from encode result
  el.fillFromEncode.addEventListener('click', () => {
    if (state.lastEncode && state.lastEncode.value != null) {
      el.decodeValue.value = formatNum(state.lastEncode.value, 16)
      if (state.text && state.text.length > 0) {
        el.decodeLen.value = String(state.text.length)
      }
    } else {
      alert('请先完成一次编码以获取码值')
    }
  })

  // Recording & snapshot
  function startRecording() {
    if (state.rec.active) return
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    state.rec.canvas = canvas
    state.rec.ctx = ctx
    ensureRecCanvasDims()
    const stream = canvas.captureStream(state.rec.fps)
    if (!('MediaRecorder' in window)) {
      alert('此浏览器不支持 MediaRecorder')
      return
    }
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
    state.rec.chunks = []
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) state.rec.chunks.push(e.data)
    }
    mr.onstop = () => {
      const blob = new Blob(state.rec.chunks, { type: 'video/webm' })
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      const name = `arith-${state.mode}-${ts}.webm`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    state.rec.recorder = mr
    mr.start()
    state.rec.active = true
    el.recBtn.textContent = '停止录制(WebM)'
    updateRecFrame()
  }

  function stopRecording() {
    if (!state.rec.active) return
    state.rec.active = false
    try {
      state.rec.recorder && state.rec.recorder.stop()
    } catch (_) {
      /* ignore */
    }
    state.rec.recorder = null
    el.recBtn.textContent = '开始录制(WebM)'
  }

  el.recBtn.addEventListener('click', () => {
    if (!state.rec.active) startRecording()
    else stopRecording()
  })

  el.snapBtn.addEventListener('click', () => {
    // compose once into a temp canvas
    const tmp = document.createElement('canvas')
    const gz = el.barGlobal.getBoundingClientRect()
    const zz = el.barZoom.getBoundingClientRect()
    tmp.width = Math.max(gz.width, zz.width)
    tmp.height = Math.floor(gz.height + zz.height + 60)
    const ctx = tmp.getContext('2d')
    ctx.fillStyle = '#0f1115'
    ctx.fillRect(0, 0, tmp.width, tmp.height)
    try {
      ctx.drawImage(el.barGlobal, 0, 10, tmp.width, gz.height)
    } catch (_) {}
    try {
      ctx.drawImage(el.barZoom, 0, 20 + gz.height, tmp.width, zz.height)
    } catch (_) {}
    ctx.fillStyle = '#b8c0cc'
    ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
    const k = state.stepIdx,
      N = state.steps.length
    const mode = state.mode === 'encode' ? '编码' : '解码'
    ctx.fillText(`${mode} 步骤 ${k}/${N}`, 8, tmp.height - 36)
    const url = tmp.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `arith-${state.mode}-${Date.now()}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })

  // Helpers to capture composite frame
  function captureCompositeFrame() {
    const tmp = document.createElement('canvas')
    const gz = el.barGlobal.getBoundingClientRect()
    const zz = el.barZoom.getBoundingClientRect()
    tmp.width = Math.max(gz.width, zz.width)
    tmp.height = Math.floor(gz.height + zz.height + 60)
    const ctx = tmp.getContext('2d')
    ctx.fillStyle = '#0f1115'
    ctx.fillRect(0, 0, tmp.width, tmp.height)
    try {
      ctx.drawImage(el.barGlobal, 0, 10, tmp.width, gz.height)
    } catch (_) {}
    try {
      ctx.drawImage(el.barZoom, 0, 20 + gz.height, tmp.width, zz.height)
    } catch (_) {}
    ctx.fillStyle = '#b8c0cc'
    ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
    const k = state.stepIdx,
      N = state.steps.length
    const mode = state.mode === 'encode' ? '编码' : '解码'
    ctx.fillText(`${mode} 步骤 ${k}/${N}`, 8, tmp.height - 36)
    return tmp.toDataURL('image/png')
  }

  async function collectAllFrameDataURLs() {
    const N = state.steps.length
    const urls = []
    const savedIdx = state.stepIdx
    for (let i = 0; i <= N; i++) {
      state.stepIdx = i
      state.anim.active = false
      render()
      await new Promise((r) => setTimeout(r, 30))
      urls.push(captureCompositeFrame())
      await new Promise((r) => setTimeout(r, 20))
    }
    state.stepIdx = savedIdx
    render()
    return urls
  }

  // Export GIF via gifshot
  if (el.exportGifBtn) {
    el.exportGifBtn.addEventListener('click', async () => {
      if (!window.gifshot) {
        alert('未加载 gifshot 库')
        return
      }
      const frames = await collectAllFrameDataURLs()
      gifshot.createGIF(
        {
          images: frames,
          gifWidth: el.barGlobal.width,
          gifHeight: el.barGlobal.height + el.barZoom.height + 60,
          interval: 0.7 / state.speed,
          numFrames: frames.length,
        },
        function (obj) {
          if (!obj.error) {
            const a = document.createElement('a')
            a.href = obj.image
            a.download = `arith-${state.mode}-${Date.now()}.gif`
            a.click()
          } else {
            alert('生成GIF失败')
          }
        }
      )
    })
  }

  // Export PPT via PptxGenJS
  if (el.exportPptBtn) {
    el.exportPptBtn.addEventListener('click', async () => {
      if (typeof PptxGenJS === 'undefined') {
        alert('未加载 PptxGenJS')
        return
      }
      const pptx = new PptxGenJS()
      // cover
      let slide = pptx.addSlide()
      slide.addText('算术编码可视化', { x: 0.5, y: 0.5, fontSize: 32, bold: true })
      slide.addText(`输入: ${state.text || '(未设置)'}`, { x: 0.5, y: 1.2, fontSize: 16 })
      slide.addText(`模式: ${state.mode}`, { x: 0.5, y: 1.6, fontSize: 16 })

      // model table
      if (state.cumList && state.cumList.length) {
        const rows = [['符号', '频次', '概率', '累计区间']]
        state.cumList.forEach((r) => {
          rows.push([
            r.ch === ' ' ? '␠' : r.ch,
            String(r.count),
            formatPct(r.p),
            `[${formatNum(r.cumLow, 6)}, ${formatNum(r.cumHigh, 6)})`,
          ])
        })
        const s2 = pptx.addSlide()
        s2.addText('概率模型', { x: 0.5, y: 0.5, fontSize: 24, bold: true })
        s2.addTable(rows, { x: 0.5, y: 1.0, w: 9.0, fontSize: 14 })
      }

      // frames slides
      const frames = await collectAllFrameDataURLs()
      for (let i = 0; i < frames.length; i++) {
        const s = pptx.addSlide()
        s.addText(`${state.mode} 步骤 ${i}/${frames.length - 1}`, { x: 0.5, y: 0.5, fontSize: 18 })
        s.addImage({ data: frames[i], x: 0.5, y: 1.0, w: 9.0 })
      }

      await pptx.writeFile({ fileName: `arith-${state.mode}-${Date.now()}.pptx` })
    })
  }

  // Tooltip helpers
  function showTooltip(x, y, html) {
    if (!el.tooltip) return
    el.tooltip.style.display = 'block'
    el.tooltip.style.left = `${x + 12}px`
    el.tooltip.style.top = `${y + 12}px`
    el.tooltip.innerHTML = html
  }
  function hideTooltip() {
    if (el.tooltip) el.tooltip.style.display = 'none'
  }

  function getCurrentCumList() {
    const k = state.stepIdx
    if (state.modelMode === 'adaptive') {
      return state.cumLists[k] || state.cumLists[state.cumLists.length - 1] || state.cumList
    }
    return state.cumList
  }

  function bindCanvasTooltip(canvas) {
    if (!canvas) return
    canvas.addEventListener('mousemove', (ev) => {
      const rect = canvas.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      const t = clamp(x / Math.max(1, rect.width), 0, 1)
      // find row by t
      const cumList = getCurrentCumList()
      let row = null
      for (const r of cumList) {
        if (t >= r.cumLow && t < r.cumHigh) {
          row = r
          break
        }
      }
      if (!row) return hideTooltip()
      const html =
        `<div><b>符号</b>: ${row.ch === ' ' ? '␠' : row.ch}</div>` +
        `<div><b>p</b>: ${formatPct(row.p)} (${formatNum(row.p, 6)})</div>` +
        `<div><b>区间</b>: [${formatNum(row.cumLow, 6)}, ${formatNum(row.cumHigh, 6)})</div>` +
        `<div><b>宽度</b>: ${formatNum(row.cumHigh - row.cumLow, 6)}</div>`
      showTooltip(ev.clientX, ev.clientY, html)
    })
    canvas.addEventListener('mouseleave', hideTooltip)
  }
  bindCanvasTooltip(el.barGlobal)
  bindCanvasTooltip(el.barZoom)

  // Mermaid diagrams
  function getMermaidText(kind) {
    const esc = (s) => String(s).replace(/[\[\]"]+/g, '')
    if (kind === 'encode') {
      return `flowchart TD
  A[输入文本] --> B[统计频次]
  B --> C[计算概率]
  C --> D[累计区间]
  D --> E{逐符号 s}
  E -->|更新 [low,high) ← low + (high-low) * [cumLow, cumHigh)| E
  E -->|完成| F[选择位于最终区间的码值]
  F --> G[输出二进制 0.x...]
`
    } else if (kind === 'decode') {
      return `flowchart TD
  A[输入码值 v] --> B[概率模型]
  B --> C{循环 i=1..N}
  C --> D[计算 t=(v-low)/(high-low)]
  D --> E[查找 t 所在累计区间]
  E --> F[输出对应符号]
  F --> G[更新 [low,high))
  G --> C
  C -->|完成| H[得到完整文本]
`
    } else if (kind === 'model') {
      return `flowchart TD
  A[输入文本] --> B[统计各符号频次]
  B --> C[概率 p=cnt/总数]
  C --> D[按字符排序并累计]
  D --> E[得到累计区间 [cumLow,cumHigh)]
`
    } else if (kind === 'encode_steps') {
      const steps = state.steps || []
      const N = Math.min(steps.length, 20)
      if (!N) return 'flowchart TD\n  A[尚无步骤，请先编码]'
      let out = 'flowchart TD\n'
      out += `  S0[起始 [0,1)]\n`
      for (let i = 0; i < N; i++) {
        const s = steps[i]
        out +=
          `  S${i} --> S${i + 1}[第${i + 1}步: ch='${esc(s.ch)}'\\n区间[${formatNum(s.low, 6)}, ${formatNum(s.high, 6)}), 子区间[${formatNum(s.cumLow, 4)}, ${formatNum(s.cumHigh, 4)})]` +
          '\n'
      }
      if (steps.length > N) {
        out += `  S${N} --> E[... 共 ${steps.length} 步]\n`
      }
      return out
    } else if (kind === 'decode_steps') {
      const steps = state.steps || []
      const N = Math.min(steps.length, 20)
      if (!N || state.mode !== 'decode') return 'flowchart TD\n  A[尚无解码步骤，请先构建解码]'
      const v = state.codeValue ?? 0
      let out = 'flowchart TD\n'
      out += `  S0[起始 [0,1)]\n`
      for (let i = 0; i < N; i++) {
        const s = steps[i]
        const range = s.prevHigh - s.prevLow
        const t = range > 0 ? (v - s.prevLow) / range : 0
        out +=
          `  S${i} --> S${i + 1}[第${i + 1}步: t=${formatNum(t, 6)} 命中 '${esc(s.ch)}'\\n区间→[${formatNum(s.low, 6)}, ${formatNum(s.high, 6)})]` +
          '\n'
      }
      if (steps.length > N) {
        out += `  S${N} --> E[... 共 ${steps.length} 步]\n`
      }
      return out
    } else if (kind === 'pie') {
      const cum = typeof getCurrentCumList === 'function' ? getCurrentCumList() : state.cumList
      if (!cum || !cum.length) return 'flowchart TD\n  A[尚无模型，请先生成]'
      let out = 'pie title 概率分布\n'
      for (const r of cum) {
        const label = r.ch === ' ' ? 'space(␠)' : r.ch
        const val = Math.max(0, r.p * 100)
        out += `"${esc(label)}" : ${val.toFixed(4)}\n`
      }
      return out
    } else if (kind === 'state_bits') {
      return `stateDiagram-v2
  [*] --> ChooseValue: 选择最终码值 v ∈ [low, high)
  ChooseValue --> ExtractPrefix: 提取公共前缀比特
  ExtractPrefix --> EmitBit: 输出比特到位流
  EmitBit --> ExtractPrefix
  ExtractPrefix --> Done: 若无公共前缀则结束
  Done --> [*]
`
    } else if (kind === 'state_decode') {
      return `stateDiagram-v2
  [*] --> Init: 读取码值 v, 区间 [0,1)
  Init --> Step: 计算 t=(v-low)/(high-low)
  Step --> Locate: 根据 t 定位累计区间 [cumLow,cumHigh)
  Locate --> Emit: 输出对应符号
  Emit --> Update: 更新区间 [low,high)
  Update --> Step
  Step --> Done: 达到目标长度 N
  Done --> [*]
`
    } else if (kind === 'mindmap') {
      return `mindmap
  root((算术编码))
    建模
      统计频次
      概率 p
      累计区间 [cumLow,cumHigh)
    编码
      逐符号收缩 [low,high)
      选择码值 v
      二进制 0.x...
    解码
      t=(v-low)/(high-low)
      选区间→输出符号
      更新区间
    可视化与导出
      画布渲染
      WebM/GIF/PNG/PPT
      Mermaid 图
`
    } else if (kind === 'sequence') {
      return `sequenceDiagram
  participant U as 用户
  participant M as 模型
  participant E as 编码/解码
  participant C as 画布
  U->>M: 输入文本/码值
  M-->>U: 概率/累计区间
  U->>E: 播放/步进/滑块
  E->>C: 渲染全局/缩放条
  E-->>U: 状态(low/high/t/比特)
  U->>C: 导出PNG/GIF/WebM/PPT
`
    } else {
      return `flowchart TD
  A[可视化画布] --> B[录制 WebM]
  A --> C[导出各步骤 PNG]
  C --> D[合成 GIF]
  A --> E[嵌入到 PPT 幻灯片]
`
    }
  }

  function renderMermaidNow() {
    const kind = (el.mermaidType && el.mermaidType.value) || 'encode'
    const txt = getMermaidText(kind)
    state.mermaidText = txt
    if (window.mermaid && el.mermaidOut) {
      const id = 'mmd-' + Date.now()
      mermaid
        .render(id, txt)
        .then(({ svg }) => {
          el.mermaidOut.innerHTML = svg
        })
        .catch(() => {
          el.mermaidOut.textContent = txt
        })
    }
  }

  if (el.renderMermaid) {
    el.renderMermaid.addEventListener('click', renderMermaidNow)
  }
  if (el.mermaidType) {
    el.mermaidType.addEventListener('change', renderMermaidNow)
  }
  if (el.copyMermaid) {
    el.copyMermaid.addEventListener('click', async () => {
      const txt =
        state.mermaidText || getMermaidText((el.mermaidType && el.mermaidType.value) || 'encode')
      try {
        await navigator.clipboard.writeText(txt)
        alert('Mermaid 源码已复制到剪贴板')
      } catch (_) {
        alert('复制失败，请手动选择文本')
      }
    })
  }

  // save Mermaid as PNG
  async function saveMermaidAsPNG() {
    const svgEl = el.mermaidOut ? el.mermaidOut.querySelector('svg') : null
    if (!svgEl) {
      alert('请先渲染 Mermaid 图')
      return
    }
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      const img = new Image()
      // handle foreignObject cross-origin
      img.crossOrigin = 'anonymous'
      const { width, height } = svgEl.getBoundingClientRect()
      const w = Math.max(1, Math.floor(width))
      const h = Math.max(1, Math.floor(height))
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#0f1420'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      const png = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = png
      a.download = `mermaid-${Date.now()}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      URL.revokeObjectURL(url)
      alert('导出 PNG 失败')
    }
  }
  if (el.saveMermaidPng) {
    el.saveMermaidPng.addEventListener('click', saveMermaidAsPNG)
  }

  // Initial Mermaid render
  renderMermaidNow()

  // Export all frames PNG
  async function exportAllFrames() {
    const N = state.steps.length
    if (N === 0) {
      alert('没有可导出的步骤')
      return
    }
    const pad = (n, w) => String(n).padStart(w, '0')
    const widthDigits = String(N).length
    for (let i = 0; i <= N; i++) {
      state.stepIdx = i
      render()
      await new Promise((r) => setTimeout(r, 60))
      const tmp = document.createElement('canvas')
      const gz = el.barGlobal.getBoundingClientRect()
      const zz = el.barZoom.getBoundingClientRect()
      tmp.width = Math.max(gz.width, zz.width)
      tmp.height = Math.floor(gz.height + zz.height + 60)
      const ctx = tmp.getContext('2d')
      ctx.fillStyle = '#0f1115'
      ctx.fillRect(0, 0, tmp.width, tmp.height)
      try {
        ctx.drawImage(el.barGlobal, 0, 10, tmp.width, gz.height)
      } catch (_) {}
      try {
        ctx.drawImage(el.barZoom, 0, 20 + gz.height, tmp.width, zz.height)
      } catch (_) {}
      ctx.fillStyle = '#b8c0cc'
      ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
      ctx.fillText(`${state.mode} 步骤 ${i}/${N}`, 8, tmp.height - 36)
      const url = tmp.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `arith-${state.mode}-${pad(i, widthDigits)}.png`
      a.click()
      await new Promise((r) => setTimeout(r, 30))
    }
  }

  if (el.exportAllBtn) {
    el.exportAllBtn.addEventListener('click', () => {
      exportAllFrames()
    })
  }

  el.resetBtn.addEventListener('click', () => {
    stopPlaying()
    state.stepIdx = 0
    state.anim.active = false
    render()
  })

  el.stepBtn.addEventListener('click', () => {
    stopPlaying()
    if (state.stepIdx < state.steps.length) {
      startTween(state.stepIdx + 1)
    }
  })

  el.playBtn.addEventListener('click', () => {
    if (state.playing) {
      stopPlaying()
    } else {
      if (state.stepIdx >= state.steps.length) {
        state.stepIdx = 0
      }
      startPlaying()
    }
  })

  // Scrubber
  if (el.scrubber) {
    el.scrubber.addEventListener('input', () => {
      const v = parseInt(el.scrubber.value, 10)
      stopPlaying()
      state.stepIdx = clamp(isNaN(v) ? 0 : v, 0, state.steps.length)
      state.anim.active = false
      render()
    })
  }

  el.speed.addEventListener('input', () => {
    const v = parseFloat(el.speed.value)
    state.speed = v
    el.speedLabel.textContent = v.toFixed(2) + 'x'
    if (state.playing) {
      // restart timer with new speed
      startPlaying()
    }
  })

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      if (state.playing) stopPlaying()
      else startPlaying()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      stopPlaying()
      if (state.stepIdx < state.steps.length) {
        state.stepIdx++
        render()
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      stopPlaying()
      if (state.stepIdx > 0) {
        state.stepIdx--
        render()
      }
    }
  })

  // Initial
  el.speed.value = '1'
  el.speedLabel.textContent = '1.00x'
  render()
})()
