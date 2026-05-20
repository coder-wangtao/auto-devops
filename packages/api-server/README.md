# @devops-automation/api-server

运维自动化平台API服务

## 功能特性

- 🔌 RESTful API - 提供完整的REST API接口
- 🔄 WebSocket服务 - 实时通信支持
- 🔐 认证授权 - JWT认证和RBAC权限控制
- 📊 任务管理 - 工作流和任务管理API
- 📝 日志服务 - 日志查询和实时推送

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

## 环境变量

创建 `.env` 文件：

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/devops
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

## 部署

### Docker部署

```bash
docker build -t devops-api .
docker run -p 3001:3001 devops-api
```

### Kubernetes部署

参考 `k8s/` 目录下的配置文件。

## API文档

启动服务后访问：`http://localhost:3001/api-docs`

## 许可证

MIT

