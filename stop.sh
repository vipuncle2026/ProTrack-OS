#!/bin/bash
# ProTrack 一键停止脚本
# 用法: bash stop.sh

echo "🛑 停止 ProTrack..."

# 停止后端 uvicorn
if pgrep -f "uvicorn main:app" > /dev/null; then
    pkill -f "uvicorn main:app" 2>/dev/null
    echo "   ✅ 后端已停止"
else
    echo "   ℹ️  后端未运行"
fi

# 停止前端 vite
if pgrep -f "vite" > /dev/null; then
    pkill -f "vite" 2>/dev/null
    echo "   ✅ 前端已停止"
else
    echo "   ℹ️  前端未运行"
fi

echo "ProTrack 已全部停止"
