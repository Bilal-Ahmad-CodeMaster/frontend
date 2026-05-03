import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 1. Tell Next.js to compile the raw TS files inside this package
  transpilePackages: ['edge-tts'],

  // 2. Keep this to ensure it runs correctly in the Node.js server environment
  serverExternalPackages: ['edge-tts'],
};

export default nextConfig;