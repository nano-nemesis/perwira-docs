import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// Header keamanan untuk semua rute. frame-ancestors mematikan clickjacking (termasuk admin /tuan).
// script-src/style-src memakai 'unsafe-inline' karena Next (hidrasi) dan admin Payload menanam skrip/gaya inline;
// risiko XSS inline sudah ditutup di sumbernya (konten lexical membuang skrip, link disaring sanitizeUrl).
// CSP publik (situs pengunjung): ketat. 'unsafe-inline'/'unsafe-eval' dipakai Next (hidrasi);
// risiko XSS inline sudah ditutup di sumbernya (konten lexical membuang skrip, link disaring sanitizeUrl).
const cspPublik = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self'",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
].join('; ')

// CSP admin (/tuan): sama ketatnya, plus izin editor kode Monaco (dimuat dari jsdelivr + web worker blob).
const cspAdmin = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  "connect-src 'self' https://cdn.jsdelivr.net",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
].join('; ')

const headerDasar = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['yoastseo'],
  async headers() {
    return [
      { source: '/tuan/:path*', headers: [{ key: 'Content-Security-Policy', value: cspAdmin }, ...headerDasar] },
      { source: '/((?!tuan).*)', headers: [{ key: 'Content-Security-Policy', value: cspPublik }, ...headerDasar] },
    ]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
