#!/bin/bash

# Linux 生产环境构建脚本 - 2核2G服务器优化版
echo "🔧 Linux 生产环境构建开始（2核2G优化版）..."
echo "📦 启用 standalone 输出用于 Docker 部署"

# 检查系统资源
echo "📊 系统资源检查："
free -h
df -h
echo "---"

# 清理缓存和临时文件
echo "🧹 清理缓存和临时文件..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf /tmp/next-*
sudo docker system prune -f --volumes 2>/dev/null || true

# 设置针对2G内存的优化环境变量
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
# 2G内存服务器：设置Node.js内存限制为1.5G，留出0.5G给系统
export NODE_OPTIONS="--max-old-space-size=1536 --max-semi-space-size=256"

# 创建临时swap文件（如果内存不足）
echo "💾 内存优化配置："
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "系统总内存: ${TOTAL_MEM}MB"

if [ "$TOTAL_MEM" -lt 3000 ]; then
    echo "⚠️  检测到内存不足，创建临时swap文件..."
    sudo fallocate -l 2G /tmp/build-swap 2>/dev/null || sudo dd if=/dev/zero of=/tmp/build-swap bs=1M count=2048
    sudo chmod 600 /tmp/build-swap
    sudo mkswap /tmp/build-swap
    sudo swapon /tmp/build-swap
    echo "✅ 临时swap文件已创建"
fi

echo "💾 Node.js 内存限制: 1.5GB (适配2G内存服务器)"
echo "📝 开始构建，预计需要 10-20 分钟..."
echo "🔄 构建过程中请勿中断..."

# 创建构建监控脚本
cat > /tmp/build-monitor.sh << 'EOF'
#!/bin/bash
while true; do
    echo "$(date '+%H:%M:%S') - 内存使用: $(free -h | awk 'NR==2{printf "%.1f/%.1fGB", $3/1024, $2/1024}')"
    sleep 30
done
EOF
chmod +x /tmp/build-monitor.sh

# 后台启动监控
/tmp/build-monitor.sh &
MONITOR_PID=$!

# 执行构建（带超时保护）
echo "🚀 开始构建..."
timeout 1800 npm run build 2>&1 | while IFS= read -r line; do
    echo "$line"
    # 检查关键进度节点
    if [[ "$line" == *"Generating static pages"* ]]; then
        echo "📄 正在生成静态页面，这是最耗时的步骤，请耐心等待..."
    fi
    if [[ "$line" == *"Finalizing page optimization"* ]]; then
        echo "🎯 即将完成，正在优化页面..."
    fi
done

BUILD_EXIT_CODE=$?

# 停止监控
kill $MONITOR_PID 2>/dev/null

# 清理临时swap
if [ -f /tmp/build-swap ]; then
    echo "🧹 清理临时swap文件..."
    sudo swapoff /tmp/build-swap 2>/dev/null
    sudo rm -f /tmp/build-swap
fi

# 清理监控脚本
rm -f /tmp/build-monitor.sh

# 检查构建结果
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Linux 生产构建成功完成！"
    echo "📁 standalone 输出已生成到 .next/standalone"
    echo "📊 最终资源使用："
    free -h
    df -h
elif [ $BUILD_EXIT_CODE -eq 124 ]; then
    echo "⏰ 构建超时（30分钟），可能需要更多时间或优化配置"
    echo "💡 建议：检查系统资源或联系管理员"
    exit 124
else
    echo "❌ 构建失败，退出码: $BUILD_EXIT_CODE"
    echo "🔍 常见解决方案："
    echo "   1. 检查内存是否足够"
    echo "   2. 清理磁盘空间"
    echo "   3. 重新运行构建"
    exit $BUILD_EXIT_CODE
fi 