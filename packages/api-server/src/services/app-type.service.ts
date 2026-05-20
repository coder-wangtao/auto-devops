/**
 * 应用类型服务
 */
import type {
  AppType,
  CreateAppTypeRequest,
  UpdateAppTypeRequest,
  ExtendedWorkflowDefinition,
} from '../models/types.js';

// 内存存储（实际应该使用数据库）
const appTypes: Map<string, AppType> = new Map();

export const appTypeService = {
  /**
   * 创建应用类型
   */
  createAppType(data: CreateAppTypeRequest): AppType {
    const id = `type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    let defaultWorkflow: ExtendedWorkflowDefinition | undefined;
    if (data.defaultWorkflow) {
      defaultWorkflow = {
        ...data.defaultWorkflow,
        id: `wf_type_${id}`,
        level: 'type',
        steps: data.defaultWorkflow.steps.map((step) => ({
          ...step,
          // 类型级别的工作流插件不可调整
          adjustable: undefined,
        })),
      };
    }

    const appType: AppType = {
      id,
      name: data.name,
      description: data.description,
      defaultWorkflow,
      createdAt: now,
      updatedAt: now,
    };

    appTypes.set(id, appType);
    return appType;
  },

  /**
   * 获取应用类型
   */
  getAppType(id: string): AppType | undefined {
    return appTypes.get(id);
  },

  /**
   * 获取所有应用类型
   */
  getAllAppTypes(): AppType[] {
    return Array.from(appTypes.values());
  },

  /**
   * 更新应用类型
   */
  updateAppType(id: string, data: UpdateAppTypeRequest): AppType | null {
    const existing = appTypes.get(id);
    if (!existing) return null;

    let defaultWorkflow = existing.defaultWorkflow;
    if (data.defaultWorkflow) {
      defaultWorkflow = {
        ...data.defaultWorkflow,
        id: existing.defaultWorkflow?.id || `wf_type_${id}`,
        level: 'type',
        steps: data.defaultWorkflow.steps.map((step) => ({
          ...step,
          // 类型级别的工作流插件不可调整
          adjustable: undefined,
        })),
      };
    }

    const updated: AppType = {
      ...existing,
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(defaultWorkflow && { defaultWorkflow }),
      updatedAt: new Date(),
    };

    appTypes.set(id, updated);
    return updated;
  },

  /**
   * 删除应用类型
   */
  deleteAppType(id: string): boolean {
    return appTypes.delete(id);
  },

  /**
   * 检查应用类型是否存在
   */
  exists(id: string): boolean {
    return appTypes.has(id);
  },
};
