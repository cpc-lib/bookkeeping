# 小猪记账（Bookkeeping）

一个前后端分离的个人记账应用：支持收支记录、自定义分类、凭证图片上传与分类维度统计（饼图），采用 JWT 双 Token 无感刷新认证。前端为移动端优先（Mobile-First）设计。

## 功能特性

- 用户注册 / 登录 / 登出，JWT 双 Token 认证（accessToken 2 小时 + refreshToken 7 天，刷新时轮换）
- 记账记录：新增、编辑、删除、按日期区间/类型/分类分页查询，附带区间收支汇总
- 分类管理：每用户独立维护支出/收入分类（emoji 图标），记录表通过名称快照保证分类删除后历史仍可展示
- 统计：分类维度收支统计（饼图 + 占比）
- 凭证图片：上传至 MinIO 对象存储，返回可直接访问的 URL
- 安全：BCrypt 密码加密、登录拦截器统一鉴权、CORS 全局放行、修改密码后全端 Token 失效
- 前端：401 无感刷新 Token（并发请求共享刷新锁）、路由登录守卫

## 技术栈

| 端 | 技术 |
| --- | --- |
| 后端 | Java 8、Spring Boot 2.7、MyBatis-Plus、MySQL 8、Redis、JWT (jjwt)、MinIO、Lombok、BCrypt |
| 前端 | React 18、TypeScript、Vite 5、Ant Design 5、TailwindCSS 3、Zustand、React Router 6、Axios、Day.js |
| 基础设施 | Docker Compose（MySQL + Redis + MinIO） |

## 项目结构

```
bookkeeping/
├── backend/                          # 后端服务 (Spring Boot, 端口 8080)
│   ├── pom.xml
│   ├── docs/
│   │   ├── api/bookkeeping.json      # Postman 接口文档 (可直接导入)
│   │   ├── env/docker-compose.yml    # 基础设施: MySQL + Redis + MinIO
│   │   └── sql/schema.sql            # 数据库建表脚本 (幂等, 可重复执行)
│   └── src/main/
│       ├── java/com/bookkeep/
│       │   ├── auth/                 # 登录拦截器 / Token 服务 / 用户上下文
│       │   ├── common/               # 统一响应 Result / 错误码 / 全局异常处理
│       │   ├── config/               # Web / MinIO / MyBatis-Plus 配置
│       │   ├── controller/           # Auth / User / Category / Record / File
│       │   ├── dto/                  # 请求与响应对象
│       │   ├── entity/               # t_user / t_category / t_record
│       │   ├── mapper/               # MyBatis-Plus Mapper
│       │   └── service/              # 业务逻辑
│       └── resources/application.yml # 应用配置
└── frontend/                         # 前端应用 (Vite, 端口 5173)
    ├── index.html
    ├── vite.config.ts                # /api 代理至 http://localhost:8080
    └── src/
        ├── api/                      # axios 封装 + 各模块接口
        ├── components/               # 饼图 / 数字键盘 / 月份选择 / 空视图
        ├── models/                   # 类型定义 / 常量
        ├── pages/                    # 登录、注册、记录、统计、分类、我的等页面
        └── stores/                   # Zustand 状态 (认证 / 数据)
```

## 快速开始

### 环境要求

- JDK 8+、Maven 3.6+
- Node.js 16+（推荐 18+）
- Docker 与 Docker Compose

### 1. 启动基础设施

```bash
docker compose -f backend/docs/env/docker-compose.yml up -d
```

| 服务 | 端口 | 说明 |
| --- | --- | --- |
| MySQL 8.0 | 3306 | 库名 `bookkeeping`，root 密码 `root123456` |
| Redis 7.2 | 6379 | 双 Token 登录缓存 |
| MinIO | 9000 / 9001 | 对象存储 API / 控制台（minioadmin / minioadmin123） |

### 2. 初始化数据库

在 MySQL 中执行建表脚本（幂等，可重复执行）：

