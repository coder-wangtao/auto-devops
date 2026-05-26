/**
 * 工作流服务
 */
import {
  createWorkflowExecutor,
  createPluginManager,
  createTaskScheduler,
  type WorkflowDefinition,
  type ExecutionResult,
} from '@devops-automation/core-engine';
import type { PluginDefinition } from '@devops-automation/plugin-sdk';
import { applicationService } from './application.service.js';
import { deploymentLogService } from './deployment-log.service.js';

// 全局实例
const pluginManager = createPluginManager();
const executor = createWorkflowExecutor({
  pluginExecutor: async (pluginName, config, context) => {
    // 确保环境变量被传递到插件上下文
    const enrichedContext = {
      ...context,
      NODE_ENV: context.NODE_ENV || process.env.NODE_ENV,
      environment: context.environment || process.env.NODE_ENV || process.env.ENVIRONMENT,
    };
    // @ts-expect-error - PluginConfig types differ between core-engine and plugin-sdk, but are compatible at runtime
    return await pluginManager.executePlugin(pluginName, config, enrichedContext);
  },
});
const scheduler = createTaskScheduler({ maxConcurrency: 5 });

// 内存存储（实际应该使用数据库）
const workflows: Map<string, WorkflowDefinition> = new Map();
const executions: Map<string, { workflowId: string; results: ExecutionResult[]; createdAt: Date }> =
  new Map();

export const workflowService = {
  /**
   * 创建工作流
   */
  createWorkflow(workflow: WorkflowDefinition): WorkflowDefinition {
    workflows.set(workflow.id, workflow);
    return workflow;
  },

  /**
   * 获取工作流
   */
  getWorkflow(id: string): WorkflowDefinition | undefined {
    return workflows.get(id);
  },

  /**
   * 获取所有工作流（包括应用工作流）
   */
  getAllWorkflows(): WorkflowDefinition[] {
    const standaloneWorkflows = Array.from(workflows.values());
    const applicationWorkflows = applicationService.getAllApplicationWorkflows();
    return [...standaloneWorkflows, ...applicationWorkflows];
  },

  /**
   * 更新工作流
   */
  updateWorkflow(id: string, workflow: Partial<WorkflowDefinition>): WorkflowDefinition | null {
    const existing = workflows.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...workflow };
    workflows.set(id, updated);
    return updated;
  },

  /**
   * 删除工作流
   */
  deleteWorkflow(id: string): boolean {
    return workflows.delete(id);
  },

  /**
   * 执行工作流
   * @returns 执行结果和 executionId
   */
  async executeWorkflow(
    id: string,
    context: Record<string, unknown> = {}
  ): Promise<{ results: ExecutionResult[]; executionId: string }> {
    const workflow = workflows.get(id);
    if (!workflow) {
      throw new Error(`工作流 ${id} 不存在`);
    }

    // 创建控制台捕获器
    const consoleCapture = deploymentLogService.createConsoleCapture();
    consoleCapture.start();

    try {
      // 自动将环境变量添加到上下文
      const enrichedContext = {
        ...context,
        NODE_ENV: context.NODE_ENV || process.env.NODE_ENV,
        environment: context.environment || process.env.NODE_ENV || process.env.ENVIRONMENT,
      };

      const results = await executor.executeWorkflow(workflow, enrichedContext as any);

      // 将 Error 对象转换为可序列化的格式
      const serializableResults = results.map(result => ({
        ...result,
        error: result.error
          ? {
              message: result.error.message || String(result.error),
              name: result.error.name || 'Error',
              stack: result.error.stack,
            }
          : undefined,
      }));

      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      executions.set(executionId, {
        workflowId: id,
        results: serializableResults,
        createdAt: new Date(),
      });

      // 捕获控制台输出并创建部署日志
      const logs = consoleCapture.getLogs();
      deploymentLogService.createDeploymentLog(
        id,
        workflow.name || id,
        executionId,
        logs,
        serializableResults
      );

      return { results: serializableResults, executionId };
    } finally {
      // 停止捕获并恢复原始 console
      consoleCapture.stop();
    }
  },

  /**
   * 获取执行历史
   */
  getExecutionHistory(workflowId?: string) {
    const allExecutions = Array.from(executions.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));

    if (workflowId) {
      return allExecutions.filter(e => e.workflowId === workflowId);
    }

    return allExecutions;
  },

  /**
   * 获取执行详情
   */
  getExecution(id: string) {
    return executions.get(id);
  },
};

export const pluginService = {
  /**
   * 注册插件
   */
  registerPlugin(plugin: PluginDefinition): void {
    pluginManager.registerPlugin(plugin);
  },

  /**
   * 获取所有插件
   */
  getAllPlugins() {
    return pluginManager.getAllPlugins();
  },

  /**
   * 获取插件
   */
  getPlugin(name: string) {
    return pluginManager.getPlugin(name);
  },

  /**
   * 执行插件
   */
  async executePlugin(
    name: string,
    config: Record<string, unknown>,
    context: Record<string, unknown> = {}
  ) {
    // 确保环境变量被传递到插件上下文
    const enrichedContext = {
      ...context,
      NODE_ENV: context.NODE_ENV || process.env.NODE_ENV,
      environment: context.environment || process.env.NODE_ENV || process.env.ENVIRONMENT,
    };
    // @ts-expect-error - PluginConfig types differ between core-engine and plugin-sdk, but are compatible at runtime
    return await pluginManager.executePlugin(name, config, enrichedContext);
  },
};

export const schedulerService = {
  /**
   * 获取调度器状态
   */
  getStatus() {
    return scheduler.getQueueStatus();
  },
};
