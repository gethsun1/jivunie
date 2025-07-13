/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for Vercel deployment
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Add experimental features for better build stability
  experimental: {
    esmExternals: 'loose',
  },
  // Ensure proper handling of client-side code
  swcMinify: true,
};

module.exports = nextConfig;
