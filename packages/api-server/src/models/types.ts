/**
 * 数据模型类型定义
 */
import type { WorkflowDefinition, WorkflowStep } from '@devops-automation/core-engine';

/**
 * 工作流步骤扩展（支持插件权限控制）
 */
export interface ExtendedWorkflowStep extends WorkflowStep {
  /**
   * 插件是否可微调（仅用于应用级别的工作流）
   * - true: 可以在具体工作流中修改插件配置
   * - false: 不可修改插件配置
   * - undefined: 继承自类型工作流的插件，不可修改
   */
  adjustable?: boolean;
  /**
   * 步骤来源
   * - 'type': 来自类型默认工作流，不可删除
   * - 'application': 应用自定义步骤，可以删除
   */
  source?: 'type' | 'application';
  /**
   * 步骤在合并工作流中的位置索引（用于排序）
   */
  position?: number;
}

/**
 * 扩展的工作流定义
 */
export interface ExtendedWorkflowDefinition extends Omit<WorkflowDefinition, 'steps'> {
  steps: ExtendedWorkflowStep[];
  /**
   * 工作流级别
   * - 'type': 类型级别的工作流（默认工作流）
   * - 'application': 应用级别的工作流
   */
  level: 'type' | 'application';
  /**
   * 关联的应用ID（仅应用级别工作流）
   */
  applicationId?: string;
}

/**
 * 应用类型
 */
export interface AppType {
  id: string;
  name: string;
  description?: string;
  /**
   * 默认工作流（类型级别）
   * 此工作流中的插件不可在应用中修改
   */
  defaultWorkflow?: ExtendedWorkflowDefinition;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 应用
 */
export interface Application {
  id: string;
  name: string;
  description?: string;
  /**
   * 所属应用类型ID
   */
  typeId: string;
  /**
   * 应用工作流名称
   */
  workflowName?: string;
  /**
   * Git 服务器类型：github、gitlab、custom
   */
  gitServerType?: 'github' | 'gitlab' | 'custom';
  /**
   * 项目名称
   */
  projectName?: string;
  /**
   * 应用自定义步骤列表（包含插入位置信息）
   */
  customSteps?: CustomStepInsertion[];
  /**
   * 合并后的工作流（包含类型默认步骤和应用自定义步骤）
   * 这个字段是计算得出的，不直接存储
   */
  mergedWorkflow?: ExtendedWorkflowDefinition;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建应用类型请求
 */
export interface CreateAppTypeRequest {
  name: string;
  description?: string;
  defaultWorkflow?: Omit<ExtendedWorkflowDefinition, 'id' | 'level' | 'createdAt' | 'updatedAt'>;
}

/**
 * 更新应用类型请求
 */
export interface UpdateAppTypeRequest {
  name?: string;
  description?: string;
  defaultWorkflow?: Omit<ExtendedWorkflowDefinition, 'id' | 'level' | 'createdAt' | 'updatedAt'>;
}

/**
 * 应用自定义步骤插入信息
 */
export interface CustomStepInsertion {
  step: ExtendedWorkflowStep;
  /**
   * 插入位置：插入到哪个类型步骤之后（步骤ID）
   * 如果为空或未指定，则插入到最后
   */
  insertAfter?: string;
}

/**
 * 创建应用请求
 */
export interface CreateApplicationRequest {
  name: string;
  description?: string;
  typeId: string;
  /**
   * 应用工作流名称
   */
  workflowName?: string;
  /**
   * Git 服务器类型：github、gitlab、custom
   */
  gitServerType: 'github' | 'gitlab' | 'custom';
  /**
   * 项目名称
   */
  projectName: string;
  /**
   * 应用自定义步骤列表（包含插入位置信息）
   */
  customSteps?: CustomStepInsertion[];
}

/**
 * 更新应用请求
 */
export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  /**
   * 应用工作流名称
   */
  workflowName?: string;
  /**
   * Git 服务器类型：github、gitlab、custom
   */
  gitServerType?: 'github' | 'gitlab' | 'custom';
  /**
   * 项目名称
   */
  projectName?: string;
  /**
   * 应用自定义步骤列表（包含插入位置信息）
   */
  customSteps?: CustomStepInsertion[];
}

/**
 * 应用完整工作流（合并类型默认工作流和应用工作流）
 */
export interface ApplicationFullWorkflow {
  /**
   * 类型默认工作流（只读，插件不可修改）
   */
  typeWorkflow: ExtendedWorkflowDefinition | null;
  /**
   * 应用自定义工作流（可配置插件是否可微调）
   */
  applicationWorkflows: ExtendedWorkflowDefinition[];
}
