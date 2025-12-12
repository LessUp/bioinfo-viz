export async function jsonFetcher<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Request failed ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export function getApi<T>(path: string): Promise<T> {
  return jsonFetcher<T>(path, { cache: 'no-store' })
}
