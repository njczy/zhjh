#!/bin/bash
# 网络连接诊断脚本

echo "=== 网络连接诊断 ==="
echo "时间: $(date)"
echo

# 检查基本网络连接
echo "1. 检查基本网络连接..."
if ping -c 3 8.8.8.8 >/dev/null 2>&1; then
    echo "✅ 基本网络连接正常"
else
    echo "❌ 基本网络连接失败"
fi

# 检查 DNS 解析
echo
echo "2. 检查 DNS 解析..."
if nslookup github.com >/dev/null 2>&1; then
    echo "✅ DNS 解析正常"
    echo "GitHub IP: $(nslookup github.com | grep 'Address:' | tail -1 | awk '{print $2}')"
else
    echo "❌ DNS 解析失败"
fi

# 检查 GitHub 连接
echo
echo "3. 检查 GitHub 连接..."
if ping -c 3 github.com >/dev/null 2>&1; then
    echo "✅ GitHub ping 成功"
else
    echo "❌ GitHub ping 失败"
fi

# 检查 HTTPS 端口
echo
echo "4. 检查 HTTPS 端口 (443)..."
if timeout 10 bash -c "echo >/dev/tcp/github.com/443" >/dev/null 2>&1; then
    echo "✅ GitHub HTTPS 端口可达"
else
    echo "❌ GitHub HTTPS 端口不可达"
fi

# 检查 Git 配置
echo
echo "5. 检查 Git 配置..."
echo "Git 版本: $(git --version)"
echo "远程仓库:"
git remote -v
echo "Git 代理配置:"
echo "  HTTP 代理: $(git config --get http.proxy || echo '未设置')"
echo "  HTTPS 代理: $(git config --get https.proxy || echo '未设置')"

# 测试 Git 连接
echo
echo "6. 测试 Git 连接..."
timeout 30 git ls-remote origin >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Git 远程仓库连接成功"
else
    echo "❌ Git 远程仓库连接失败"
fi

echo
echo "=== 诊断完成 ==="
echo
echo "📋 建议解决方案:"
echo "1. 如果基本网络失败 -> 检查服务器网络配置"
echo "2. 如果 DNS 失败 -> 更换 DNS 服务器 (8.8.8.8, 114.114.114.114)"
echo "3. 如果 GitHub 不可达 -> 配置代理或使用镜像源"
echo "4. 如果在中国大陆 -> 考虑使用 Gitee 镜像或配置代理" 