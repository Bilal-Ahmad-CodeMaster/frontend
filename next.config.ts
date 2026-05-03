import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use this to fix the "Unexpected Token" error by compiling the library's TS files
  transpilePackages: ['edge-tts'],

  /* 
     IMPORTANT: Remove 'edge-tts' from serverExternalPackages. 
     You cannot have the same package in both lists.
  */
};

export default nextConfig;