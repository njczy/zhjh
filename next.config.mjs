/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境：启用 standalone 输出用于 Docker 部署
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // 针对生产环境的优化配置
  poweredByHeader: false,
  compress: true,
  
  // 文件追踪配置（从 experimental 移出）
  outputFileTracingRoot: process.cwd(),
  
  // 实验性功能配置（Next.js 15.x 兼容）
  experimental: {
    // 移除了 esmExternals，使用默认行为
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  webpack: (config, { isServer }) => {
    // 客户端 webpack 配置
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      }
    }
    
    // 优化包大小
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    }
    
    return config
  },
}

export default nextConfig
