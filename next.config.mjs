/** @type {import('next').NextConfig} */
const nextConfig = {
  // 外部包不打包进构建文件
  serverExternalPackages: ['better-sqlite3', 'chromadb'],
  
  // 实验性功能
  experimental: {
    // 允许服务器操作
    serverActions: {
      bodySizeLimit: '2mb'
    },
    // 字体优化
    optimizePackageImports: ['@headlessui/react', '@heroicons/react'],
    // Turbopack 配置
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // 图片优化配置
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 压缩优化
  compress: true,
  
  // 生产环境优化
  poweredByHeader: false,
  
  // TypeScript 配置
  typescript: {
    // 在构建时忽略 TypeScript 错误（仅用于紧急部署）
    ignoreBuildErrors: false,
  },
  
  // ESLint 配置
  eslint: {
    // 在构建时忽略 ESLint 错误（仅用于紧急部署）
    ignoreDuringBuilds: true,
  },
  
  // Webpack 配置
  webpack: (config, { isServer }) => {
    // 确保路径解析正确
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };
    
    // 解决字体加载问题
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // 处理 better-sqlite3
    config.externals.push({
      'better-sqlite3': 'commonjs better-sqlite3',
    });
    
    return config;
  }
};

export default nextConfig; 