#!/bin/bash

# 新功能增量更新部署脚本
# 专为2核2G服务器优化，避免卡死问题

echo "🚀 新功能增量更新部署"
echo "======================"
echo "⚠️  适用于2核2G服务器，避免构建卡死"

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
detect_docker_compose() {
    if command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        log_error "未找到 Docker Compose 命令！"
        exit 1
    fi
}

# 检查系统资源
check_resources() {
    log_info "检查系统资源..."
    
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    DISK_USAGE=$(df . | awk 'NR==2{print $5}' | sed 's/%//')
    
    echo "📊 当前资源状态："
    echo "   总内存: ${TOTAL_MEM}MB"
    echo "   可用内存: ${AVAILABLE_MEM}MB"
    echo "   磁盘使用: ${DISK_USAGE}%"
    
    # 检查是否需要创建临时swap
    if [ "$AVAILABLE_MEM" -lt 800 ]; then
        log_warn "可用内存不足，创建临时swap..."
        create_temp_swap
    fi
    
    # 检查磁盘空间
    if [ "$DISK_USAGE" -gt 85 ]; then
        log_warn "磁盘使用率较高，清理Docker资源..."
        sudo docker system prune -f
    fi
}

# 创建临时swap
create_temp_swap() {
    if [ ! -f /tmp/update-swap ]; then
        sudo fallocate -l 1G /tmp/update-swap 2>/dev/null || \
        sudo dd if=/dev/zero of=/tmp/update-swap bs=1M count=1024
        sudo chmod 600 /tmp/update-swap
        sudo mkswap /tmp/update-swap
        sudo swapon /tmp/update-swap
        log_success "临时swap创建成功"
        
        # 设置清理函数
        cleanup_swap() {
            log_info "清理临时swap..."
            sudo swapoff /tmp/update-swap 2>/dev/null || true
            sudo rm -f /tmp/update-swap
        }
        trap cleanup_swap EXIT
    fi
}

# 备份当前运行的容器
backup_current_deployment() {
    log_info "备份当前部署..."
    
    # 检查当前运行的容器
    if sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml ps | grep -q "Up"; then
        log_info "发现运行中的容器，创建备份..."
        
        # 导出当前镜像作为备份
        BACKUP_TAG="zhjh-backup-$(date +%Y%m%d-%H%M%S)"
        CURRENT_IMAGE=$(sudo docker images --format "table {{.Repository}}:{{.Tag}}" | grep zhjh | head -1)
        
        if [ ! -z "$CURRENT_IMAGE" ]; then
            sudo docker tag "$CURRENT_IMAGE" "$BACKUP_TAG"
            log_success "创建备份镜像: $BACKUP_TAG"
            echo "$BACKUP_TAG" > /tmp/backup-tag.txt
        fi
    else
        log_info "没有运行中的容器，跳过备份"
    fi
}

# 拉取最新代码
update_code() {
    log_info "拉取最新代码..."
    
    # 检查git状态
    if git status --porcelain | grep -q .; then
        log_warn "检测到本地修改，暂存当前更改..."
        git stash push -m "auto-stash-before-update-$(date +%Y%m%d-%H%M%S)"
    fi
    
    # 拉取最新代码
    if git pull origin main; then
        log_success "代码更新成功"
    else
        log_error "代码拉取失败"
        exit 1
    fi
}

# 智能构建策略
smart_build() {
    log_info "开始智能构建..."
    
    # 检查是否有重大变更（package.json, Dockerfile等）
    MAJOR_CHANGES=$(git diff HEAD~1 --name-only | grep -E "(package\.json|Dockerfile|next\.config)" | wc -l)
    
    if [ "$MAJOR_CHANGES" -gt 0 ]; then
        log_warn "检测到重大变更，使用完整构建..."
        build_strategy="full"
    else
        log_info "检测到轻微变更，使用快速构建..."
        build_strategy="incremental"
    fi
    
    # 创建构建监控
    cat > /tmp/update-monitor.sh << 'EOF'
#!/bin/bash
while true; do
    echo "$(date '+%H:%M:%S') - 内存: $(free -h | awk 'NR==2{printf "%.1f/%.1fGB", $3/1024, $2/1024}') | 磁盘: $(df -h . | awk 'NR==2{print $5}')"
    sleep 30
done
EOF
    chmod +x /tmp/update-monitor.sh
    
    # 启动监控
    /tmp/update-monitor.sh &
    MONITOR_PID=$!
    
    # 执行构建
    if [ "$build_strategy" = "full" ]; then
        # 完整构建
        log_info "执行完整构建（预计15-25分钟）..."
        BUILD_TIMEOUT=2400  # 40分钟
        sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml build --no-cache
    else
        # 增量构建
        log_info "执行增量构建（预计5-10分钟）..."
        BUILD_TIMEOUT=1200  # 20分钟
        sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml build
    fi
    
    BUILD_EXIT=$?
    
    # 停止监控
    kill $MONITOR_PID 2>/dev/null
    rm -f /tmp/update-monitor.sh
    
    if [ $BUILD_EXIT -eq 0 ]; then
        log_success "构建成功完成"
    else
        log_error "构建失败"
        rollback_deployment
        exit 1
    fi
}

