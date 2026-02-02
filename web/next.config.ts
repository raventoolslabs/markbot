import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  async rewrites() {
    return [
      // Detailed Rewrites for Swagger Assets (Fixes 404s when trailing slash is missing)
      {
        source: '/api/swagger-ui.css',
        destination: 'http://localhost:3002/api/docs/swagger-ui.css',
      },
      {
        source: '/api/swagger-ui-bundle.js',
        destination: 'http://localhost:3002/api/docs/swagger-ui-bundle.js',
      },
      {
        source: '/api/swagger-ui-standalone-preset.js',
        destination: 'http://localhost:3002/api/docs/swagger-ui-standalone-preset.js',
      },
      {
        source: '/api/swagger-ui-init.js',
        destination: 'http://localhost:3002/api/docs/swagger-ui-init.js',
      },
      {
        source: '/api/favicon-32x32.png',
        destination: 'http://localhost:3002/api/docs/favicon-32x32.png',
      },
      {
        source: '/api/favicon-16x16.png',
        destination: 'http://localhost:3002/api/docs/favicon-16x16.png',
      },
      // General Swagger Rewrite
      {
        source: '/api/docs',
        destination: 'http://localhost:3002/api/docs/',
      },
      {
        source: '/api/docs/',
        destination: 'http://localhost:3002/api/docs/',
      },
      // API Fallback
      {
        source: '/api/:path*',
        destination: 'http://localhost:3002/api/:path*',
      },
    ];
  },
};

export default nextConfig;
