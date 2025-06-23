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
    cd zhjh/
    ```

### 步骤 5：构建并启动您的应用

在服务器的项目目录中，只需运行一个命令：
```bash
# 注意：新版命令是 "docker compose"（中间是空格）
sudo docker compose up --build -d
```
Docker 会自动完成所有工作。

### 步骤 6：(推荐) 配置 Nginx 反向代理与 HTTPS

这一步与之前的指南完全相同，您可以直接参考。配置时，请确保使用的是克隆下来的新项目目录中的 `udpate2025/nginx.conf` 文件。

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
    cd your-repo-name/  # 进入项目目录

    # 首次拉取代码后，需要给更新脚本添加执行权限（此命令只需运行一次）
    chmod +x udpate2025/update.sh

    # 之后，每次更新都只需运行此脚本
    ./udpate2025/update.sh
    ```

脚本会自动从 GitHub 拉取最新的代码，然后重建 Docker 镜像并重启服务，全程无需手动上传文件。 