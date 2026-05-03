import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* 
     This tells Next.js to treat edge-tts as a standard Node.js module 
     rather than trying to bundle its raw TypeScript files. 
  */
  serverExternalPackages: ['edge-tts'],
};

export default nextConfig;