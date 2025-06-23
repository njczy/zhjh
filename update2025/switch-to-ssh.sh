#!/bin/bash
# 快速切换到 SSH 协议脚本

echo "=== 切换到 SSH 协议脚本 ==="
echo

# 检查是否在 Git 仓库中
if [ ! -d ".git" ]; then
    echo "❌ 当前目录不是 Git 仓库"
    echo "请在项目根目录中运行此脚本"
    exit 1
fi

# 获取当前远程 URL
CURRENT_URL=$(git remote get-url origin)
echo "当前仓库 URL: $CURRENT_URL"

# 检查是否已经是 SSH 协议
if [[ $CURRENT_URL == git@github.com:* ]]; then
    echo "✅ 当前已使用 SSH 协议"
    
    # 测试 SSH 连接
    echo "🧪 测试 SSH 连接..."
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        echo "✅ SSH 连接正常"
        echo "🎉 可以直接使用 update.sh 脚本"
    else
        echo "❌ SSH 连接失败"
        echo "💡 请运行 ./udpate2025/setup-ssh.sh 配置 SSH 密钥"
    fi
    exit 0
fi

# 转换 HTTPS URL 到 SSH URL
if [[ $CURRENT_URL == https://github.com/* ]]; then
    SSH_URL=$(echo $CURRENT_URL | sed 's|https://github.com/|git@github.com:|')
    echo "将切换到 SSH URL: $SSH_URL"
    
    # 检查 SSH 连接
    echo "🧪 测试 SSH 连接..."
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        echo "✅ SSH 连接正常"
        
        # 切换 URL
        git remote set-url origin "$SSH_URL"
        echo "✅ 已成功切换到 SSH 协议"
        
        # 验证切换
        NEW_URL=$(git remote get-url origin)
        echo "新的仓库 URL: $NEW_URL"
        
        # 测试拉取
        echo "🧪 测试 Git 拉取..."
        if git fetch origin main; then
            echo "✅ SSH 拉取测试成功！"
            echo "🎉 现在可以正常使用 update.sh 脚本了"
        else
            echo "❌ SSH 拉取失败，请检查仓库权限"
        fi
    else
        echo "❌ SSH 连接失败"
        echo "💡 请先运行 ./udpate2025/setup-ssh.sh 配置 SSH 密钥"
        echo "或者手动配置 SSH 密钥后再运行此脚本"
    fi
else
    echo "⚠️  无法识别的 URL 格式: $CURRENT_URL"
    echo "请手动设置正确的 GitHub SSH URL"
fi

echo
echo "=== 脚本完成 ===" 