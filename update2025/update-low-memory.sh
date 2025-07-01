#!/bin/bash

# 2核2G服务器专用更新脚本
# 结合代码更新和低内存优化部署

set -e  # 遇到错误立即退出

echo "🚀 2核2G服务器低内存更新开始..."
echo "⚠️  注意：此脚本专为2核2G配置服务器优化"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否为root用户并设置命令前缀
if [ "$EUID" -eq 0 ]; then
    SUDO_CMD=""
    log_warn "检测到root用户运行，将调整相关配置..."
else
    SUDO_CMD="sudo"
fi

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

# 检测Docker Compose命令
DOCKER_COMPOSE_CMD=""
detect_docker_compose() {
    if command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
        log_info "检测到 docker-compose 命令"
    elif docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
        log_info "检测到 docker compose 命令"
    else
        log_error "未找到 Docker Compose 命令！"
        exit 1
    fi
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
        $SUDO_CMD fallocate -l 2G /tmp/update-swap 2>/dev/null || \
        $SUDO_CMD dd if=/dev/zero of=/tmp/update-swap bs=1M count=2048
        
        $SUDO_CMD chmod 600 /tmp/update-swap
        $SUDO_CMD mkswap /tmp/update-swap
        $SUDO_CMD swapon /tmp/update-swap
        
        log_success "临时swap文件创建成功"
        
        # 设置清理trap
        trap 'cleanup_swap' EXIT
    else
        log_info "系统已有足够swap空间"
    fi
}

# 清理swap文件
cleanup_swap() {
    if [ -f /tmp/update-swap ]; then
        log_info "清理临时swap文件..."
        $SUDO_CMD swapoff /tmp/update-swap 2>/dev/null || true
        $SUDO_CMD rm -f /tmp/update-swap
    fi
}