# 零停机更新
zero_downtime_update() {
    log_info "执行零停机更新..."
    
    # 启动新容器（使用不同端口）
    log_info "启动新版本容器..."
    
    # 临时修改端口避免冲突
    sed 's/80:3000/81:3000/' docker-compose.low-memory.yml > docker-compose.update.yml
    
    if sudo $DOCKER_COMPOSE_CMD -f docker-compose.update.yml up -d; then
        log_info "新容器启动成功，等待服务就绪..."
        
        # 等待新服务启动
        for i in {1..30}; do
            if curl -s http://localhost:81/api/health > /dev/null 2>&1; then
                log_success "新服务健康检查通过"
                break
            else
                if [ $i -eq 30 ]; then
                    log_error "新服务启动超时"
                    sudo $DOCKER_COMPOSE_CMD -f docker-compose.update.yml down
                    rm -f docker-compose.update.yml
                    rollback_deployment
                    exit 1
                fi
                sleep 10
            fi
        done
        
        # 切换服务
        log_info "切换到新版本..."
        sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml down
        sudo $DOCKER_COMPOSE_CMD -f docker-compose.update.yml down
        
        # 启动正式服务
        sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml up -d
        
        # 清理临时文件
        rm -f docker-compose.update.yml
        
        log_success "零停机更新完成"
    else
        log_error "新容器启动失败"
        rm -f docker-compose.update.yml
        rollback_deployment
        exit 1
    fi
}

# 回滚部署
rollback_deployment() {
    log_warn "开始回滚到上一个版本..."
    
    if [ -f /tmp/backup-tag.txt ]; then
        BACKUP_TAG=$(cat /tmp/backup-tag.txt)
        log_info "回滚到备份镜像: $BACKUP_TAG"
        
        # 停止当前容器
        sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml down
        
        # 使用备份镜像
        sudo docker tag "$BACKUP_TAG" "zhjh-next-app-low-memory:latest"
        
        # 重新启动
        sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml up -d
        
        log_success "回滚完成"
    else
        log_error "没有找到备份，无法回滚"
    fi
}

# 部署后验证
post_deployment_check() {
    log_info "执行部署后验证..."
    
    # 检查服务状态
    sleep 30
    if sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml ps | grep -q "Up"; then
        log_success "容器运行正常"
    else
        log_error "容器启动失败"
        return 1
    fi
    
    # 健康检查
    for i in {1..10}; do
        if curl -s http://localhost/api/health > /dev/null 2>&1; then
            log_success "应用健康检查通过"
            break
        else
            if [ $i -eq 10 ]; then
                log_error "健康检查失败"
                return 1
            fi
            sleep 10
        fi
    done
    
    # 显示部署信息
    echo ""
    echo "🎉 新功能部署成功！"
    echo ""
    echo "📱 访问地址："
    echo "   http://localhost"
    echo "   http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
    echo ""
    echo "🔍 服务状态："
    sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml ps
    echo ""
    echo "📊 资源使用："
    free -h
    
    return 0
}

# 清理资源
cleanup_resources() {
    log_info "清理部署资源..."
    
    # 清理旧镜像（保留最近3个）
    sudo docker images | grep zhjh | tail -n +4 | awk '{print $3}' | xargs -r sudo docker rmi 2>/dev/null || true
    
    # 清理构建缓存
    rm -rf .next
    rm -rf node_modules/.cache
    
    # 清理临时文件
    rm -f /tmp/backup-tag.txt
    
    log_success "资源清理完成"
}

# 主函数
main() {
    echo "🎯 开始新功能增量更新部署"
    echo "⏰ 预计耗时：5-20分钟（取决于变更大小）"
    echo ""
    
    # 执行部署流程
    detect_docker_compose
    check_resources
    backup_current_deployment
    update_code
    smart_build
    zero_downtime_update
    
    if post_deployment_check; then
        cleanup_resources
        log_success "🎉 新功能部署完成！"
        
        echo ""
        echo "💡 后续使用提示："
        echo "   1. 如有问题可运行回滚: sudo bash ./update2025/rollback.sh"
        echo "   2. 定期清理: sudo docker system prune -f"
        echo "   3. 监控资源: free -h && df -h"
    else
        log_error "部署验证失败，自动回滚..."
        rollback_deployment
        exit 1
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 