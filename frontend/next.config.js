/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  compress: true,
  optimizeFonts: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@headlessui/react',
      '@heroicons/react',
      'framer-motion',
      'date-fns',
      'lucide-react',
      'recharts',
      'swiper'
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 500],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.crocosushi.com';
    // For rewrites, we prefer the internal Docker network URL in production to avoid DNS issues
    // with the public domain (api.crocosushi.com) inside the container.
    const internalApiUrl = process.env.NODE_ENV === 'production'
      ? 'http://backend:8000'
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

    // Use internalApiUrl for destinations to ensure connectivity
    return [
      {
        source: '/api/:path*',
        destination: `${internalApiUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${internalApiUrl}/static/uploads/:path*`,
      },
      {
        source: '/static/uploads/:path*',
        destination: `${internalApiUrl}/static/uploads/:path*`,
      },
    ];
  },
  async headers() {
    return [
      // 1. Immutable static assets (JS, CSS, Media inside _next/static)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 2. Images (public folder or optimized)
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 3. Fonts
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 4. Default for others (HTML, API - handled by code but safe fallback)
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' blob: data: https:; font-src 'self' data: https:; connect-src 'self' https://api.crocosushi.com https:; frame-src 'self' https://www.google.com https://maps.google.com; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

