# 演示指南

本文档说明如何运行和演示运维自动化平台。

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动API服务

```bash
pnpm --filter @devops-automation/api-server dev
```

API服务将在 `http://localhost:3001` 启动。

### 3. 启动Web界面

```bash
pnpm --filter @devops-automation/web-dashboard dev
```

Web界面将在 `http://localhost:3000` 启动，并自动打开浏览器。

## 功能演示

### 1. 查看首页

访问 `http://localhost:3000`，可以看到：
- 系统统计信息
- 快速开始卡片
- 插件管理入口

### 2. 查看工作流

访问 `http://localhost:3000/workflows`，可以看到：
- 已创建的示例工作流列表
- 工作流执行功能
- 工作流管理功能

系统已预置两个示例工作流：
- **简单部署流程**：包含Git拉取、测试、构建、部署步骤
- **CI/CD流水线**：完整的CI/CD流程

### 3. 执行工作流

在工作流列表页面，点击"执行"按钮可以执行工作流。执行结果会显示在响应中。

### 4. 查看插件

访问 `http://localhost:3000/plugins`，可以看到：
- 已注册的5个标准插件
- 插件信息展示

### 5. 查看仪表盘

访问 `http://localhost:3000/dashboard`，可以看到：
- 系统统计信息
- 调度器状态
- 系统运行状态

## API接口测试

### 使用curl测试

```bash
# 健康检查
curl http://localhost:3001/health

# 获取所有工作流
curl http://localhost:3001/api/workflows

# 获取所有插件
curl http://localhost:3001/api/plugins

# 执行工作流
curl -X POST http://localhost:3001/api/workflows/simple-deploy/execute \
  -H "Content-Type: application/json" \
  -d '{"context": {}}'

# 获取调度器状态
curl http://localhost:3001/api/scheduler/status
```

### 使用Postman或类似工具

导入以下API端点进行测试：
- `GET /api` - API信息
- `GET /api/workflows` - 获取所有工作流
- `GET /api/workflows/:id` - 获取特定工作流
- `POST /api/workflows` - 创建工作流
- `POST /api/workflows/:id/execute` - 执行工作流
- `GET /api/plugins` - 获取所有插件
- `POST /api/plugins/:name/execute` - 执行插件

## 示例工作流

### 简单部署流程

```json
{
  "id": "simple-deploy",
  "name": "简单部署流程",
  "steps": [
    {
      "id": "step1",
      "name": "拉取代码",
      "plugin": "@devops-automation/plugin-git",
      "config": {
        "action": "pull"
      }
    },
    {
      "id": "step2",
      "name": "运行测试",
      "plugin": "@devops-automation/plugin-test",
      "config": {
        "type": "unit"
      }
    },
    {
      "id": "step3",
      "name": "构建镜像",
      "plugin": "@devops-automation/plugin-docker",
      "config": {
        "action": "build"
      }
    },
    {
      "id": "step4",
      "name": "部署到K8s",
      "plugin": "@devops-automation/plugin-k8s",
      "config": {
        "action": "deploy"
      }
    }
  ]
}
```

## 开发模式

### 同时启动所有服务

```bash
# 在项目根目录
pnpm dev
```

这会同时启动API服务和Web界面。

### 构建生产版本

```bash
# 构建所有包
pnpm build

# 启动生产版本API服务
pnpm --filter @devops-automation/api-server start
```

## 故障排查

### API服务无法启动

1. 检查端口3001是否被占用
2. 检查环境变量配置
3. 查看控制台错误信息

### Web界面无法连接API

1. 确认API服务已启动
2. 检查 `vite.config.ts` 中的代理配置
3. 检查浏览器控制台的网络请求

### 插件执行失败

1. 确认插件已正确注册
2. 检查插件配置是否正确
3. 查看API服务的日志输出

## 下一步

- 添加数据库支持（PostgreSQL/MongoDB）
- 实现WebSocket实时日志推送
- 添加用户认证和权限管理
- 实现工作流可视化设计器
- 添加更多插件支持

