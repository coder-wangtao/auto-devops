/**
 * API服务入口文件
 * @module api-server
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import workflowRoutes from './routes/workflow.routes.js';
import appTypeRoutes from './routes/app-type.routes.js';
import applicationRoutes from './routes/application.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { pluginService, workflowService } from './services/workflow.service.js';
import { exampleWorkflows } from './data/example-workflows.js';
import { initializeExampleAppTypes } from './data/example-app-types.js';
import { initializeExampleApplications } from './data/example-applications.js';
import { applicationService } from './services/application.service.js';
import { registerAllPlugins } from './utils/plugin-loader.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 从 plugins/ 目录加载并注册所有插件
registerAllPlugins(plugin => {
  pluginService.registerPlugin(plugin);
}).catch(error => {
  console.error('❌ 插件注册失败:', error);
  process.exit(1);
});

// 初始化示例工作流
exampleWorkflows.forEach(workflow => {
  workflowService.createWorkflow(workflow);
});

console.log(`✅ 已加载 ${exampleWorkflows.length} 个示例工作流`);

// 初始化示例应用类型
const appTypes = initializeExampleAppTypes();
console.log(`✅ 已加载 ${appTypes.length} 个示例应用类型`);

// 初始化示例应用（为默认工作流创建对应的应用类型和应用）
initializeExampleApplications();
const applications = applicationService.getAllApplications();
console.log(`✅ 已加载 ${applications.length} 个示例应用`);

// 路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API服务运行正常', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '运维自动化平台 API',
    version: '1.0.0',
    endpoints: {
      workflows: '/api/workflows',
      plugins: '/api/plugins',
      scheduler: '/api/scheduler',
      appTypes: '/api/app-types',
      applications: '/api/applications',
    },
  });
});

app.use('/api', workflowRoutes);
app.use('/api', appTypeRoutes);
app.use('/api', applicationRoutes);

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 API服务已启动`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`🌐 访问: http://localhost:${PORT}`);
  console.log(`📚 API文档: http://localhost:${PORT}/api`);
});
