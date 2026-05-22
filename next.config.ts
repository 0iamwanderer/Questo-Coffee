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
    minimumCacheTTL: 86_400, // 1 gün — logo gibi nadir değişen görsellere
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.firebasestorage.app' },
    ],
  },

  experimental: {
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
