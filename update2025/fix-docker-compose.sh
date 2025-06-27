#!/bin/bash

# Docker Compose 安装修复脚本
# 解决 docker-compose: command not found 问题

echo "🔧 Docker Compose 安装修复脚本"
echo "================================"

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

# 检测当前Docker Compose状态
check_docker_compose() {
    log_info "检测Docker Compose状态..."
    
    if command -v docker-compose >/dev/null 2>&1; then
        log_success "找到 docker-compose 命令"
        docker-compose --version
        return 0
    elif docker compose version >/dev/null 2>&1; then
        log_success "找到 docker compose 命令"
        docker compose version
        return 0
    else
        log_error "未找到任何Docker Compose命令"
        return 1
    fi
}

# 安装Docker Compose Plugin
install_docker_compose_plugin() {
    log_info "安装Docker Compose Plugin..."
    
    # 更新包列表
    sudo apt update
    
    # 安装Docker Compose Plugin
    sudo apt install -y docker-compose-plugin
    
    # 验证安装
    if docker compose version >/dev/null 2>&1; then
        log_success "Docker Compose Plugin 安装成功"
        docker compose version
        return 0
    else
        log_error "Docker Compose Plugin 安装失败"
        return 1
    fi
}

# 安装传统的docker-compose
install_legacy_docker_compose() {
    log_info "安装传统的 docker-compose..."
    
    # 方法1：通过apt安装
    if sudo apt install -y docker-compose; then
        log_success "通过apt安装docker-compose成功"
        docker-compose --version
        return 0
    fi
    
    # 方法2：通过pip安装
    log_info "尝试通过pip安装..."
    if command -v pip3 >/dev/null 2>&1; then
        sudo pip3 install docker-compose
        if command -v docker-compose >/dev/null 2>&1; then
            log_success "通过pip安装docker-compose成功"
            docker-compose --version
            return 0
        fi
    fi
    
    # 方法3：直接下载二进制文件
    log_info "尝试下载二进制文件..."
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    if command -v docker-compose >/dev/null 2>&1; then
        log_success "通过二进制文件安装docker-compose成功"
        docker-compose --version
        return 0
    else
        log_error "所有安装方法都失败了"
        return 1
    fi
}

# 主函数
main() {
    echo "开始检测和修复Docker Compose..."
    echo ""
    
    # 检查Docker是否安装
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker 未安装！请先安装Docker"
        echo "安装命令："
        echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
        echo "  sudo sh get-docker.sh"
        exit 1
    fi
    
    log_success "Docker 已安装"
    docker --version
    echo ""
    
    # 检查Docker Compose
    if check_docker_compose; then
        log_success "Docker Compose 已可用，无需修复"
        exit 0
    fi
    
    echo ""
    log_info "开始安装Docker Compose..."
    
    # 尝试安装Docker Compose Plugin（推荐）
    if install_docker_compose_plugin; then
        log_success "修复完成！现在可以使用 'docker compose' 命令"
        exit 0
    fi
    
    # 如果Plugin安装失败，尝试传统方式
    log_warn "Plugin安装失败，尝试传统方式..."
    if install_legacy_docker_compose; then
        log_success "修复完成！现在可以使用 'docker-compose' 命令"
        exit 0
    fi
    
    # 所有方法都失败
    log_error "Docker Compose 安装失败"
    echo ""
    echo "手动安装建议："
    echo "1. 安装Docker Compose Plugin："
    echo "   sudo apt update"
    echo "   sudo apt install docker-compose-plugin"
    echo ""
    echo "2. 或安装传统docker-compose："
    echo "   sudo apt install docker-compose"
    echo ""
    echo "3. 或通过pip安装："
    echo "   sudo apt install python3-pip"
    echo "   sudo pip3 install docker-compose"
    
    exit 1
}

# 运行主函数
main "$@" 