/** @type {import('next').NextConfig} */

// 开发环境配置 - 专为 Windows 开发优化
console.log(`🔧 开发环境配置加载 (Windows 优化)`)
console.log(`   平台: ${process.platform}`)
console.log(`   standalone 输出: 禁用 (避免权限问题)`)

const nextConfigDev = {
  // 开发环境不使用 standalone 输出
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // 开发环境优化配置
  poweredByHeader: false,
  
  // 实验性功能配置（Next.js 15.x 兼容）
  experimental: {
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
    
    return config
  },
}

export default nextConfigDev 