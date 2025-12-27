/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  optimizeFonts: true,
  images: {
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
      {
        source: '/:path*',
        headers: [
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https://api.crocosushi.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

