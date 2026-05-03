import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      // This tells Turbopack to treat .ts files in edge-tts as standard TS modules
      './node_modules/edge-tts/**/*.ts': {
        as: '*.ts',
      },
    },
  },
};

export default nextConfig;