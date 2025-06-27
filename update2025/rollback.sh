#!/bin/bash

# 快速回滚脚本
# 回滚到上一个工作版本

echo "🔄 快速回滚脚本"
echo "==============="
echo "⚠️  将回滚到上一个工作版本"

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
    log_error "未找到 Docker Compose 命令！"
    exit 1
fi

# 显示可用的备份
show_available_backups() {
    log_info "查找可用的备份镜像..."
    
    BACKUP_IMAGES=$(sudo docker images --format "table {{.Repository}}:{{.Tag}}" | grep "zhjh-backup" | head -10)
    
    if [ -z "$BACKUP_IMAGES" ]; then
        log_error "没有找到备份镜像"
        echo ""
        echo "💡 可能的解决方案："
        echo "1. 检查是否有Git提交记录可以回滚"
        echo "2. 重新部署稳定版本"
        echo "3. 联系管理员获取备份"
        exit 1
    fi
    
    echo "📋 可用的备份镜像："
    echo "$BACKUP_IMAGES"
    echo ""
}

# 自动回滚到最新备份
auto_rollback() {
    log_info "自动回滚到最新备份..."
    
    # 查找最新的备份镜像
    LATEST_BACKUP=$(sudo docker images --format "{{.Repository}}:{{.Tag}}" | grep "zhjh-backup" | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "没有找到备份镜像"
        return 1
    fi
    
    log_info "找到最新备份: $LATEST_BACKUP"
    
    # 停止当前服务
    log_info "停止当前服务..."
    sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml down
    
    # 获取当前镜像名称
    CURRENT_IMAGE_NAME=$(grep "container_name:" docker-compose.low-memory.yml | awk '{print $2}')
    if [ -z "$CURRENT_IMAGE_NAME" ]; then
        CURRENT_IMAGE_NAME="zhjh-next-app-low-memory"
    fi
    
    # 标记备份镜像为当前镜像
    log_info "应用备份镜像..."
    sudo docker tag "$LATEST_BACKUP" "${CURRENT_IMAGE_NAME}:latest"
    
    # 重新启动服务
    log_info "重新启动服务..."
    sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml up -d
    
    # 等待服务启动
    sleep 30
    
    # 验证回滚
    if sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml ps | grep -q "Up"; then
        log_success "服务启动成功"
        
        # 健康检查
        for i in {1..10}; do
            if curl -s http://localhost/api/health > /dev/null 2>&1; then
                log_success "健康检查通过"
                return 0
            else
                if [ $i -eq 10 ]; then
                    log_error "健康检查失败"
                    return 1
                fi
                sleep 10
            fi
        done
    else
        log_error "服务启动失败"
        return 1
    fi
}

# Git代码回滚
git_rollback() {
    log_info "Git代码回滚选项..."
    
    echo "📋 最近的提交记录："
    git log --oneline -10
    echo ""
    
    read -p "请输入要回滚到的提交哈希（或按Enter跳过）: " COMMIT_HASH
    
    if [ ! -z "$COMMIT_HASH" ]; then
        log_info "回滚代码到: $COMMIT_HASH"
        
        # 创建备份分支
        BACKUP_BRANCH="backup-before-rollback-$(date +%Y%m%d-%H%M%S)"
        git checkout -b "$BACKUP_BRANCH"
        git checkout main
        
        # 回滚代码
        git reset --hard "$COMMIT_HASH"
        
        log_success "代码回滚完成"
        
        # 询问是否重新构建
        read -p "是否重新构建并部署？(y/n): " REBUILD
        if [ "$REBUILD" = "y" ] || [ "$REBUILD" = "Y" ]; then
            log_info "开始重新构建..."
            sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml build --no-cache
            sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml up -d
            
            log_success "重新部署完成"
        fi
    fi
}

# 手动选择备份
manual_rollback() {
    show_available_backups
    
    read -p "请输入要回滚的备份镜像名称（完整名称）: " BACKUP_IMAGE
    
    if [ -z "$BACKUP_IMAGE" ]; then
        log_error "没有输入备份镜像名称"
        return 1
    fi
    
    # 验证镜像是否存在
    if ! sudo docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "$BACKUP_IMAGE"; then
        log_error "镜像不存在: $BACKUP_IMAGE"
        return 1
    fi
    
    log_info "回滚到指定备份: $BACKUP_IMAGE"
    
    # 停止当前服务
    sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml down
    
    # 应用指定备份
    CURRENT_IMAGE_NAME="zhjh-next-app-low-memory"
    sudo docker tag "$BACKUP_IMAGE" "${CURRENT_IMAGE_NAME}:latest"
    
    # 重新启动
    sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml up -d
    
    log_success "手动回滚完成"
}

# 主菜单
main_menu() {
    echo "请选择回滚方式："
    echo "1) 自动回滚到最新备份（推荐）"
    echo "2) 手动选择备份镜像"
    echo "3) Git代码回滚"
    echo "4) 显示可用备份"
    echo "5) 退出"
    echo ""
    
    read -p "请输入选择 (1-5): " CHOICE
    
    case $CHOICE in
        1)
            if auto_rollback; then
                log_success "🎉 自动回滚成功！"
                show_final_status
            else
                log_error "自动回滚失败"
                exit 1
            fi
            ;;
        2)
            manual_rollback
            show_final_status
            ;;
        3)
            git_rollback
            ;;
        4)
            show_available_backups
            main_menu
            ;;
        5)
            log_info "退出回滚脚本"
            exit 0
            ;;
        *)
            log_error "无效选择"
            main_menu
            ;;
    esac
}

# 显示最终状态
show_final_status() {
    echo ""
    echo "🔍 当前服务状态："
    sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml ps
    echo ""
    echo "📱 访问地址："
    echo "   http://localhost"
    echo "   http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
    echo ""
    echo "📊 资源使用："
    free -h
}

# 主函数
main() {
    echo "🎯 开始回滚操作"
    echo ""
    
    # 检查当前状态
    log_info "检查当前部署状态..."
    if sudo $DOCKER_COMPOSE_CMD -f docker-compose.low-memory.yml ps | grep -q "Up"; then
        log_info "发现运行中的服务"
    else
        log_warn "没有运行中的服务"
    fi
    
    echo ""
    main_menu
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 