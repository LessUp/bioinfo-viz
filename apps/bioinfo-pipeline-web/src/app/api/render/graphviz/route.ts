import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const dot: string = body?.dot || ''
    if (!dot || typeof dot !== 'string') {
      return NextResponse.json({ error: 'invalid dot' }, { status: 400 })
    }
    const res = await fetch('https://kroki.io/graphviz/svg', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: dot,
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `kroki failed ${res.status}: ${text}` }, { status: 502 })
    }
    const svg = await res.text()
    return new NextResponse(svg, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=60' } })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}