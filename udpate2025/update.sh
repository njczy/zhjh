#!/bin/bash
# 该脚本用于自动更新部署在服务器上的 zhjh 项目

# 导航到项目根目录
cd "$(dirname "$0")/.."

# 1. 从 Git 仓库拉取最新的代码
echo "--- 1. 从 GitHub 拉取最新的代码 ---"

# 检查是否有未提交的更改
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "检测到未提交的更改，正在暂存..."
    git stash push -m "自动暂存-$(date '+%Y%m%d-%H%M%S')"
    STASHED=true
else
    STASHED=false
fi

# 拉取最新代码
git fetch origin main
if [ $? -ne 0 ]; then
    echo "从 GitHub 获取代码失败，请检查网络连接或 Git 配置。"
    exit 1
fi

# 尝试合并，如果失败则重置
if ! git merge origin/main; then
    echo "合并失败，正在重置到远程状态..."
    git reset --hard origin/main
fi

# 如果之前有暂存，询问是否恢复
if [ "$STASHED" = true ]; then
    echo "之前的更改已暂存，如需恢复请手动执行: git stash pop"
fi

# 2. 使用 Docker Compose 构建和重启服务
echo "--- 2. 构建和重启 Docker 容器 ---"

# 停止现有容器
echo "停止现有容器..."
sudo docker compose down

# 构建新镜像
echo "构建新的 Docker 镜像..."
sudo docker compose build --no-cache
if [ $? -ne 0 ]; then
    echo "❌ Docker 构建失败，请检查 Dockerfile 或构建日志。"
    exit 1
fi

# 启动容器
echo "启动 Docker 容器..."
sudo docker compose up -d
if [ $? -ne 0 ]; then
    echo "❌ 启动 Docker 容器失败，请检查 Docker 配置。"
    exit 1
fi

# 等待容器启动并检查状态
echo "等待容器启动..."
sleep 5
sudo docker compose ps

# 3. 清理无用的 Docker 镜像和缓存
echo "--- 3. 清理 Docker 资源 ---"
echo "清理旧的、无用的 Docker 镜像..."
sudo docker image prune -f
sudo docker builder prune -f

echo "✅ 项目更新完成！"
echo "📊 容器状态："
sudo docker compose ps
echo "🌐 应用应该可以通过 http://your-server-ip 访问" 