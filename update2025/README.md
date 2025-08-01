# Docker + GitHub Actions 部署与更新指南 (小白版)

欢迎使用！本指南将手把手教您如何通过 **GitHub** 将此项目部署到一台全新的京东云 **Ubuntu 22.04** 服务器上，并指导您如何进行后续的**自动化更新**。

---

## 目录

1.  [**本地准备与上传 GitHub**](#本地准备与上传-github)
    *   [步骤 1：在本地初始化 Git 仓库](#步骤-1在本地初始化-git-仓库)
    *   [步骤 2：在 GitHub 创建新仓库并上传代码](#步骤-2在-github-创建新仓库并上传代码)
2.  [**首次服务器部署指南**](#首次服务器部署指南)
    *   [步骤 3：连接到您的云服务器并准备环境](#步骤-3连接到您的云服务器并准备环境)
    *   [步骤 4：从 GitHub 克隆项目到服务器](#步骤-4从-github-克隆项目到服务器)
    *   [步骤 5：构建并启动您的应用](#步骤-5构建并启动您的应用)
    *   [步骤 6：(推荐) 配置 Nginx 反向代理与 HTTPS](#步骤-6推荐-配置-nginx-反向代理与-https)
3.  [**后续更新指南 (新流程！)**](#后续更新指南-新流程)

---

## 本地准备与上传 GitHub

### 步骤 1：在本地初始化 Git 仓库

在您本地的项目根目录（`zhjh/`）下，打开终端并执行以下命令：

```bash
# 1. 初始化 Git 仓库
git init -b main

# 2. 将所有文件添加到暂存区
git add .

# 3. 创建第一次提交
git commit -m "feat: initial project setup for deployment"
```

### 步骤 2：在 GitHub 创建新仓库并上传代码

1.  **访问 GitHub** (https://github.com) 并创建一个新的**私有** (Private) 仓库，**不要**勾选任何 "Initialize this repository with" 的选项。
2.  创建后，复制页面上 "…or push an existing repository from the command line" 下方的两行命令，并在您的本地项目终端中执行。它们看起来像这样：
    ```bash
    # 将下面的 URL 替换为您自己的仓库 URL
    git remote add origin https://github.com/your-username/your-repo-name.git
    git push -u origin main
    ```

完成后，您的代码就成功上传到 GitHub 了！

---

## 首次服务器部署指南

### 步骤 3：连接到您的云服务器并准备环境

1.  **连接服务器**：
    ```bash
    ssh 用户名@服务器公网IP地址
    ```

2.  **一键安装 Git, Docker 和 Docker Compose**：
    ```bash
    # 1. 更新系统包列表
    sudo apt-get update -y
    
    # 2. 安装 Git 和其他基础工具
    sudo apt-get install -y git apt-transport-https ca-certificates curl software-properties-common

    # 3. 安装 Docker (后续步骤与之前相同)
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io

    # 4. 安装 Docker Compose (官方推荐方式)
    # 通过 apt 直接安装 Docker Compose 插件，这是最稳定可靠的方法
    sudo apt-get install -y docker-compose-plugin

    # 5. 验证安装
    # 注意：插件版的验证命令没有中间的连字符 "-"
    git --version && docker --version && docker compose version
    ```
    看到三个工具的版本号即表示成功。

### 步骤 3.5: (关键) 配置 Docker 国内镜像加速

这一步至关重要，它能解决从国外 Docker Hub 拉取镜像超时失败的问题。

1.  **创建或覆盖 Docker 配置文件，写入国内镜像地址**：
    ```bash
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json <<-'EOF'
    {
      "registry-mirrors": ["https://docker.m.daocloud.io"]
    }
    EOF
    ```

2.  **重启 Docker 服务使配置生效**：
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    ```

### 步骤 4：从 GitHub 克隆项目 (最终方案：使用 SSH)

为了彻底解决国内服务器连接 GitHub 不稳定的问题，我们将**只使用 SSH 协议**进行克隆和更新。这是最稳定可靠的方式。

1.  **在服务器上生成 SSH 密钥**：
    ```bash
    # 将引号内的邮箱换成您自己的
    ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
    ```
    (接下来会提示您输入文件名和密码，**一路按 Enter 键**使用默认设置即可，不要输入密码。)

2.  **查看并复制您的公钥**：
    ```bash
    cat ~/.ssh/id_rsa.pub
    ```
    (请完整复制屏幕上输出的 `ssh-rsa` 开头的所有内容)

3.  **在 GitHub 上添加"部署密钥"(Deploy Key)**：
    *   进入您在 GitHub 上的 `njczy/zhjh` 仓库主页。
    *   点击 `Settings` -> `Security` -> `Deploy keys`。
    *   点击 `Add deploy key` 按钮。
    *   `Title` 可以随便填写，例如 `my-jd-cloud-server`。
    *   将刚刚复制的公钥完整地粘贴到 `Key` 文本框中。
    *   **勾选 `Allow write access`**。虽然我们主要是拉取，但在某些 git 操作中这能避免一些潜在的权限问题。
    *   点击 `Add key`。

4.  **使用 SSH 地址克隆您的项目**：
    ```bash
    # 在 GitHub 仓库页面，点击 "Code"，确保切换到 "SSH" 选项卡，然后复制 URL
    git clone git@github.com:njczy/zhjh.git

    # 进入项目目录
    cd /zhjh/
    ```

### 步骤 5：构建并启动您的应用

在服务器的项目目录中，只需运行一个命令：
```bash
# 注意：新版命令是 "docker compose"（中间是空格）
sudo docker compose up --build -d
```
Docker 会自动完成所有工作。

### 步骤 6：(推荐) 配置 Nginx 反向代理与 HTTPS

这一步与之前的指南完全相同，您可以直接参考。配置时，请确保使用的是克隆下来的新项目目录中的 `update2025/nginx.conf` 文件。

---

## 后续更新指南 (新流程！)

现在，更新流程变得前所未有的简单：

1.  **本地开发**：在您的电脑上修改代码。
2.  **提交并推送**：将代码改动推送到 GitHub。
    ```bash
    git add .
    git commit -m "feat: 添加了新功能" # 或者其他描述性信息
    git push origin main
    ```
3.  **登录服务器并执行一键更新**：
    ```bash
    ssh 用户名@服务器公网IP地址
    cd /zhjh/  # 进入项目目录

    # 首次拉取代码后，需要给更新脚本添加执行权限（此命令只需运行一次）
    chmod +x update2025/update.sh

    # 之后，每次更新都只需运行此脚本
    ./update2025/update.sh
    ```

脚本会自动从 GitHub 拉取最新的代码，然后重建 Docker 镜像并重启服务，全程无需手动上传文件。

# 项目部署更新说明

## 🚀 2025年1月更新

### 项目概述
本项目是一个基于 Next.js 15 的项目管理系统，支持待办事项管理、项目储备管理等功能。

### 开发环境 vs 生产环境

#### Windows 开发环境
由于 Windows 环境下的符号链接权限限制，建议使用以下命令进行开发：

```bash
# 开发环境启动（推荐）
npm run dev:win

# 开发环境构建（不使用 standalone）
npm run build:win
```

#### Linux 生产环境（Docker）
生产环境使用 standalone 输出模式，适合容器化部署：

```bash
# 标准构建（包含 standalone 输出）
npm run build

# Docker 专用构建
npm run build:docker
```

### 🐳 Docker 部署

#### 1. 构建镜像
```bash
docker build -t zhjh-app .
```

#### 2. 使用 Docker Compose 启动
```bash
docker-compose up -d
```

#### 3. 访问应用
- 本地访问：http://localhost
- 服务器访问：http://your-server-ip

### 📁 项目结构说明

```
zhjh/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API 路由
│   ├── todo/              # 待办页面
│   ├── reserve-projects/  # 储备项目页面
│   └── monthly-reviews/   # 月度审核页面
├── components/            # React 组件
├── lib/                   # 工具函数
├── data/                  # 数据文件
├── public/                # 静态资源
├── Dockerfile             # Docker 构建文件
├── docker-compose.yml     # Docker Compose 配置
├── next.config.mjs        # Next.js 生产配置
├── next.config.dev.mjs    # Next.js 开发配置（Windows 兼容）
└── update2025/           # 部署脚本和配置
```

### ⚙️ 配置文件说明

#### next.config.mjs（生产环境）
- 启用 `output: 'standalone'` 用于 Docker 部署
- 优化包导入和构建性能
- 配置 ESLint 和 TypeScript 忽略规则

#### next.config.dev.mjs（开发环境）
- 禁用 `output: 'standalone'` 避免 Windows 符号链接问题
- 添加 webpack 监听配置
- 优化开发体验

### 🔧 常见问题解决

#### Windows 符号链接权限问题
如果在 Windows 环境下遇到 `EPERM: operation not permitted, symlink` 错误：

1. **使用开发配置**：
   ```bash
   npm run dev:win
   npm run build:win
   ```

2. **以管理员权限运行**：
   - 右键点击 PowerShell 或 CMD
   - 选择"以管理员身份运行"
   - 重新执行构建命令

3. **启用开发者模式**：
   - 打开 Windows 设置
   - 转到"更新和安全" > "开发者选项"
   - 启用"开发者模式"

#### 生产环境部署
1. **京东云服务器部署**：
   ```bash
   # 克隆代码
   git clone <repository-url>
   cd zhjh
   
   # 构建和启动
   docker-compose up -d
   ```

2. **Nginx 配置**：
   使用 `update2025/nginx.conf` 配置反向代理

3. **更新脚本**：
   使用 `update2025/update.sh` 进行自动化更新

### 📋 部署检查清单

- [ ] 环境变量配置（.env.local）
- [ ] 数据文件权限设置
- [ ] Docker 和 Docker Compose 安装
- [ ] 防火墙端口开放（80, 443）
- [ ] SSL 证书配置（如需要）
- [ ] 备份策略设置

### 🔄 更新流程

1. **开发环境测试**：
   ```bash
   npm run dev:win
   ```

2. **构建验证**：
   ```bash
   npm run build:win  # Windows 本地验证
   npm run build      # 生产构建验证
   ```

3. **部署到生产**：
   ```bash
   git push origin main
   # 在服务器上执行 update.sh
   ```

### 📞 技术支持

如遇到部署问题，请检查：
1. Node.js 版本（推荐 20.x）
2. pnpm 版本和缓存
3. Docker 环境配置
4. 网络连接和防火墙设置

## 🚀 新增更新脚本说明

### update.sh - 完整更新脚本
- 自动检测 Git 协议（SSH/HTTPS）
- 智能网络连接检测和备用方案
- 完整的 Docker 构建和部署流程
- 错误处理和状态检查

### quick-update.sh - 快速更新脚本
- 简化的更新流程，适合日常开发
- 快速拉取代码并重新部署
- 最小化停机时间

### 使用建议

**首次部署或重大更新**：
```bash
./update2025/update.sh
```

**日常开发更新**：
```bash
./update2025/quick-update.sh
```

**手动控制**：
```bash
# 仅拉取代码
git pull origin main

# 仅重新部署
docker-compose up -d --build
```

---

**最后更新**：2025年1月
**维护者**：项目开发团队 

# 项目更新部署说明

## 📋 目录
- [快速更新](#快速更新)
- [构建问题解决](#构建问题解决)
- [详细部署流程](#详细部署流程)
- [网络配置](#网络配置)
- [故障排除](#故障排除)

## 🚀 快速更新

### 标准更新（推荐）
```bash
# 标准更新流程
sudo bash ./update2025/update.sh
```

### 优化更新（解决构建卡顿）
```bash
# 解决构建卡在 "Generating static pages" 的问题
sudo bash ./update2025/quick-update-optimized.sh
```

## 🔧 构建问题解决

### 问题：构建卡在 "Generating static pages"

**症状:**
- 构建进度停在 "Generating static pages (0/22)" 
- 长时间无响应（超过 15 分钟）
- 内存占用过高

**根本原因:**
1. **大量静态页面**: 项目包含多个复杂页面需要预渲染
2. **服务端数据加载**: 构建时读取 data/ 目录下的 JSON 文件
3. **内存不足**: 默认 Node.js 内存限制不够
4. **依赖复杂**: 大量 UI 组件库依赖

**解决方案:**

#### 方案 1: 使用优化脚本（推荐）
```bash
# 运行构建问题修复脚本
sudo bash ./update2025/fix-build-issues.sh

# 然后使用优化更新
sudo bash ./update2025/quick-update-optimized.sh
```

#### 方案 2: 手动优化
```bash
# 1. 清理缓存
rm -rf .next node_modules/.cache
sudo docker builder prune -f

# 2. 设置环境变量
export NODE_OPTIONS="--max-old-space-size=6144"
export NEXT_TELEMETRY_DISABLED=1

# 3. 使用优化配置构建
cp next.config.build.mjs next.config.mjs
npm run build
```

#### 方案 3: 分步构建
```bash
# 1. 先构建依赖
npm ci --only=production

# 2. 增加 swap（如果内存不足）
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. 监控构建过程
./update2025/monitor-build.sh &

# 4. 执行构建
timeout 1800 npm run build
```

### 构建优化配置说明

**内存优化:**
- 增加 Node.js 堆内存: `--max-old-space-size=6144`
- 增加半空间内存: `--max-semi-space-size=512`
- 启用系统 swap 空间

**构建优化:**
- 跳过 TypeScript 类型检查
- 跳过 ESLint 检查
- 禁用遥测数据收集
- 优化包分割策略

**Docker 优化:**
- 启用 BuildKit 并行构建
- 使用多阶段构建
- 优化镜像层缓存

## 📊 监控工具

### 构建过程监控
```bash
# 启动监控（在另一个终端）
./update2025/monitor-build.sh
```

### 系统资源检查
```bash
# 检查内存
free -h

# 检查磁盘空间
df -h

# 检查 Docker 状态
sudo docker system df
```

## ⚡ 性能调优建议

### 服务器配置建议
- **内存**: 最少 8GB，推荐 16GB+
- **CPU**: 最少 4 核，推荐 8 核+
- **磁盘**: 最少 20GB 可用空间
- **网络**: 稳定的网络连接

### 构建时间预期
- **首次构建**: 15-30 分钟
- **增量构建**: 8-15 分钟
- **缓存构建**: 3-8 分钟

### 构建阶段说明
1. **依赖安装** (2-5 分钟): 下载 npm 包
2. **TypeScript 编译** (3-8 分钟): 编译 TS 代码
3. **静态页面生成** (5-15 分钟): 预渲染页面 ⚠️ 最容易卡住的阶段
4. **资源优化** (1-3 分钟): 压缩和优化
5. **Docker 打包** (2-5 分钟): 创建容器镜像

## 🚨 故障排除

### 常见问题解决

#### 1. 构建超时
```bash
# 症状: 构建超过 30 分钟
# 解决: 增加超时时间和内存
export NODE_OPTIONS="--max-old-space-size=8192"
timeout 3600 npm run build  # 1 小时超时
```

#### 2. 内存不足
```bash
# 症状: JavaScript heap out of memory
# 解决: 增加虚拟内存
sudo dd if=/dev/zero of=/swapfile bs=1G count=8
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 3. 磁盘空间不足
```bash
# 清理 Docker 资源
sudo docker system prune -af
sudo docker volume prune -f

# 清理 npm 缓存
npm cache clean --force
```

#### 4. 网络连接问题
```bash
# 使用国内镜像
npm config set registry https://registry.npmmirror.com
```

#### 5. 权限问题
```bash
# 修复 Docker 权限
sudo usermod -aG docker $USER
newgrp docker
```

### 日志分析

#### 查看构建日志
```bash
# Docker 构建日志
sudo docker logs $(sudo docker ps -aq | head -1)

# 系统日志
journalctl -u docker -f
```

#### 构建进度追踪
```bash
# 实时监控构建输出
tail -f /var/log/docker.log | grep -E "(Step|RUN|COPY|Generating)"
```

## 🔄 回滚机制

### 快速回滚
```bash
# 回滚到上一个版本
sudo docker tag zhjh-app:latest zhjh-app:rollback
sudo docker-compose down
sudo docker-compose up -d
```

### 保存当前版本
```bash
# 构建前备份
sudo docker tag zhjh-app:latest zhjh-app:backup-$(date +%Y%m%d-%H%M%S)
```

## 📞 技术支持

如果遇到构建问题，请提供以下信息：
1. 错误日志
2. 系统配置 (`free -h`, `df -h`)
3. Docker 版本 (`docker --version`)
4. Node.js 版本 (`node --version`)

**联系方式:**
- 查看日志: `sudo docker-compose logs app`
- 系统状态: `sudo docker-compose ps`
- 重启服务: `sudo docker-compose restart app` 