# 代码更新函数
update_code() {
    log_info "开始更新代码..."
    
    # 导航到项目根目录
    cd "$(dirname "$0")/.."
    
    # 检查是否有未提交的更改
    if ! git diff --quiet || ! git diff --cached --quiet; then
        log_warn "检测到未提交的更改，正在暂存..."
        git stash push -m "自动暂存-$(date '+%Y%m%d-%H%M%S')"
        STASHED=true
    else
        STASHED=false
    fi
    
    # 检查当前 Git 协议
    CURRENT_URL=$(git remote get-url origin 2>/dev/null || echo "")
    log_info "当前仓库 URL: $CURRENT_URL"
    
    # 根据协议类型选择连接方式
    if [[ $CURRENT_URL == git@github.com:* ]]; then
        log_info "🔑 使用 SSH 协议连接..."
        
        # 测试 SSH 连接
        if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
            log_success "SSH 连接正常"
            
            # 拉取最新代码
            log_info "拉取最新代码..."
            if git fetch origin main; then
                # 尝试合并，如果失败则重置
                if ! git merge origin/main; then
                    log_warn "合并失败，正在重置到远程状态..."
                    git reset --hard origin/main
                fi
                log_success "代码更新成功"
            else
                log_error "SSH 拉取失败"
                log_warn "将使用本地现有代码进行部署"
            fi
        else
            log_error "SSH 连接失败"
            log_warn "将使用本地现有代码进行部署"
        fi
        
    elif [[ $CURRENT_URL == https://github.com/* ]]; then
        log_info "🌐 使用 HTTPS 协议连接..."
        
        # 测试网络连接
        if ! timeout 10 ping -c 2 github.com >/dev/null 2>&1; then
            log_warn "GitHub 连接失败，尝试备用方案..."
            
            # 尝试使用 Gitee 镜像
            if git remote | grep -q "gitee"; then
                log_info "尝试从 Gitee 镜像拉取..."
                if git fetch gitee main && git reset --hard gitee/main; then
                    log_success "从 Gitee 镜像更新成功"
                else
                    log_error "Gitee 镜像也失败，跳过代码更新"
                    log_warn "将使用本地现有代码进行部署"
                fi
            else
                log_error "网络连接失败，跳过代码更新"
                log_warn "将使用本地现有代码进行部署"
            fi
        else
            # 正常的 GitHub HTTPS 拉取流程
            log_info "拉取最新代码..."
            if git fetch origin main; then
                # 尝试合并，如果失败则重置
                if ! git merge origin/main; then
                    log_warn "合并失败，正在重置到远程状态..."
                    git reset --hard origin/main
                fi
                log_success "代码更新成功"
            else
                log_error "从 GitHub 获取代码失败"
                log_warn "将使用本地现有代码进行部署"
            fi
        fi
    else
        log_warn "未识别的仓库 URL 格式"
        log_warn "将使用本地现有代码进行部署"
    fi
    
    # 如果之前有暂存，询问是否恢复
    if [ "$STASHED" = true ]; then
        log_info "之前的更改已暂存，如需恢复请手动执行: git stash pop"
    fi
}

# 环境清理和优化
prepare_environment() {
    log_info "准备部署环境..."
    
    # 检测Docker Compose命令
    detect_docker_compose
    
    # 停止现有容器
    log_info "停止现有容器..."
    $SUDO_CMD $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml down 2>/dev/null || true
    $SUDO_CMD $DOCKER_COMPOSE_CMD down 2>/dev/null || true
    
    # 清理Docker资源
    log_info "清理Docker资源..."
    $SUDO_CMD docker system prune -f --volumes
    $SUDO_CMD docker builder prune -f
    
    # 清理项目缓存
    log_info "清理项目缓存..."
    rm -rf .next
    rm -rf node_modules/.cache
    rm -rf /tmp/next-*
    
    # 设置Docker内存限制
    log_info "配置Docker资源限制..."
    $SUDO_CMD mkdir -p /etc/docker
    
    # 创建或更新Docker daemon配置
    cat << EOF | $SUDO_CMD tee /etc/docker/daemon.json > /dev/null
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
    
    $SUDO_CMD systemctl restart docker
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
    cat > /tmp/update-monitor.sh << 'EOF'
#!/bin/bash
while true; do
    TIMESTAMP=$(date '+%H:%M:%S')
    MEM_USAGE=$(free -h | awk 'NR==2{printf "%.1f/%.1fGB", $3/1024, $2/1024}')
    DISK_USAGE=$(df -h . | awk 'NR==2{print $5}')
    echo "[$TIMESTAMP] 内存: $MEM_USAGE | 磁盘: $DISK_USAGE"
    sleep 30
done
EOF
    chmod +x /tmp/update-monitor.sh
    
    # 启动监控
    /tmp/update-monitor.sh &
    MONITOR_PID=$!
    
    # 执行构建（带超时）
    log_info "开始构建Docker镜像..."
    log_warn "⚠️  构建过程可能需要30-50分钟，请耐心等待..."
    
    if timeout 3600 $SUDO_CMD $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml build --no-cache; then
        log_success "Docker镜像构建成功"
    else
        kill $MONITOR_PID 2>/dev/null || true
        log_error "Docker构建失败或超时"
        log_info "💡 建议检查系统资源或使用更长的超时时间"
        exit 1
    fi
    
    # 停止监控
    kill $MONITOR_PID 2>/dev/null || true
    rm -f /tmp/update-monitor.sh
    
    # 启动容器
    log_info "启动Docker容器..."
    if $SUDO_CMD $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml up -d; then
        log_success "容器启动成功"
    else
        log_error "容器启动失败"
        exit 1
    fi
    
    # 等待容器启动并检查状态
    log_info "等待容器启动..."
    sleep 15
    
    # 检查容器状态
    if $SUDO_CMD $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml ps | grep -q "Up"; then
        log_success "容器运行正常"
    else
        log_error "容器启动异常"
        log_info "查看容器日志："
        $SUDO_CMD $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml logs --tail=20
        exit 1
    fi
}

# 清理和完成
cleanup_and_finish() {
    log_info "清理临时文件..."
    
    # 清理Docker资源
    $SUDO_CMD docker image prune -f
    $SUDO_CMD docker builder prune -f
    
    # 清理临时文件
    rm -f /tmp/update-monitor.sh
    
    log_success "更新完成！"
    echo ""
    echo "📊 容器状态："
    $SUDO_CMD $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml ps
    echo ""
    echo "🌐 应用应该可以通过 http://your-server-ip 访问"
    echo "📋 常用管理命令："
    if [ "$EUID" -eq 0 ]; then
        echo "  查看日志: $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml logs -f app"
        echo "  重启服务: $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml restart app"
        echo "  停止服务: $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml down"
        echo ""
        echo "💡 如果遇到问题，请查看："
        echo "  - 构建日志: $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml logs"
        echo "  - 系统资源: free -h && df -h"
        echo "  - Docker状态: docker stats"
    else
        echo "  查看日志: sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml logs -f app"
        echo "  重启服务: sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml restart app"
        echo "  停止服务: sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml down"
        echo ""
        echo "💡 如果遇到问题，请查看："
        echo "  - 构建日志: sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml logs"
        echo "  - 系统资源: free -h && df -h"
        echo "  - Docker状态: sudo docker stats"
    fi
}

# 主函数
main() {
    echo "=========================================="
    echo "🚀 2核2G服务器低内存更新脚本"
    echo "=========================================="
    
    # 检查系统资源
    check_system_resources
    
    # 更新代码
    update_code
    
    # 准备环境
    prepare_environment
    
    # 构建和部署
    deploy_application
    
    # 清理和完成
    cleanup_and_finish
}

# 执行主函数
main "$@" 