/**
 * 应用服务
 */
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ExtendedWorkflowDefinition,
  ExtendedWorkflowStep,
  ApplicationFullWorkflow,
  CustomStepInsertion,
} from '../models/types.js';
import { appTypeService } from './app-type.service.js';

// 内存存储（实际应该使用数据库）
const applications: Map<string, Application> = new Map();

/**
 * 合并类型默认工作流和应用自定义步骤
 */
function mergeWorkflowSteps(
  typeSteps: ExtendedWorkflowStep[],
  customSteps: CustomStepInsertion[] = []
): ExtendedWorkflowStep[] {
  const result: ExtendedWorkflowStep[] = [];
  
  // 标记类型步骤的来源
  const typeStepsWithSource = typeSteps.map((step) => ({
    ...step,
    source: 'type' as const,
    adjustable: undefined, // 类型步骤不可调整
  }));

  // 如果没有自定义步骤，直接返回类型步骤
  if (customSteps.length === 0) {
    return typeStepsWithSource;
  }

  // 构建步骤映射，方便查找插入位置
  const stepMap = new Map<string, number>();
  typeStepsWithSource.forEach((step, index) => {
    stepMap.set(step.id, index);
  });

  // 按插入位置分组自定义步骤
  const insertionsByPosition = new Map<string | 'end', CustomStepInsertion[]>();
  customSteps.forEach((custom) => {
    const position = custom.insertAfter || 'end';
    if (!insertionsByPosition.has(position)) {
      insertionsByPosition.set(position, []);
    }
    insertionsByPosition.get(position)!.push(custom);
  });

  // 合并步骤
  let position = 0;
  for (let i = 0; i < typeStepsWithSource.length; i++) {
    const typeStep = typeStepsWithSource[i];
    result.push(typeStep);
    position++;

    // 检查是否有需要在此步骤后插入的自定义步骤
    const insertions = insertionsByPosition.get(typeStep.id) || [];
    insertions.forEach((insertion) => {
      const customStep: ExtendedWorkflowStep = {
        ...insertion.step,
        source: 'application',
        adjustable: insertion.step.adjustable ?? true,
        position: position++,
      };
      result.push(customStep);
    });
  }

  // 处理插入到最后的步骤
  const endInsertions = insertionsByPosition.get('end') || [];
  endInsertions.forEach((insertion) => {
    const customStep: ExtendedWorkflowStep = {
      ...insertion.step,
      source: 'application',
      adjustable: insertion.step.adjustable ?? true,
      position: position++,
    };
    result.push(customStep);
  });

  return result;
}

/**
 * 生成应用的合并工作流
 */
function generateMergedWorkflow(application: Application): ExtendedWorkflowDefinition {
  const appType = appTypeService.getAppType(application.typeId);
  const typeSteps = appType?.defaultWorkflow?.steps || [];
  const customSteps = application.customSteps || [];

  const mergedSteps = mergeWorkflowSteps(typeSteps, customSteps);

  return {
    id: `wf_app_merged_${application.id}`,
    name: application.workflowName || `${application.name}工作流`,
    level: 'application',
    applicationId: application.id,
    steps: mergedSteps,
  };
}

