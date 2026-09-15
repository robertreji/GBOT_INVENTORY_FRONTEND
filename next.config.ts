import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Allow all origins for local network / cross-origin development
  allowedDevOrigins: [
    '*',
    '**.*',
    '*.*.*.*',
    '192.168.37.35',
    '192.168.*.*',
    '10.*.*.*',
    '172.*.*.*',
    '*.local',
    'localhost',
    '127.0.0.1',
  ],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, PATCH, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" },
        ],
      },
    ];
  },
};

export default nextConfig;

