#!/bin/bash

# 设置脚本在任何命令失败时立即退出
set -e

echo "=== 开始更新应用 ==="

# 步骤 1: 拉取最新的代码
echo "--- 1. 从 GitHub 拉取最新的代码 ---"
git pull origin main # 或者你的主分支名，例如 master

echo "--- 2. 使用 Docker Compose 重建并重启服务 ---"
# --build: 强制重新构建镜像
# -d: 在后台运行容器
docker-compose up --build -d

echo "--- 3. 清理旧的、未使用的 Docker 镜像 ---"
# 这会删除所有悬空（dangling）的镜像，释放磁盘空间
docker image prune -f

echo "=== 应用更新成功！ ===" 