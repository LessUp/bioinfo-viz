import type { NextConfig } from 'next'
import path from 'path'

const rawBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '')
const basePath = rawBasePath === '/' ? '' : rawBasePath

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath,
  reactCompiler: true,
  typedRoutes: true,
  turbopack: {
    root: path.join(__dirname, '..', '..'),
  },
}

export default nextConfig
