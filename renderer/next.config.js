/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Only use export config for production builds
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: './',
    output: 'export',
    distDir: 'out',
  }),
  experimental: {
    esmExternals: false,
  },
  transpilePackages: [
    '@uiw/react-md-editor',
    '@uiw/react-markdown-preview'
  ],
  webpack: (config, { isServer }) => {
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.target = 'electron-renderer';
    }
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    return config;
  },
};

module.exports = nextConfig;