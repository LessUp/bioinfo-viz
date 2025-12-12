import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const source: string = body?.source || ''
    if (!source || typeof source !== 'string') {
      return NextResponse.json({ error: 'invalid source' }, { status: 400 })
    }
    const res = await fetch('https://kroki.io/mermaid/svg', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: source,
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `kroki failed ${res.status}: ${text}` }, { status: 502 })
    }
    const svg = await res.text()
    return new NextResponse(svg, {
      headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=60' },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
