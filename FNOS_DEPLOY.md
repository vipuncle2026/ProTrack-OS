# 飞牛 NAS 部署指南

## 前置准备

1. 飞牛 NAS 系统已安装 Docker
2. Docker 镜像源已更换为国内源（`Docker → 镜像仓库 → 仓库设置`）：
   ```
   https://docker.1ms.run
   https://docker.1panel.live
   ```
   改完记得右上角**停止再启动** Docker 服务

## 部署步骤

### 1. 准备文件

在飞牛文件管理中新建文件夹 `protrack`，把以下两个文件放进去：
- `docker-compose.fnos.yml`
- `.env`（新建，内容见下方）

### 2. 配置环境变量

新建 `.env` 文件：
```
SECRET_KEY=换成你自己的随机字符串
PORT=8088
```

### 3. 重命名 compose 文件

```bash
mv docker-compose.fnos.yml docker-compose.yml
```

### 4. 创建 Docker 项目

飞牛桌面 → Docker → 项目 → 创建项目：
- **名称**：protrack
- **路径**：选择 `protrack` 文件夹
- 点确定，等待拉取镜像并启动

首次拉取镜像约 1-3 分钟（取决于网速），**不需要本地编译**。

### 5. 访问

```
http://飞牛内网IP:8088
```

默认账号：`admin` / `admin123`

## 数据持久化

SQLite 数据库保存在 `protrack/data/` 目录下，通过 volume 映射持久化。删除容器不会丢失数据。

## 更新方法

GitHub 推送代码后，Actions 自动构建新镜像推送到 GitHub Container Registry (ghcr.io)。然后在飞牛上：

1. **Docker 管理** → **项目** → 找到 `protrack`
2. 点 **重建**（或先停止 → 再启动）
3. 飞牛会自动拉取 `:latest` 镜像并重启

就这么简单，不用 SSH。

## 常见问题

**Q: 拉取镜像失败？**
A: 检查 Docker 镜像仓库设置是否已换国内源。ghcr.io 国内可能需要代理，或 SSH 进飞牛手动 `docker pull ghcr.io/vipuncle2026/protrack-backend:latest` 看报错。

**Q: 端口冲突？**
A: 改 `.env` 里的 `PORT`，或者直接改 `docker-compose.yml` 的 `8088:80` 左边数字。

**Q: 怎么知道有没有新版本？**
A: 看 GitHub Actions 构建状态，绿色 √ 表示新镜像已推送。然后飞牛上点重建即可。
