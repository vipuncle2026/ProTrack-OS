# 营盘 OS — 项目管理一体化平台

全栈项目管理工具，涵盖项目、合同、报价、回款、成本、联系人、拜访、服务、任务等模块，配备数据可视化和操作审计。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + Recharts |
| 后端 | FastAPI + SQLAlchemy + SQLite (WAL) + Alembic |
| 认证 | JWT (HS256)，24h 有效期 |
| 图标 | Lucide React |
| 部署 | Docker + Docker Compose |

## 快速开始

```bash
# 安装依赖
npm install
cd backend && pip install -r requirements.txt && cd ..

# 启动（前后端一并）
bash start.sh
```

- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:8000`（Vite proxy 转发 `/api`）
- 默认账号：`admin` / `admin123`

## Docker 部署

```bash
# 标准部署
docker compose up -d

# 飞牛 NAS 部署（精简版 compose）
mv docker-compose.fnos.yml docker-compose.yml
docker compose up -d --build
```

详见 `FNOS_DEPLOY.md`。

## 功能模块

| 模块 | 说明 |
|---|---|
| 仪表盘 | 统计卡片 + 项目/合同/回款图表 + 月度趋势 + 待回款提醒 |
| 项目 | 全生命周期管理（潜在→报价→签订→进行中→完成→取消） |
| 合同 | 销售/采购合同，文件附件 |
| 回款 | 收款/付款记录，发票管理，按年筛选 |
| 报价 | 报价明细行，税率计算 |
| 成本 | 直接成本归集（关联项目/合同） |
| 利润 | 按项目汇总收入/成本/利润 |
| 联系人 | 关联项目，搜索（姓名/公司） |
| 拜访 | 拜访记录，关联项目+联系人 |
| 服务 | 服务交付，工时效管理 |
| 任务 | 任务管理，状态/优先级/截止日期 |
| 消息 | 逾期回款/到期合同/逾期任务提醒 |
| 备份 | JSON 导出 + 数据库文件下载 + ZIP 恢复 |
| 审计 | 操作日志，记录所有写操作 |

所有列表接口支持分页 + 搜索：`GET /api/projects?page=1&limit=50&search=xxx`

## 项目结构

```
├── src/                    # React 前端
│   ├── api/                # HTTP 请求封装
│   ├── components/
│   │   ├── charts/         # 图表组件（饼图/柱状图/折线图）
│   │   ├── common/         # 通用组件（Pagination 等）
│   │   ├── layout/         # Layout + Sidebar
│   │   └── ui/             # UI 组件（StatCard 等）
│   ├── constants/          # 主题/颜色常量
│   ├── pages/              # 页面组件
│   ├── store/              # Zustand 状态管理
│   └── utils/              # 工具函数
├── backend/                # FastAPI 后端
│   ├── routers/            # API 路由（14 个模块）
│   ├── models.py           # SQLAlchemy 模型
│   ├── schemas.py          # Pydantic 校验
│   ├── crud_router.py      # CRUD 路由工厂
│   ├── pagination.py       # 分页工具
│   ├── middleware.py       # 操作审计中间件
│   ├── seed.py             # 种子数据
│   └── alembic/            # DB 迁移
├── docker-compose.yml      # Docker 部署（标准版）
├── docker-compose.fnos.yml # Docker 部署（飞牛 NAS 精简版）
├── nginx.conf              # 前端 nginx 配置
├── Dockerfile              # 前端镜像
└── FNOS_DEPLOY.md          # 飞牛 NAS 部署指南
```

## 数据库迁移

```bash
cd backend
alembic revision --autogenerate -m "描述变更"
alembic upgrade head
alembic downgrade -1
```

## 架构特性

- **CRUD 路由工厂**：统一 10+ 业务路由的增删改查，新增实体只需配置
- **前端 Store 模块化**：Zustand slices（auth/entity/backup/ui），entity 使用泛型工厂
- **服务端分页**：列表按需加载，支持搜索和年份筛选
- **Design Tokens**：Tailwind 语义化颜色/字体/圆角/阴影，图表颜色统一常量管理
- **操作审计**：中间件自动记录所有 API 写操作
- **通知系统**：自动检测逾期回款/到期合同/逾期任务
