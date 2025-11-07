#!/bin/bash

# AI-CRM 前端预览启动脚本

echo "🎨 启动 AI-CRM 前端预览服务器..."
echo ""

# 检查 Python3
if command -v python3 &> /dev/null; then
    echo "✓ 使用 Python3 启动服务器"
    echo "📱 在浏览器中访问: http://localhost:8080"
    echo "💡 按 Ctrl+C 停止服务器"
    echo ""
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "✓ 使用 Python 启动服务器"
    echo "📱 在浏览器中访问: http://localhost:8080"
    echo "💡 按 Ctrl+C 停止服务器"
    echo ""
    python -m http.server 8080
elif command -v npx &> /dev/null; then
    echo "✓ 使用 Node.js http-server"
    echo "📱 在浏览器中访问: http://localhost:8080"
    echo "💡 按 Ctrl+C 停止服务器"
    echo ""
    npx http-server -p 8080
else
    echo "❌ 未找到 Python 或 Node.js"
    echo "请直接在浏览器中打开 index.html 文件"
fi
