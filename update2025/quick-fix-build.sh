#!/bin/bash

# 快速修复构建错误脚本
# 解决Node.js选项错误和重新构建

echo "🔧 快速修复构建错误..."
echo "=========================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 检测Docker Compose命令
DOCKER_COMPOSE_CMD=""
if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    log_error "未找到 Docker Compose 命令！请先运行: sudo bash ./update2025/fix-docker-compose.sh"
    exit 1
fi

log_info "使用 Docker Compose 命令: $DOCKER_COMPOSE_CMD"

# 停止所有容器
log_info "停止现有容器..."
sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml down 2>/dev/null || true
sudo $DOCKER_COMPOSE_CMD down 2>/dev/null || true

# 清理Docker资源
log_info "清理Docker资源..."
sudo docker system prune -f
sudo docker builder prune -f

# 清理构建缓存
log_info "清理构建缓存..."
rm -rf .next
rm -rf node_modules/.cache
sudo rm -rf /tmp/next-*

# 显示系统资源
log_info "当前系统资源："
free -h
df -h

# 检查是否需要创建swap
AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
if [ "$AVAILABLE_MEM" -lt 1000 ]; then
    log_warn "可用内存不足，创建临时swap..."
    sudo fallocate -l 2G /tmp/quick-fix-swap 2>/dev/null || \
    sudo dd if=/dev/zero of=/tmp/quick-fix-swap bs=1M count=2048
    sudo chmod 600 /tmp/quick-fix-swap
    sudo mkswap /tmp/quick-fix-swap
    sudo swapon /tmp/quick-fix-swap
    log_success "临时swap创建成功"
    
    # 设置清理函数
    cleanup_swap() {
        log_info "清理临时swap..."
        sudo swapoff /tmp/quick-fix-swap 2>/dev/null || true
        sudo rm -f /tmp/quick-fix-swap
    }
    trap cleanup_swap EXIT
fi

# 重新构建
log_info "开始重新构建（使用修复后的配置）..."
log_info "预计耗时：15-30分钟"

# 创建监控脚本
cat > /tmp/build-monitor.sh << 'EOF'
#!/bin/bash
while true; do
    echo "$(date '+%H:%M:%S') - 内存: $(free -h | awk 'NR==2{printf "%.1f/%.1fGB", $3/1024, $2/1024}') | 磁盘: $(df -h . | awk 'NR==2{print $5}')"
    sleep 60
done
EOF
chmod +x /tmp/build-monitor.sh

# 启动监控
/tmp/build-monitor.sh &
MONITOR_PID=$!

# 执行构建
if timeout 2400 sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml build --no-cache; then
    log_success "构建成功完成！"
    
    # 启动服务
    log_info "启动应用服务..."
    sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml up -d
    
    # 等待启动
    sleep 30
    
    # 检查状态
    if sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml ps | grep -q "Up"; then
        log_success "应用启动成功！"
        echo ""
        echo "📱 访问地址："
        echo "   http://localhost"
        echo ""
        echo "🔍 服务状态："
        sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml ps
    else
        log_error "应用启动失败"
        echo "查看日志："
        sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml logs --tail=20
    fi
    
else
    log_error "构建失败"
    echo ""
    echo "🔍 可能的解决方案："
    echo "1. 检查系统内存是否足够（建议4GB+）"
    echo "2. 创建更大的swap文件"
    echo "3. 清理更多磁盘空间"
    echo "4. 尝试升级服务器配置"
    
    exit 1
fi

# 停止监控
kill $MONITOR_PID 2>/dev/null
rm -f /tmp/build-monitor.sh

log_success "修复完成！" 