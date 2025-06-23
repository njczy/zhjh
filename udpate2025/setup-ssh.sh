#!/bin/bash
# GitHub SSH 连接设置脚本

echo "=== GitHub SSH 连接设置脚本 ==="
echo

# 检查是否已有 SSH 密钥
if [ -f ~/.ssh/id_rsa ]; then
    echo "✅ 检测到现有 SSH 密钥"
    echo "公钥内容："
    echo "----------------------------------------"
    cat ~/.ssh/id_rsa.pub
    echo "----------------------------------------"
    echo
else
    echo "🔑 生成新的 SSH 密钥..."
    
    # 提示输入邮箱
    read -p "请输入你的 GitHub 邮箱地址: " email
    
    # 生成 SSH 密钥
    ssh-keygen -t rsa -b 4096 -C "$email" -f ~/.ssh/id_rsa -N ""
    
    echo "✅ SSH 密钥生成完成"
    echo "公钥内容："
    echo "----------------------------------------"
    cat ~/.ssh/id_rsa.pub
    echo "----------------------------------------"
    echo
fi

# 启动 SSH agent 并添加密钥
echo "🔧 配置 SSH agent..."
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa

# 配置 SSH 客户端
echo "⚙️  配置 SSH 客户端..."
mkdir -p ~/.ssh
cat > ~/.ssh/config << EOF
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
EOF

chmod 600 ~/.ssh/config

echo "📋 接下来的步骤："
echo "1. 复制上面的公钥内容"
echo "2. 访问 https://github.com/settings/ssh/new"
echo "3. 将公钥粘贴到 GitHub SSH Keys 设置中"
echo "4. 完成后按任意键继续测试连接..."
read -n 1 -s

echo
echo "🧪 测试 SSH 连接..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ SSH 连接测试成功！"
    
    # 检查项目目录
    if [ -d ".git" ]; then
        echo "🔄 将项目仓库切换到 SSH 协议..."
        
        # 获取当前远程 URL
        CURRENT_URL=$(git remote get-url origin)
        echo "当前 URL: $CURRENT_URL"
        
        # 切换到 SSH URL
        if [[ $CURRENT_URL == https://github.com/* ]]; then
            SSH_URL=$(echo $CURRENT_URL | sed 's|https://github.com/|git@github.com:|')
            git remote set-url origin "$SSH_URL"
            echo "✅ 已切换到 SSH URL: $SSH_URL"
        else
            echo "ℹ️  当前已使用 SSH 协议"
        fi
        
        # 测试 Git 操作
        echo "🧪 测试 Git 拉取..."
        if git fetch origin main; then
            echo "✅ Git SSH 连接配置成功！"
            echo "🎉 现在可以正常使用 update.sh 脚本了"
        else
            echo "❌ Git 拉取失败，请检查仓库权限"
        fi
    else
        echo "ℹ️  不在 Git 仓库目录中，跳过仓库配置"
    fi
else
    echo "❌ SSH 连接测试失败"
    echo "请确保："
    echo "1. 公钥已正确添加到 GitHub"
    echo "2. GitHub 账户有仓库访问权限"
    echo "3. 网络连接正常"
fi

echo
echo "=== SSH 设置完成 ===" 