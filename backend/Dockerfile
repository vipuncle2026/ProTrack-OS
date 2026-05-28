FROM python:3.12-slim

WORKDIR /app

# 使用清华镜像源加速 apt
RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || true

# 安装编译依赖（bcrypt / cryptography）
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# 先复制依赖文件（利用 Docker 层缓存）
COPY requirements.txt .
# 使用清华 pip 镜像源加速
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# 清理编译工具（减小镜像体积）
RUN apt-get remove -y build-essential libffi-dev && apt-get autoremove -y && apt-get clean

# 复制后端代码
COPY . .

# 创建数据目录（SQLite 持久化 volume）
RUN mkdir -p /app/data

EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
