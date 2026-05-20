# 运维自动化平台

基于JavaScript技术栈构建的现代化运维自动化平台，旨在降低学习成本，提升开发效率。

## 项目概述

传统的Jenkins配置语法学习曲线陡峭，对于前端开发者不够友好。本项目通过JavaScript技术栈构建一个现代化的运维自动化平台，提供：

- **降低学习门槛**：使用JavaScript替代Jenkins的Groovy语法
- **灵活扩展**：通过npm包机制实现流程插件的灵活扩展
- **可视化操作**：提供友好的Web界面进行流程配置和管理
- **通用适配**：支持多种测试场景和部署环境

## 技术栈

- **后端引擎**：Node.js + TypeScript
- **前端界面**：React + TypeScript + Ant Design
- **插件系统**：npm包机制
- **数据库**：PostgreSQL / MongoDB
- **消息队列**：Redis / RabbitMQ
- **容器化**：Docker + Kubernetes

## 项目结构

```
devops-automation-platform/
├── packages/              # 核心包
│   ├── core-engine/      # 核心引擎
│   ├── plugin-sdk/       # 插件SDK
│   ├── web-dashboard/    # Web管理界面
│   └── api-server/       # API服务
├── plugins/               # 标准插件库
│   ├── git-plugin/       # Git操作插件
│   ├── docker-plugin/    # Docker操作插件
│   ├── k8s-plugin/       # Kubernetes插件
│   ├── test-plugin/      # 测试插件
│   └── deploy-plugin/    # 部署插件
├── examples/             # 示例项目
├── docs/                 # 文档
└── scripts/              # 脚本工具
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动所有服务
pnpm dev

# 启动特定包
pnpm --filter @devops-automation/api-server dev
pnpm --filter @devops-automation/web-dashboard dev
```

### 构建项目

```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm --filter @devops-automation/core-engine build
```

### 代码检查

```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 类型检查
pnpm type-check
```

## 包说明

### @devops-automation/core-engine

核心引擎，包含流程执行器、任务调度器、插件管理器、资源管理器等核心功能。

**可独立发布**：✅ 可作为npm包发布

### @devops-automation/plugin-sdk

插件开发SDK，提供插件开发的基础类型、基类和工具函数。

**可独立发布**：✅ 可作为npm包发布（推荐）

### @devops-automation/web-dashboard

Web管理界面，提供流程设计器、任务监控、日志查看等功能。

**可独立部署**：✅ 前端应用，构建后可独立部署

### @devops-automation/api-server

API服务，提供RESTful API和WebSocket服务。

**可独立部署**：✅ 后端服务，可独立部署运行

## 独立部署和发布

本项目采用模块化设计，各个包可以独立部署和发布：

- **npm包发布**：`plugin-sdk` 和 `core-engine` 可以发布到npm供其他项目使用
- **独立部署**：`web-dashboard` 和 `api-server` 可以独立部署到不同环境
- **完整部署**：也可以将所有模块一起部署作为完整平台

详细部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 开发指南

详细的开发指南请参考 [docs/guides/README.md](./docs/guides/README.md)

## 插件开发

插件开发文档请参考 [docs/plugins/README.md](./docs/plugins/README.md)

## API文档

API接口文档请参考 [docs/api/README.md](./docs/api/README.md)

## 许可证

MIT

