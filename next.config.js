/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*\.(png|jpe?g|webp|svg|gif|tiff|js|css)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 86400,
        },
      },
    },
  ],
})

const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  output: 'export',
}

module.exports = withPWA(nextConfig)