// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile edge-tts so Next.js handles the raw .ts files in node_modules
  transpilePackages: ['edge-tts'],
};

export default nextConfig;