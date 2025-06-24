# Windows 开发环境构建脚本
Write-Host "Windows 环境构建开始..." -ForegroundColor Green
Write-Host "使用开发配置（禁用 standalone 输出以避免权限问题）" -ForegroundColor Yellow

# 设置环境变量强制使用开发配置
$env:FORCE_DEV_CONFIG = "true"

# 执行构建
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Windows 构建成功完成!" -ForegroundColor Green
} else {
    Write-Host "构建失败，退出码: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 清理环境变量
Remove-Item Env:FORCE_DEV_CONFIG -ErrorAction SilentlyContinue 