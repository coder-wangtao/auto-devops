/**
 * 流程执行器
 * @module executor
 */

/**
 * 插件配置类型
 */
export type PluginConfig = Record<string, unknown>;

/**
 * 插件上下文类型
 */
export type PluginContext = Record<string, unknown>;

/**
 * 工作流定义
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

/**
 * 工作流步骤
 */
export interface WorkflowStep {
  id: string;
  name: string;
  plugin: string;
  config?: PluginConfig;
  condition?: string;
  dependsOn?: string[];
}

/**
 * 执行上下文
 */
export interface ExecutionContext extends PluginContext {
  workflowId: string;
  stepId: string;
  previousResults?: Record<string, unknown>;
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  success: boolean;
  stepId: string;
  result?: unknown;
  error?: Error;
}

/**
 * 插件执行器类型
 */
export type PluginExecutor = (
  pluginName: string,
  config: PluginConfig,
  context: PluginContext
) => Promise<unknown>;

/**
 * 执行器选项
 */
export interface ExecutorOptions {
  pluginExecutor?: PluginExecutor;
  onStepStart?: (step: WorkflowStep) => void;
  onStepComplete?: (step: WorkflowStep, result: ExecutionResult) => void;
  onStepError?: (step: WorkflowStep, error: Error) => void;
}

/**
 * 创建流程执行器
 */
export function createWorkflowExecutor(options: ExecutorOptions = {}) {
  const { pluginExecutor, onStepStart, onStepComplete, onStepError } = options;
  //放数据库，记录执行历史
  const executionHistory: Map<string, ExecutionResult[]> = new Map();

  /**
   * 检查步骤依赖是否满足
   */
  function checkDependencies(step: WorkflowStep, previousResults: ExecutionResult[]): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }

    const completedSteps = new Set(previousResults.filter(r => r.success).map(r => r.stepId));

    return step.dependsOn.every(depId => completedSteps.has(depId));
  }

  /**
   * 检查条件是否满足
   */
  function checkCondition(condition: string | undefined, _context: ExecutionContext): boolean {
    if (!condition) return true;
    // 简单的条件检查，实际应该使用表达式解析器
    // 使用 _context 前缀表示参数暂时未使用
    try {
      // 这里简化处理，实际应该解析表达式
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 执行工作流
   */
  async function executeWorkflow(
    workflow: WorkflowDefinition,
    context: ExecutionContext = {} as ExecutionContext
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    const executionContext: ExecutionContext = {
      ...context,
      workflowId: workflow.id,
    };

    for (const step of workflow.steps) {
      // 检查依赖
      if (!checkDependencies(step, results)) {
        results.push({
          success: false,
          stepId: step.id,
          error: new Error(`步骤 ${step.id} 的依赖未满足`),
        });
        continue;
      }

      // 检查条件
      if (!checkCondition(step.condition, executionContext)) {
        results.push({
          success: true,
          stepId: step.id,
          result: { skipped: true, reason: '条件不满足' },
        });
        continue;
      }

      const result = await executeStep(step, {
        ...executionContext,
        stepId: step.id,
        previousResults: results.reduce((acc, r) => ({ ...acc, [r.stepId]: r.result }), {}),
      });

      results.push(result);
    }

    executionHistory.set(workflow.id, results);
    return results;
  }

  /**
   * 执行单个步骤
   */
  async function executeStep(
    step: WorkflowStep,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    onStepStart?.(step);

    try {
      let result: unknown;

      if (pluginExecutor) {
        // 使用提供的插件执行器
        result = await pluginExecutor(step.plugin, step.config || {}, context);
      } else {
        // 模拟执行（简化版本，不延迟）
        result = {
          message: `步骤 ${step.name} 执行成功`,
          plugin: step.plugin,
        };
      }

      const executionResult: ExecutionResult = {
        success: true,
        stepId: step.id,
        result,
      };

      onStepComplete?.(step, executionResult);
      return executionResult;
    } catch (error) {
      const executionResult: ExecutionResult = {
        success: false,
        stepId: step.id,
        error: error as Error,
      };

      onStepError?.(step, error as Error);
      return executionResult;
    }
  }

  /**
   * 获取执行历史
   */
  function getExecutionHistory(workflowId: string): ExecutionResult[] | undefined {
    return executionHistory.get(workflowId);
  }

  /**
   * 清空执行历史
   */
  function clearHistory(): void {
    executionHistory.clear();
  }

  return {
    executeWorkflow,
    executeStep,
    getExecutionHistory,
    clearHistory,
  };
}

/**
 * 默认导出执行器工厂函数
 */
export const createExecutor = createWorkflowExecutor;
