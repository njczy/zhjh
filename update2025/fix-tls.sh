#!/bin/bash
# TLS/SSL 问题修复脚本

echo "=== Git TLS/SSL 问题修复脚本 ==="
echo

# 显示当前配置
echo "1. 当前 Git SSL 配置:"
echo "   SSL 验证: $(git config --get http.sslVerify || echo '默认启用')"
echo "   SSL 后端: $(git config --get http.sslBackend || echo '系统默认')"
echo "   HTTP 版本: $(git config --get http.version || echo '系统默认')"
echo

# 备份当前配置
echo "2. 备份当前配置..."
git config --list | grep -E "http\.|https\." > /tmp/git-config-backup.txt
echo "   配置已备份到 /tmp/git-config-backup.txt"
echo

# 应用修复
echo "3. 应用 TLS/SSL 修复..."

# 方案1: 禁用 SSL 验证（临时解决方案）
echo "   应用方案1: 禁用 SSL 验证"
git config --global http.sslVerify false

# 方案2: 切换 SSL 后端
echo "   应用方案2: 切换到 OpenSSL 后端"
git config --global http.sslBackend openssl

# 方案3: 设置 HTTP 版本
echo "   应用方案3: 设置 HTTP 版本"
git config --global http.version HTTP/1.1

# 方案4: 增加超时时间
echo "   应用方案4: 增加超时时间"
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999

echo

# 测试修复效果
echo "4. 测试修复效果..."
echo "   测试 Git 连接..."

if timeout 30 git ls-remote origin >/dev/null 2>&1; then
    echo "   ✅ Git 连接修复成功！"
    FIXED=true
else
    echo "   ❌ Git 连接仍然失败"
    FIXED=false
fi

echo

# 提供后续建议
if [ "$FIXED" = true ]; then
    echo "🎉 修复成功！现在可以运行更新脚本："
    echo "   ./udpate2025/update.sh"
else
    echo "🔧 如果问题仍然存在，请尝试以下方案："
    echo
    echo "方案A: 切换到 SSH 协议"
    echo "   git remote set-url origin git@github.com:njczy/zhjh.git"
    echo
    echo "方案B: 使用 Gitee 镜像"
    echo "   git remote add gitee https://gitee.com/your-username/zhjh.git"
    echo
    echo "方案C: 更新系统证书"
    echo "   # Ubuntu/Debian:"
    echo "   sudo apt-get update && sudo apt-get install ca-certificates"
    echo "   # CentOS/RHEL:"
    echo "   sudo yum update ca-certificates"
    echo
    echo "方案D: 恢复原始配置"
    echo "   git config --global --unset http.sslVerify"
    echo "   git config --global --unset http.sslBackend"
    echo "   git config --global --unset http.version"
    echo "   git config --global --unset http.lowSpeedLimit"
    echo "   git config --global --unset http.lowSpeedTime"
fi

echo
echo "=== 修复脚本完成 ===" 