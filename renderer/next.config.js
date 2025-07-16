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
  // WSL環境でのメモリ制限対応
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // ビルド最適化設定
  swcMinify: true,
  // TypeScript設定の最適化
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.target = 'electron-renderer';
    }
    
    // WSL環境でのメモリ制限対応
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 244000,
          },
        },
      },
    };
    
    // メモリ使用量を抑える設定
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };
    
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