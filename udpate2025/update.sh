#!/bin/bash
# 该脚本用于自动更新部署在服务器上的 zhjh 项目

# 导航到脚本所在的目录，以确保后续命令在正确的项目根目录执行
cd "$(dirname "$0")"

# 1. 从 Git 仓库拉取最新的代码
echo "正在从 GitHub 拉取最新代码..."
git fetch origin main
git reset --hard origin/main
if [ $? -ne 0 ]; then
    echo "从 GitHub 拉取代码失败，请检查网络连接或 Git 配置。"
    exit 1
fi

# 2. 使用 Docker Compose 构建和重启服务
echo "正在构建并重启 Docker 容器..."
sudo docker compose build
if [ $? -ne 0 ]; then
    echo "Docker 构建失败，请检查 Dockerfile 或构建日志。"
    exit 1
fi

sudo docker compose up -d
if [ $? -ne 0 ]; then
    echo "启动 Docker 容器失败，请检查 Docker 配置。"
    exit 1
fi

# 3. 清理无用的 Docker 镜像
echo "正在清理旧的、无用的 Docker 镜像..."
sudo docker image prune -f

echo "项目更新完成！" 