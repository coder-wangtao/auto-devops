/**
 * 应用类型路由
 */
import { Router } from 'express';
import { appTypeService } from '../services/app-type.service.js';

const router = Router();

// 获取所有应用类型
router.get('/app-types', (req, res) => {
  try {
    const appTypes = appTypeService.getAllAppTypes();
    res.json({ success: true, data: appTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 获取应用类型详情
router.get('/app-types/:id', (req, res) => {
  try {
    const appType = appTypeService.getAppType(req.params.id);
    if (!appType) {
      return res.status(404).json({ success: false, message: '应用类型不存在' });
    }
    res.json({ success: true, data: appType });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 创建应用类型
router.post('/app-types', (req, res) => {
  try {
    const appType = appTypeService.createAppType(req.body);
    res.status(201).json({ success: true, data: appType });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 更新应用类型
router.put('/app-types/:id', (req, res) => {
  try {
    const appType = appTypeService.updateAppType(req.params.id, req.body);
    if (!appType) {
      return res.status(404).json({ success: false, message: '应用类型不存在' });
    }
    res.json({ success: true, data: appType });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 删除应用类型
router.delete('/app-types/:id', (req, res) => {
  try {
    const deleted = appTypeService.deleteAppType(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '应用类型不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;
