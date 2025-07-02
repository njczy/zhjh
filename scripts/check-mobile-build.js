#!/usr/bin/env node

/**
 * 检查移动端构建和部署的脚本
 * 用于诊断移动端样式在生产环境不生效的问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查移动端构建配置...\n');

// 检查Next.js构建输出
function checkBuildOutput() {
  console.log('📁 检查构建输出目录:');
  
  const buildDir = path.join(process.cwd(), '.next');
  const standaloneDir = path.join(buildDir, 'standalone');
  const staticDir = path.join(buildDir, 'static');
  
  console.log(`   .next目录: ${fs.existsSync(buildDir) ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`   standalone目录: ${fs.existsSync(standaloneDir) ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`   static目录: ${fs.existsSync(staticDir) ? '✅ 存在' : '❌ 不存在'}`);
  
  if (fs.existsSync(staticDir)) {
    const cssFiles = fs.readdirSync(path.join(staticDir, 'css')).filter(f => f.endsWith('.css'));
    console.log(`   CSS文件数量: ${cssFiles.length}`);
    cssFiles.forEach(file => console.log(`     - ${file}`));
  }
  
  console.log();
}

// 检查Tailwind配置
function checkTailwindConfig() {
  console.log('🎨 检查Tailwind配置:');
  
  const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.ts');
  if (fs.existsSync(tailwindConfigPath)) {
    const content = fs.readFileSync(tailwindConfigPath, 'utf8');
    
    console.log(`   配置文件: ✅ 存在`);
    console.log(`   包含safelist: ${content.includes('safelist') ? '✅ 是' : '❌ 否'}`);
    console.log(`   包含responsive断点: ${content.includes('md:') ? '✅ 是' : '❌ 否'}`);
    
    // 检查content配置
    if (content.includes('content:')) {
      const contentMatch = content.match(/content:\s*\[([\s\S]*?)\]/);
      if (contentMatch) {
        const contentArray = contentMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
        console.log(`   content包含项目: ${contentArray.length}`);
        contentArray.forEach(item => console.log(`     - ${item}`));
      }
    }
  } else {
    console.log(`   配置文件: ❌ 不存在`);
  }
  
  console.log();
}

// 检查CSS文件内容
function checkCSSContent() {
  console.log('📄 检查CSS内容:');
  
  const cssDir = path.join(process.cwd(), '.next', 'static', 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    
    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`   ${file}:`);
      console.log(`     大小: ${(content.length / 1024).toFixed(2)}KB`);
      console.log(`     包含md\\:: ${content.includes('md:') ? '✅ 是' : '❌ 否'}`);
      console.log(`     包含sm\\:: ${content.includes('sm:') ? '✅ 是' : '❌ 否'}`);
      console.log(`     包含hidden: ${content.includes('hidden') ? '✅ 是' : '❌ 否'}`);
      console.log(`     包含block: ${content.includes('block') ? '✅ 是' : '❌ 否'}`);
    });
  } else {
    console.log('   ❌ CSS目录不存在');
  }
  
  console.log();
}

// 检查package.json构建脚本
function checkBuildScripts() {
  console.log('📦 检查构建脚本:');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    console.log(`   build脚本: ${pkg.scripts?.build || '❌ 未定义'}`);
    console.log(`   build:linux脚本: ${pkg.scripts?.['build:linux'] || '❌ 未定义'}`);
    console.log(`   start脚本: ${pkg.scripts?.start || '❌ 未定义'}`);
  }
  
  console.log();
}

// 检查环境变量
function checkEnvironment() {
  console.log('🌍 检查环境变量:');
  
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
  console.log(`   NEXT_TELEMETRY_DISABLED: ${process.env.NEXT_TELEMETRY_DISABLED || '未设置'}`);
  console.log(`   平台: ${process.platform}`);
  
  console.log();
}

// 生成修复建议
function generateRecommendations() {
  console.log('💡 修复建议:');
  console.log('');
  console.log('1. 确保构建命令正确:');
  console.log('   npm run build:linux  # 用于Linux服务器');
  console.log('');
  console.log('2. 检查Dockerfile中的构建步骤:');
  console.log('   RUN pnpm run build:linux');
  console.log('');
  console.log('3. 确保静态文件正确复制:');
  console.log('   cp -r ./.next/static ./.next/standalone/.next/static');
  console.log('');
  console.log('4. 在组件中添加调试类:');
  console.log('   className="debug-mobile md:hidden"');
  console.log('');
  console.log('5. 检查CSP和安全策略是否阻止CSS加载');
  console.log('');
}

// 主函数
function main() {
  checkBuildOutput();
  checkTailwindConfig();
  checkCSSContent();
  checkBuildScripts();
  checkEnvironment();
  generateRecommendations();
}

main();