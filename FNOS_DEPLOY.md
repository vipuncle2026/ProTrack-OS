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

### 1. 上传项目文件

将整个 `protrack` 文件夹上传到飞牛 NAS 的**数据盘**（不要放系统盘）。

在文件管理中右键项目文件夹 → 查看详细信息 → 复制原始路径，例如：
```
/vol2/1000/Docker/protrack
```

### 2. 重命名 compose 文件

飞牛 Docker 面板默认读取 `docker-compose.yml`。有两种方式：

**方式 A**：直接使用飞牛专用版
```bash
# 把飞牛版重命名为默认文件名
mv docker-compose.fnos.yml docker-compose.yml
```

**方式 B**：把标准版改名备份，飞牛版顶上
```bash
mv docker-compose.yml docker-compose.yml.bak
mv docker-compose.fnos.yml docker-compose.yml
```

### 3. 配置环境变量（可选）

项目根目录下新建 `.env` 文件：
```
SECRET_KEY=换成你自己的随机字符串
PORT=8088
```

不创建的话会用默认值。

### 4. 创建 Docker 项目

飞牛桌面 → Docker → 项目 → 创建项目：
- **名称**：protrack
- **路径**：选择项目文件夹（不是里面的子文件夹）
- 点确定，等待构建

首次构建需要 5-15 分钟（npm 装包 + Python 装包），后续更新会走缓存快很多。

### 5. 访问

构建完成后，浏览器打开：
```
http://飞牛内网IP:8088
```

默认账号：`admin` / `admin123`

## 数据持久化

SQLite 数据库和上传的文件保存在 `protrack/data/` 目录下，已通过 volume 映射持久化。删除容器不会丢失数据。

## 更新方法

```bash
# SSH 进飞牛，进入项目目录
cd /vol2/1000/Docker/protrack

# 拉最新代码
git pull

# 重建
docker compose up -d --build
```

## 常见问题

**Q: 构建失败，报 npm/pip 超时？**
A: 检查 Dockerfile 里的国内镜像源是否生效。如果还是慢，确认飞牛的 Docker 镜像仓库设置已换源。

**Q: 端口冲突？**
A: 改 `.env` 里的 `PORT`，或者直接改 `docker-compose.yml` 的 `8088:80` 左边数字。

**Q: 构建非常慢？**
A: NAS 的 CPU 性能有限，首次 npm ci 要几分钟是正常的。后续构建有缓存会快。
