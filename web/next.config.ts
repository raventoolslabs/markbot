import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/api/docs',
        destination: 'http://localhost:3002/api/docs/',
      },
      {
        source: '/api/docs/',
        destination: 'http://localhost:3002/api/docs/',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:3002/api/:path*',
      },
    ];
  },
};

export default nextConfig;
