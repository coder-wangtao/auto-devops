/**
 * 工作流路由
 */
import { Router } from 'express';
import { workflowService, pluginService, schedulerService } from '../services/workflow.service.js';
import { deploymentLogService } from '../services/deployment-log.service.js';

const router = Router();

// 工作流相关路由
router.get('/workflows', (req, res) => {
  try {
    const workflows = workflowService.getAllWorkflows();
    res.json({ success: true, data: workflows });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/workflows/:id', (req, res) => {
  try {
    const workflow = workflowService.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: '工作流不存在' });
    }
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.post('/workflows', (req, res) => {
  try {
    const workflow = workflowService.createWorkflow(req.body);
    res.status(201).json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.put('/workflows/:id', (req, res) => {
  try {
    const workflow = workflowService.updateWorkflow(req.params.id, req.body);
    if (!workflow) {
      return res.status(404).json({ success: false, message: '工作流不存在' });
    }
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.delete('/workflows/:id', (req, res) => {
  try {
    const deleted = workflowService.deleteWorkflow(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '工作流不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.post('/workflows/:id/execute', async (req, res) => {
  try {
    const { results, executionId } = await workflowService.executeWorkflow(req.params.id, req.body.context || {});
    res.json({ success: true, data: results, executionId, workflowId: req.params.id });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/workflows/:id/executions', (req, res) => {
  try {
    const history = workflowService.getExecutionHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 插件相关路由
router.get('/plugins', (req, res) => {
  try {
    const plugins = pluginService.getAllPlugins();
    res.json({ success: true, data: plugins });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/plugins/:name', (req, res) => {
  try {
    const plugin = pluginService.getPlugin(req.params.name);
    if (!plugin) {
      return res.status(404).json({ success: false, message: '插件不存在' });
    }
    res.json({ success: true, data: plugin });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.post('/plugins', (req, res) => {
  try {
    pluginService.registerPlugin(req.body);
    res.status(201).json({ success: true, message: '插件注册成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.post('/plugins/:name/execute', async (req, res) => {
  try {
    const result = await pluginService.executePlugin(
      req.params.name,
      req.body.config || {},
      req.body.context || {}
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 演示应用管理路由
router.post('/demo-app/start', async (req, res) => {
  try {
    const result = await pluginService.executePlugin(
      '@devops-automation/plugin-deploy',
      {
        action: 'start',
        port: req.body.port || 3010,
        appPath: req.body.appPath,
      },
      {}
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.post('/demo-app/stop', async (req, res) => {
  try {
    const result = await pluginService.executePlugin(
      '@devops-automation/plugin-deploy',
      {
        action: 'stop',
        port: req.body.port || 3010,
        appPath: req.body.appPath,
      },
      {}
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.post('/demo-app/restart', async (req, res) => {
  try {
    const result = await pluginService.executePlugin(
      '@devops-automation/plugin-deploy',
      {
        action: 'restart',
        port: req.body.port || 3010,
        appPath: req.body.appPath,
      },
      {}
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 调度器相关路由
router.get('/scheduler/status', (req, res) => {
  try {
    const status = schedulerService.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 部署日志相关路由
router.get('/deployment-logs', (req, res) => {
  try {
    const workflowId = req.query.workflowId as string | undefined;
    const operationType = (req.query.operationType as 'all' | 'deployment' | 'rollback') || 'all';
    const logs = deploymentLogService.getAllDeploymentLogs(workflowId, operationType);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/deployment-logs/:id', (req, res) => {
  try {
    const log = deploymentLogService.getDeploymentLog(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: '部署日志不存在' });
    }
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/deployment-logs/execution/:executionId', (req, res) => {
  try {
    const log = deploymentLogService.getDeploymentLogByExecutionId(req.params.executionId);
    if (!log) {
      return res.status(404).json({ success: false, message: '部署日志不存在' });
    }
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.post('/deployment-logs/:id/rollback', async (req, res) => {
  try {
    // 默认回滚到上一个版本（用于详情页）
    const result = await deploymentLogService.rollbackDeployment(req.params.id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: result.message, data: { rollbackLogId: result.rollbackLogId } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.post('/deployment-logs/:id/rollback-to', async (req, res) => {
  try {
    // 回滚到指定的部署记录（用于列表中的回滚）
    const result = await deploymentLogService.rollbackToDeployment(req.params.id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: result.message, data: { rollbackLogId: result.rollbackLogId } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;

