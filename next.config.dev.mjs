/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windows 开发环境：完全禁用 standalone 输出
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // 针对开发环境的配置
  poweredByHeader: false,
  compress: false, // 开发环境不需要压缩
  
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
    
    // 开发环境的 webpack 配置
    if (process.env.NODE_ENV !== 'production') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    
    return config
  },
}

export default nextConfig 