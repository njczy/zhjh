#!/bin/bash

# 2核2G服务器专用部署脚本
# 针对低配置服务器的优化部署方案

set -e  # 遇到错误立即退出

echo "🚀 2核2G服务器低内存部署开始..."
echo "⚠️  注意：此脚本专为2核2G配置服务器优化"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源..."
    
    # 获取内存信息
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    
    # 获取磁盘信息
    AVAILABLE_DISK=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    
    echo "📊 系统资源状态："
    echo "   总内存: ${TOTAL_MEM}MB"
    echo "   可用内存: ${AVAILABLE_MEM}MB"
    echo "   可用磁盘: ${AVAILABLE_DISK}GB"
    
    # 检查内存是否足够
    if [ "$TOTAL_MEM" -lt 1800 ]; then
        log_error "内存不足！需要至少2GB内存"
        exit 1
    fi
    
    if [ "$AVAILABLE_MEM" -lt 1000 ]; then
        log_warn "可用内存较少，将创建临时swap文件"
        create_temp_swap
    fi
    
    # 检查磁盘空间
    if [ "$AVAILABLE_DISK" -lt 10 ]; then
        log_error "磁盘空间不足！需要至少10GB可用空间"
        exit 1
    fi
    
    log_success "系统资源检查通过"
}

# 创建临时swap文件
create_temp_swap() {
    log_info "创建临时swap文件以增加虚拟内存..."
    
    # 检查是否已有swap
    CURRENT_SWAP=$(free -m | awk 'NR==3{print $2}')
    
    if [ "$CURRENT_SWAP" -lt 2000 ]; then
        sudo fallocate -l 2G /tmp/deploy-swap 2>/dev/null || \
        sudo dd if=/dev/zero of=/tmp/deploy-swap bs=1M count=2048
        
        sudo chmod 600 /tmp/deploy-swap
        sudo mkswap /tmp/deploy-swap
        sudo swapon /tmp/deploy-swap
        
        log_success "临时swap文件创建成功"
        
        # 设置清理trap
        trap 'cleanup_swap' EXIT
    else
        log_info "系统已有足够swap空间"
    fi
}

# 清理swap文件
cleanup_swap() {
    if [ -f /tmp/deploy-swap ]; then
        log_info "清理临时swap文件..."
        sudo swapoff /tmp/deploy-swap 2>/dev/null || true
        sudo rm -f /tmp/deploy-swap
    fi
}

# 环境清理和优化
prepare_environment() {
    log_info "准备部署环境..."
    
    # 停止现有容器
    log_info "停止现有容器..."
    sudo docker-compose -f docker-compose.low-memory.yml down 2>/dev/null || true
    sudo docker-compose down 2>/dev/null || true
    
    # 清理Docker资源
    log_info "清理Docker资源..."
    sudo docker system prune -f --volumes
    sudo docker builder prune -f
    
    # 清理项目缓存
    log_info "清理项目缓存..."
    rm -rf .next
    rm -rf node_modules/.cache
    rm -rf /tmp/next-*
    
    # 设置Docker内存限制
    log_info "配置Docker资源限制..."
    sudo mkdir -p /etc/docker
    
    # 创建或更新Docker daemon配置
    cat << EOF | sudo tee /etc/docker/daemon.json > /dev/null
{
  "registry-mirrors": ["https://docker.m.daocloud.io"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "memlock": {
      "Hard": -1,
      "Name": "memlock",
      "Soft": -1
    }
  }
}
EOF
    
    sudo systemctl restart docker
    sleep 5
    
    log_success "环境准备完成"
}

# 构建和部署
deploy_application() {
    log_info "开始构建和部署应用..."
    
    # 设置构建环境变量
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # 创建构建监控脚本
    cat > /tmp/deploy-monitor.sh << 'EOF'
#!/bin/bash
while true; do
    TIMESTAMP=$(date '+%H:%M:%S')
    MEM_USAGE=$(free -h | awk 'NR==2{printf "%.1f/%.1fGB", $3/1024, $2/1024}')
    DISK_USAGE=$(df -h . | awk 'NR==2{print $5}')
    echo "[$TIMESTAMP] 内存: $MEM_USAGE | 磁盘: $DISK_USAGE"
    sleep 30
done
EOF
    chmod +x /tmp/deploy-monitor.sh
    
    # 启动监控
    /tmp/deploy-monitor.sh &
    MONITOR_PID=$!
    
    # 执行构建（带超时）
    log_info "开始Docker构建（预计15-30分钟）..."
    
    if timeout 2400 sudo docker-compose -f docker-compose.low-memory.yml build --no-cache; then
        log_success "构建成功完成"
    else
        BUILD_EXIT=$?
        log_error "构建失败或超时"
        
        # 停止监控
        kill $MONITOR_PID 2>/dev/null
        rm -f /tmp/deploy-monitor.sh
        
        if [ $BUILD_EXIT -eq 124 ]; then
            log_error "构建超时（40分钟），可能需要更高配置的服务器"
        fi
        
        exit $BUILD_EXIT
    fi
    
    # 停止监控
    kill $MONITOR_PID 2>/dev/null
    rm -f /tmp/deploy-monitor.sh
    
    # 启动服务
    log_info "启动应用服务..."
    sudo docker-compose -f docker-compose.low-memory.yml up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    if sudo docker-compose -f docker-compose.low-memory.yml ps | grep -q "Up"; then
        log_success "应用部署成功！"
        
        # 显示服务信息
        echo ""
        echo "📱 应用访问信息："
        echo "   本地访问: http://localhost"
        echo "   服务器IP访问: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
        echo ""
        echo "🔍 服务状态："
        sudo docker-compose -f docker-compose.low-memory.yml ps
        
    else
        log_error "应用启动失败"
        echo "📋 容器日志："
        sudo docker-compose -f docker-compose.low-memory.yml logs --tail=50
        exit 1
    fi
}

# 部署后检查
post_deploy_check() {
    log_info "执行部署后检查..."
    
    # 检查应用健康状态
    log_info "检查应用健康状态..."
    for i in {1..10}; do
        if curl -s http://localhost/api/health > /dev/null 2>&1; then
            log_success "应用健康检查通过"
            break
        else
            if [ $i -eq 10 ]; then
                log_warn "健康检查失败，但服务可能仍在启动中"
            else
                log_info "等待应用启动... ($i/10)"
                sleep 10
            fi
        fi
    done
    
    # 显示资源使用情况
    echo ""
    echo "📊 部署后资源使用："
    free -h
    echo ""
    sudo docker stats --no-stream
}

# 主函数
main() {
    echo "🎯 开始2核2G服务器低内存部署流程"
    echo "⏰ 预计总耗时：20-40分钟"
    echo ""
    
    # 执行部署步骤
    check_system_resources
    prepare_environment
    deploy_application
    post_deploy_check
    
    log_success "🎉 部署完成！"
    echo ""
    echo "💡 低内存服务器使用建议："
    echo "   1. 定期清理Docker镜像和容器"
    echo "   2. 监控内存使用情况"
    echo "   3. 避免同时运行其他高内存消耗的服务"
    echo "   4. 考虑升级服务器配置以获得更好性能"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 