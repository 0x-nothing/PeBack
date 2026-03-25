/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateBuildId: () => 'peback-build',
};

export default nextConfig;

