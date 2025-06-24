/** @type {import('next').NextConfig} */

// 检测当前运行环境
const isWindows = process.platform === 'win32'
const isLinux = process.platform === 'linux'
const isDevelopment = process.env.NODE_ENV === 'development'
const forceDevConfig = process.env.FORCE_DEV_CONFIG === 'true'

// 根据环境决定是否使用 standalone 输出
// 优先级：FORCE_DEV_CONFIG > 环境检测
// Windows 开发环境：不使用 standalone（避免权限问题）
// Linux 生产环境：使用 standalone（用于 Docker 部署）
const shouldUseStandalone = forceDevConfig ? false : (!isWindows || (isLinux && !isDevelopment))

console.log(`🔧 Next.js 配置信息:`)
console.log(`   平台: ${process.platform}`)
console.log(`   环境: ${process.env.NODE_ENV || 'development'}`)
console.log(`   standalone 输出: ${shouldUseStandalone ? '启用' : '禁用'}`)

const nextConfig = {
  // 条件性启用 standalone 输出
  ...(shouldUseStandalone && { output: 'standalone' }),
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
