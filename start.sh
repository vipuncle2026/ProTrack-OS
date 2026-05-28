#!/bin/bash
# ProTrack 一键启动脚本
# 用法: bash start.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "🚀 启动 ProTrack..."
echo ""

# ─── 启动后端 ──────────────────────────────────────────────────────────────────
echo "📦 启动 FastAPI 后端 (http://localhost:8000)..."
cd "$BACKEND_DIR"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"

sleep 2

# ─── 启动前端 ──────────────────────────────────────────────────────────────────
echo "🎨 启动 Vite 前端..."
cd "$SCRIPT_DIR"
npx vite --host 0.0.0.0 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

LAN_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo ""
echo "=========================================="
echo "  ProTrack 已启动！"
echo "  前端:"
echo "    本机: http://localhost:5173"
echo "    局域网: http://$LAN_IP:5173"
echo "  后端: http://localhost:8000/api"
echo "  API 文档: http://localhost:8000/docs"
echo "  默认账号: admin / admin123"
echo "=========================================="
echo ""
echo "按 Ctrl+C 停止所有服务"

# ─── 等待并清理 ────────────────────────────────────────────────────────────────
trap "echo ''; echo '🛑 停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
