/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  optimizeFonts: false,
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
  optimizeFonts: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `https://api.crocosushi.com/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `https://api.crocosushi.com/static/uploads/:path*`,
      },
      {
        source: '/static/uploads/:path*',
        destination: `https://api.crocosushi.com/static/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

