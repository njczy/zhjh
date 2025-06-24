#!/bin/bash

# Linux 生产环境构建脚本
echo "🔧 Linux 生产环境构建开始..."
echo "📦 启用 standalone 输出用于 Docker 部署"

# 设置生产环境变量
export NODE_ENV=production

# 执行构建
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Linux 生产构建成功完成！"
    echo "📁 standalone 输出已生成到 .next/standalone"
else
    echo "❌ 构建失败，退出码: $?"
    exit $?
fi 