export const applicationService = {
  /**
   * 创建应用
   */
  createApplication(data: CreateApplicationRequest): Application {
    // 验证必填字段
    if (!data.gitServerType) {
      throw new Error('Git 服务器类型是必填的');
    }
    if (!data.projectName) {
      throw new Error('项目名称是必填的');
    }
    
    // 验证应用类型是否存在
    const appType = appTypeService.getAppType(data.typeId);
    if (!appType) {
      throw new Error(`应用类型 ${data.typeId} 不存在`);
    }

    const id = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const application: Application = {
      id,
      name: data.name,
      description: data.description,
      typeId: data.typeId,
      workflowName: data.workflowName || `${data.name}工作流`,
      gitServerType: data.gitServerType,
      projectName: data.projectName,
      customSteps: data.customSteps || [],
      createdAt: now,
      updatedAt: now,
    };

    // 生成合并工作流
    application.mergedWorkflow = generateMergedWorkflow(application);

    applications.set(id, application);
    return application;
  },

  /**
   * 获取应用
   */
  getApplication(id: string): Application | undefined {
    const application = applications.get(id);
    if (application) {
      // 确保合并工作流是最新的
      application.mergedWorkflow = generateMergedWorkflow(application);
    }
    return application;
  },

  /**
   * 获取所有应用
   */
  getAllApplications(): Application[] {
    return Array.from(applications.values()).map((app) => {
      app.mergedWorkflow = generateMergedWorkflow(app);
      return app;
    });
  },

  /**
   * 根据类型ID获取应用列表
   */
  getApplicationsByType(typeId: string): Application[] {
    return Array.from(applications.values())
      .filter((app) => app.typeId === typeId)
      .map((app) => {
        app.mergedWorkflow = generateMergedWorkflow(app);
        return app;
      });
  },

  /**
   * 更新应用
   */
  updateApplication(id: string, data: UpdateApplicationRequest): Application | null {
    const existing = applications.get(id);
    if (!existing) return null;

    // 验证必填字段（如果提供了的话）
    if (data.gitServerType !== undefined && !data.gitServerType) {
      throw new Error('Git 服务器类型不能为空');
    }
    if (data.projectName !== undefined && !data.projectName) {
      throw new Error('项目名称不能为空');
    }

    const updated: Application = {
      ...existing,
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.workflowName !== undefined && { workflowName: data.workflowName }),
      ...(data.gitServerType !== undefined && { gitServerType: data.gitServerType }),
      ...(data.projectName !== undefined && { projectName: data.projectName }),
      ...(data.customSteps !== undefined && { customSteps: data.customSteps }),
      updatedAt: new Date(),
    };

    // 确保必填字段存在（兼容旧数据）
    if (!updated.gitServerType) {
      throw new Error('Git 服务器类型是必填的，请提供该字段');
    }
    if (!updated.projectName) {
      throw new Error('项目名称是必填的，请提供该字段');
    }

    // 重新生成合并工作流
    updated.mergedWorkflow = generateMergedWorkflow(updated);

    applications.set(id, updated);
    return updated;
  },

  /**
   * 删除应用
   */
  deleteApplication(id: string): boolean {
    return applications.delete(id);
  },

  /**
   * 获取应用的完整工作流（合并类型默认工作流和应用工作流）
   */
  getApplicationFullWorkflow(applicationId: string): ApplicationFullWorkflow | null {
    const application = applications.get(applicationId);
    if (!application) return null;

    const appType = appTypeService.getAppType(application.typeId);
    if (!appType) return null;

    return {
      typeWorkflow: appType.defaultWorkflow || null,
      applicationWorkflows: application.mergedWorkflow ? [application.mergedWorkflow] : [],
    };
  },

  /**
   * 获取应用的合并工作流
   */
  getMergedWorkflow(applicationId: string): ExtendedWorkflowDefinition | null {
    const application = applications.get(applicationId);
    if (!application) return null;

    return generateMergedWorkflow(application);
  },

  /**
   * 验证工作流中的插件是否可以修改
   * @param applicationId 应用ID
   * @param workflowId 工作流ID
   * @param stepId 步骤ID
   * @returns true 如果可以修改，false 如果不可修改
   */
  canModifyPlugin(
    applicationId: string,
    workflowId: string,
    stepId: string
  ): { canModify: boolean; reason?: string } {
    const application = applications.get(applicationId);
    if (!application) {
      return { canModify: false, reason: '应用不存在' };
    }

    const mergedWorkflow = generateMergedWorkflow(application);
    
    // 检查工作流ID是否匹配
    if (mergedWorkflow.id !== workflowId) {
      return { canModify: false, reason: '工作流不存在' };
    }

    const step = mergedWorkflow.steps.find((s) => s.id === stepId);
    if (!step) {
      return { canModify: false, reason: '步骤不存在' };
    }

    // 类型步骤不可修改
    if (step.source === 'type') {
      return { canModify: false, reason: '类型默认工作流中的插件不可修改' };
    }

    // 应用步骤如果 adjustable 为 false，则不可修改
    if (step.adjustable === false) {
      return { canModify: false, reason: '该插件被设置为不可微调' };
    }

    return { canModify: true };
  },

  /**
   * 获取应用的工作流（包括类型默认工作流）
   */
  getApplicationWorkflows(applicationId: string): ExtendedWorkflowDefinition[] {
    const application = applications.get(applicationId);
    if (!application) return [];

    const mergedWorkflow = generateMergedWorkflow(application);
    return [mergedWorkflow];
  },

  /**
   * 获取所有应用的工作流（用于工作流管理页面）
   */
  getAllApplicationWorkflows(): ExtendedWorkflowDefinition[] {
    return Array.from(applications.values())
      .map((app) => generateMergedWorkflow(app))
      .filter((wf) => wf !== null) as ExtendedWorkflowDefinition[];
  },
};
