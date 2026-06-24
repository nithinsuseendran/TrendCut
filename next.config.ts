import type { NextConfig } from 'next';

const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages deployment
  output: isGithubPages ? 'export' : undefined,
  basePath: isGithubPages ? '/TrendCut' : '',
  assetPrefix: isGithubPages ? '/TrendCut/' : undefined,
  images: {
    unoptimized: true,
  },
  // Allow long-running API routes for video generation (local dev)
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
