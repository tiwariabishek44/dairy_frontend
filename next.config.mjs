/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Disable TypeScript type checking
  },
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint checking
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Enable Web Workers support
    if (!isServer) {
      config.output.globalObject = "self";
    }
    return config;
  },
  // Empty turbopack config to silence the Turbopack/webpack warning
  turbopack: {},
};

export default nextConfig;
