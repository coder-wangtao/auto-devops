/**
 * 工作流权限验证中间件
 */
import type { Request, Response, NextFunction } from 'express';
import { applicationService } from '../services/application.service.js';
import type { ExtendedWorkflowStep } from '../models/types.js';

/**
 * 验证工作流步骤的插件是否可以修改
 */
export function validateWorkflowStepPermission(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { id: applicationId } = req.params;
    const { workflows } = req.body;

    if (!applicationId) {
      return next();
    }

    if (!workflows || !Array.isArray(workflows)) {
      return next();
    }

    // 检查每个工作流中的每个步骤的插件是否可以修改
    for (const workflow of workflows) {
      if (!workflow.id || !workflow.steps || !Array.isArray(workflow.steps)) {
        continue;
      }

      for (const step of workflow.steps as ExtendedWorkflowStep[]) {
        if (!step.id) continue;

        const { canModify, reason } = applicationService.canModifyPlugin(
          applicationId,
          workflow.id,
          step.id
        );

        if (!canModify) {
          res.status(403).json({
            success: false,
            message: `工作流 ${workflow.id} 中步骤 ${step.id} 的插件不可修改: ${reason}`,
          });
          return;
        }
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
}

/**
 * 验证单个步骤的插件是否可以修改
 */
export function validateStepPermission(req: Request, res: Response, next: NextFunction): void {
  try {
    const { applicationId, workflowId, stepId } = req.params;

    if (!applicationId || !workflowId || !stepId) {
      return next();
    }

    const { canModify, reason } = applicationService.canModifyPlugin(
      applicationId,
      workflowId,
      stepId
    );

    if (!canModify) {
      res.status(403).json({
        success: false,
        message: `插件不可修改: ${reason}`,
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
}
