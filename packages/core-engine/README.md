# @devops-automation/core-engine

运维自动化平台核心引擎 - 提供流程执行、任务调度、插件管理、资源管理等核心功能

## 安装

```bash
npm install @devops-automation/core-engine
# 或
pnpm add @devops-automation/core-engine
# 或
yarn add @devops-automation/core-engine
```

## 使用

```typescript
import { WorkflowExecutor, TaskScheduler, PluginManager } from '@devops-automation/core-engine';

// 创建流程执行器
const executor = new WorkflowExecutor();

// 创建任务调度器
const scheduler = new TaskScheduler();

// 创建插件管理器
const pluginManager = new PluginManager();
```

## 功能模块

- **WorkflowExecutor** - 流程执行器：执行工作流定义
- **TaskScheduler** - 任务调度器：管理任务队列和调度
- **PluginManager** - 插件管理器：加载和管理插件
- **ResourceManager** - 资源管理器：管理系统资源

## 许可证

MIT

