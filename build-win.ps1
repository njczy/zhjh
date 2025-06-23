# Windows 开发环境构建脚本
# 备份原配置文件
Copy-Item "next.config.mjs" "next.config.prod.mjs" -Force

# 使用开发配置
Copy-Item "next.config.dev.mjs" "next.config.mjs" -Force

Write-Host "使用开发配置构建（禁用 standalone 输出）..." -ForegroundColor Green

# 执行构建
npm run build

# 恢复生产配置
Copy-Item "next.config.prod.mjs" "next.config.mjs" -Force

# 清理临时文件
Remove-Item "next.config.prod.mjs" -Force

Write-Host "构建完成，已恢复生产配置" -ForegroundColor Green 