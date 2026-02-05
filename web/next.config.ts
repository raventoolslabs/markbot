import type { NextConfig } from "next";

const apiUrl = process.env.API_URL || 'http://localhost:3002';

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: false,
  async rewrites() {
    return [
      // Detailed Rewrites for Swagger Assets (Fixes 404s when trailing slash is missing)
      {
        source: '/api/swagger-ui.css',
        destination: `${apiUrl}/api/docs/swagger-ui.css`,
      },
      {
        source: '/api/swagger-ui-bundle.js',
        destination: `${apiUrl}/api/docs/swagger-ui-bundle.js`,
      },
      {
        source: '/api/swagger-ui-standalone-preset.js',
        destination: `${apiUrl}/api/docs/swagger-ui-standalone-preset.js`,
      },
      {
        source: '/api/swagger-ui-init.js',
        destination: `${apiUrl}/api/docs/swagger-ui-init.js`,
      },
      {
        source: '/api/favicon-32x32.png',
        destination: `${apiUrl}/api/docs/favicon-32x32.png`,
      },
      {
        source: '/api/favicon-16x16.png',
        destination: `${apiUrl}/api/docs/favicon-16x16.png`,
      },
      // General Swagger Rewrite
      {
        source: '/api/docs',
        destination: `${apiUrl}/api/docs/`,
      },
      {
        source: '/api/docs/',
        destination: `${apiUrl}/api/docs/`,
      },
      // API Fallback
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
