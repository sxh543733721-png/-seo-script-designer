#!/bin/bash

# SEO视频脚本设计师 1.0 - 启动脚本
# SEO Video Script Designer 1.0 - Startup Script

cd "$(dirname "$0")"

echo "🎬 SEO视频脚本设计师 1.0"
echo "SEO Video Script Designer 1.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js"
    echo "❌ Node.js not found"
    echo ""
    echo "请先安装 Node.js: https://nodejs.org"
    echo "Please install Node.js first"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    echo "📦 First run, installing dependencies..."
    npm install
    echo ""
fi

# 清理端口
echo "🧹 清理端口..."
lsof -ti :3000 | xargs kill -9 2>/dev/null
sleep 1

# 启动服务器
echo "🚀 启动服务器..."
echo ""
npm start &

# 等待服务器启动
sleep 3

# 打开浏览器
echo "🌐 打开浏览器..."
open "http://localhost:3000"

echo ""
echo "✅ 工具已启动！"
echo "✅ Tool is running!"
echo ""
echo "📡 访问地址: http://localhost:3000"
echo "📚 知识库已加载: Wegic + SEO"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 保持运行
wait

