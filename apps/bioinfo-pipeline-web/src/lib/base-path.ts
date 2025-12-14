const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const BASE_PATH = rawBasePath === '/' ? '' : rawBasePath.replace(/\/$/, '')

export function withBasePath(path: string) {
  if (!BASE_PATH) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${BASE_PATH}${normalized}`
}
