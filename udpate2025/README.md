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

    # 4. 安装 Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # 5. 验证安装
    git --version && docker --version && docker-compose --version
    ```
    看到三个工具的版本号即表示成功。

### 步骤 4：从 GitHub 克隆项目到服务器

1.  **对于私有仓库，配置 SSH 密钥是最佳实践**：
    *   在**服务器**上生成 SSH 密钥：`ssh-keygen -t rsa -b 4096 -C "your_email@example.com"` (一路回车)。
    *   查看并复制公钥：`cat ~/.ssh/id_rsa.pub`
    *   将公钥添加到您的 GitHub 仓库的 `Settings` -> `Deploy Keys` 中，并勾选 `Allow write access`。

2.  **克隆您的项目**：
    ```bash
    # 使用 SSH 地址克隆，URL 从 GitHub 仓库页面复制
    git clone git@github.com:your-username/your-repo-name.git
    
    # 进入项目目录
    cd your-repo-name/
    ```

### 步骤 5：构建并启动您的应用

在服务器的项目目录中，只需运行一个命令：
```bash
sudo docker-compose up --build -d
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
    ./udpate2025/update.sh # 直接运行更新脚本
    ```

脚本会自动从 GitHub 拉取最新的代码，然后重建 Docker 镜像并重启服务，全程无需手动上传文件。 