```bash
mysql -h127.0.0.1 -uroot -proot123456 bookkeeping < backend/docs/sql/schema.sql
```

涉及三张表：`t_user`（用户）、`t_category`（分类）、`t_record`（记账记录）。

### 3. 修改后端配置

编辑 [backend/src/main/resources/application.yml](backend/src/main/resources/application.yml)，将数据源、Redis、MinIO 地址改为你的环境（默认指向 `192.168.1.200`，本地 Docker 环境可改为 `127.0.0.1` 及对应端口）：

| 配置项 | 说明 |
| --- | --- |
| `spring.datasource.*` | MySQL 连接 |
| `spring.redis.*` | Redis 连接（双 Token 缓存） |
| `jwt.secret` / `jwt.access-token-expire` / `jwt.refresh-token-expire` | JWT 密钥与有效期 |
| `minio.endpoint` / `minio.access-key` / `minio.secret-key` / `minio.bucket` | 对象存储（`voucher` 桶启动时自动创建并开放匿名只读） |

### 4. 启动后端

```bash
cd backend
mvn spring-boot:run
```

服务地址：http://localhost:8080，接口前缀 `/api`。

### 5. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173（开发模式下 `/api` 由 Vite 代理转发到后端，无跨域问题）。

## API 文档

完整的 Postman 接口文档位于 [backend/docs/api/bookkeeping.json](backend/docs/api/bookkeeping.json)，Postman → Import 导入即可使用（登录/注册会自动保存 Token 到集合变量）。

接口概览（统一响应 `{code, msg, data}`，`code=0` 成功；需登录接口携带 `Authorization: Bearer <accessToken>`）：

| 模块 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| 认证 | POST | `/api/auth/register` | 注册（直接返回双 Token） |
| 认证 | POST | `/api/auth/login` | 登录 |
| 认证 | POST | `/api/auth/refresh` | 刷新 Token（refreshToken 轮换） |
| 认证 | POST | `/api/auth/logout` | 登出 |
| 用户 | GET | `/api/user/info` | 当前登录用户信息 |
| 用户 | PUT | `/api/user/password` | 修改密码 |
| 分类 | GET | `/api/category/list` | 分类列表（可按 type 过滤） |
| 分类 | POST | `/api/category/save` | 新增 / 编辑分类 |
| 分类 | DELETE | `/api/category/{id}` | 删除分类 |
| 记录 | GET | `/api/record/page` | 分页查询（类型 / 分类 / 日期区间） |
| 记录 | POST | `/api/record/add` | 新增记录 |
| 记录 | PUT | `/api/record/update` | 编辑记录 |
| 记录 | DELETE | `/api/record/{id}` | 删除记录 |
| 记录 | GET | `/api/record/stat/category` | 分类维度统计（饼图） |
| 文件 | POST | `/api/file/upload` | 上传凭证图片（≤10MB，返回 URL） |

常用业务错误码：`1001` 用户名已注册、`1002` 用户名或密码错误、`1005` 分类名称已存在、`1006` 分类不存在、`1007` 记录不存在、`1008-1010` 文件校验/上传失败。

## 认证机制说明

1. 登录/注册成功后返回 `accessToken`（2 小时）与 `refreshToken`（7 天）。
2. 需鉴权接口由 `AuthInterceptor` 统一校验 `Authorization: Bearer <accessToken>`，失败返回 `code=401`。
3. 前端 axios 拦截器捕获 `401` 后自动调用 `/api/auth/refresh` 换取新 Token 并重放原请求（并发请求共享同一刷新锁，避免重复刷新）；刷新失败则清空登录态跳转登录页。
4. 修改密码 / 登出会使相关 Token 立即失效。

## 默认端口汇总

| 服务 | 端口 |
| --- | --- |
| 后端 Spring Boot | 8080 |
| 前端 Vite Dev Server | 5173 |
| MySQL | 3306 |
| Redis | 6379 |
| MinIO API / 控制台 | 9000 / 9001 |
