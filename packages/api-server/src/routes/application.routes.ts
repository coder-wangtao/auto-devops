/**
 * 应用路由
 */
import { Router } from 'express';
import { applicationService } from '../services/application.service.js';
import { validateWorkflowStepPermission } from '../middleware/workflow-permission.js';

const router = Router();

// 获取所有应用
router.get('/applications', (req, res) => {
  try {
    const { typeId } = req.query;
    let applications;
    if (typeId && typeof typeId === 'string') {
      applications = applicationService.getApplicationsByType(typeId);
    } else {
      applications = applicationService.getAllApplications();
    }
    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 获取应用详情
router.get('/applications/:id', (req, res) => {
  try {
    const application = applicationService.getApplication(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: '应用不存在' });
    }
    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 创建应用
router.post('/applications', (req, res) => {
  try {
    const application = applicationService.createApplication(req.body);
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 更新应用（包含权限验证）
router.put('/applications/:id', validateWorkflowStepPermission, (req, res) => {
  try {
    const application = applicationService.updateApplication(req.params.id, req.body);
    if (!application) {
      return res.status(404).json({ success: false, message: '应用不存在' });
    }
    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 删除应用
router.delete('/applications/:id', (req, res) => {
  try {
    const deleted = applicationService.deleteApplication(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '应用不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 获取应用的完整工作流（包括类型默认工作流）
router.get('/applications/:id/workflows', (req, res) => {
  try {
    const fullWorkflow = applicationService.getApplicationFullWorkflow(req.params.id);
    if (!fullWorkflow) {
      return res.status(404).json({ success: false, message: '应用不存在' });
    }
    res.json({ success: true, data: fullWorkflow });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 获取应用的所有工作流（合并后的列表）
router.get('/applications/:id/workflows/merged', (req, res) => {
  try {
    const workflows = applicationService.getApplicationWorkflows(req.params.id);
    res.json({ success: true, data: workflows });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 获取应用的合并工作流
router.get('/applications/:id/workflow/merged', (req, res) => {
  try {
    const workflow = applicationService.getMergedWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: '应用不存在' });
    }
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 检查插件是否可以修改
router.get('/applications/:id/workflows/:workflowId/steps/:stepId/can-modify', (req, res) => {
  try {
    const { id, workflowId, stepId } = req.params;
    const result = applicationService.canModifyPlugin(id, workflowId, stepId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;
