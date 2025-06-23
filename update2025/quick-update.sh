#!/bin/bash
# 快速更新部署脚本 - 适用于日常开发更新

# 导航到项目根目录
cd "$(dirname "$0")/.."

echo "🚀 开始快速更新部署..."

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "⚠️  代码拉取失败，使用现有代码继续部署"
fi

# 2. 快速重新部署
echo "🔄 重新部署容器..."

# 检测 Docker Compose 命令
if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# 重新构建并启动
sudo $COMPOSE_CMD up -d --build

# 3. 检查状态
echo "📊 检查部署状态..."
sleep 5
sudo $COMPOSE_CMD ps

echo "✅ 快速更新完成！"
echo "🌐 访问地址: http://your-server-ip"
echo "📋 查看日志: sudo $COMPOSE_CMD logs -f app" 