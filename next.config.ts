import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const config: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.firebasestorage.app' },
    ],
  },

  experimental: {
    // lucide-react tree-shake'i Next 15'te otomatik ama açıkça yazmak
    // build tarafında fark yaratır
    optimizePackageImports: ['lucide-react'],
  },

  webpack: (webpackConfig, { isServer }) => {
    if (isServer) {
      webpackConfig.externals = [
        ...(Array.isArray(webpackConfig.externals) ? webpackConfig.externals : []),
        '@grpc/grpc-js',
        '@grpc/proto-loader',
      ];
    }
    return webpackConfig;
  },
};

export default bundleAnalyzer(config);
