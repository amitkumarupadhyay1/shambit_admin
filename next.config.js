/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: 'standalone',
  // Allow network access for testing
  allowedDevOrigins: ['192.168.3.103'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.shambit.com',
        pathname: '/media/**',
      },
    ],
    minimumCacheTTL: 300,
    formats: ['image/webp'],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;
