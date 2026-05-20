/**
 * 部署日志服务
 */
import type { ExecutionResult } from '@devops-automation/core-engine';

/**
 * 部署日志条目
 */
export interface DeploymentLogEntry {
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
}

/**
 * 部署日志记录
 */
export interface DeploymentLog {
  id: string;
  workflowId: string;
  workflowName: string;
  executionId: string;
  status: 'success' | 'failed' | 'running';
  createdAt: Date;
  completedAt?: Date;
  logs: DeploymentLogEntry[];
  results: ExecutionResult[];
  /**
   * 回滚信息
   */
  rollbackInfo?: {
    canRollback: boolean;
    rollbackWorkflowId?: string;
    previousDeploymentId?: string;
  };
}

// 内存存储（实际应该使用数据库）
const deploymentLogs: Map<string, DeploymentLog> = new Map();

/**
 * 控制台输出捕获器
 */
class ConsoleCapture {
  private logs: DeploymentLogEntry[] = [];
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  constructor() {
    // 保存原始 console 方法
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
  }

  /**
   * 开始捕获
   */
  start(): void {
    const self = this;
    
    console.log = (...args: unknown[]) => {
      self.logs.push({
        timestamp: new Date().toISOString(),
        level: 'log',
        message: args.map((arg) => this.formatMessage(arg)).join(' '),
        data: args.length > 1 ? args.slice(1) : undefined,
      });
      self.originalConsole.log(...args);
    };

    console.info = (...args: unknown[]) => {
      self.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: args.map((arg) => this.formatMessage(arg)).join(' '),
        data: args.length > 1 ? args.slice(1) : undefined,
      });
      self.originalConsole.info(...args);
    };

    console.warn = (...args: unknown[]) => {
      self.logs.push({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: args.map((arg) => this.formatMessage(arg)).join(' '),
        data: args.length > 1 ? args.slice(1) : undefined,
      });
      self.originalConsole.warn(...args);
    };

    console.error = (...args: unknown[]) => {
      self.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: args.map((arg) => this.formatMessage(arg)).join(' '),
        data: args.length > 1 ? args.slice(1) : undefined,
      });
      self.originalConsole.error(...args);
    };

    console.debug = (...args: unknown[]) => {
      self.logs.push({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message: args.map((arg) => this.formatMessage(arg)).join(' '),
        data: args.length > 1 ? args.slice(1) : undefined,
      });
      self.originalConsole.debug(...args);
    };
  }

  /**
   * 停止捕获并恢复原始 console
   */
  stop(): void {
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;
  }

  /**
   * 获取捕获的日志
   */
  getLogs(): DeploymentLogEntry[] {
    return [...this.logs];
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 格式化消息
   */
  private formatMessage(arg: unknown): string {
    if (arg === null || arg === undefined) {
      return String(arg);
    }
    if (typeof arg === 'string') {
      return arg;
    }
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }
}

export const deploymentLogService = {
  /**
   * 创建部署日志
   */
  createDeploymentLog(
    workflowId: string,
    workflowName: string,
    executionId: string,
    logs: DeploymentLogEntry[],
    results: ExecutionResult[]
  ): DeploymentLog {
    const id = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const allSuccess = results.every((r) => r.success);
    const hasError = results.some((r) => !r.success);

    const log: DeploymentLog = {
      id,
      workflowId,
      workflowName,
      executionId,
      status: hasError ? 'failed' : allSuccess ? 'success' : 'running',
      createdAt: new Date(),
      completedAt: new Date(),
      logs,
      results,
      rollbackInfo: {
        canRollback: allSuccess, // 只有成功的部署才能回滚
      },
    };

    deploymentLogs.set(id, log);
    return log;
  },

  /**
   * 获取部署日志
   */
  getDeploymentLog(id: string): DeploymentLog | undefined {
    return deploymentLogs.get(id);
  },

  /**
   * 获取所有部署日志
   * @param workflowId 工作流ID（可选）
   * @param operationType 操作类型：'all' | 'deployment' | 'rollback'（可选）
   */
  getAllDeploymentLogs(workflowId?: string, operationType: 'all' | 'deployment' | 'rollback' = 'all'): DeploymentLog[] {
    let allLogs = Array.from(deploymentLogs.values());
    
    // 按工作流筛选
    if (workflowId) {
      allLogs = allLogs.filter((log) => log.workflowId === workflowId);
    }
    
    // 按操作类型筛选
    if (operationType !== 'all') {
      if (operationType === 'rollback') {
        // 筛选回滚记录（executionId 以 rollback_ 开头）
        allLogs = allLogs.filter((log) => log.executionId?.startsWith('rollback_'));
      } else if (operationType === 'deployment') {
        // 筛选部署记录（非回滚记录）
        allLogs = allLogs.filter((log) => !log.executionId?.startsWith('rollback_'));
      }
    }
    
    return allLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * 根据执行ID获取部署日志
   */
  getDeploymentLogByExecutionId(executionId: string): DeploymentLog | undefined {
    return Array.from(deploymentLogs.values()).find((log) => log.executionId === executionId);
  },

  /**
   * 创建控制台捕获器
   */
  createConsoleCapture(): ConsoleCapture {
    return new ConsoleCapture();
  },

  /**
   * 执行回滚到上一个版本
   * 回滚到当前部署的上一个成功的部署（用于详情页）
   */
  async rollbackDeployment(deploymentId: string): Promise<{ success: boolean; message: string; rollbackLogId?: string }> {
    const deployment = deploymentLogs.get(deploymentId);
    if (!deployment) {
      return { success: false, message: '部署记录不存在' };
    }

    if (!deployment.rollbackInfo?.canRollback) {
      return { success: false, message: '该部署无法回滚（可能部署失败或没有可回滚的版本）' };
    }

    // 查找上一个成功的部署
    const allLogs = this.getAllDeploymentLogs(deployment.workflowId);
    const previousDeployment = allLogs.find(
      (log) => log.id !== deploymentId && log.status === 'success' && log.createdAt < deployment.createdAt
    );

    if (!previousDeployment) {
      return { success: false, message: '没有找到可回滚的版本' };
    }

    // 创建回滚日志记录
    const rollbackLog: DeploymentLog = {
      id: `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId: deployment.workflowId,
      workflowName: `${deployment.workflowName} (回滚到上一个版本)`,
      executionId: `rollback_${deployment.executionId}`,
      status: 'success',
      createdAt: new Date(),
      completedAt: new Date(),
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `回滚部署: ${deployment.id} 到上一个版本: ${previousDeployment.id}`,
        },
      ],
      results: previousDeployment.results,
      rollbackInfo: {
        canRollback: false,
        previousDeploymentId: previousDeployment.id,
      },
    };

    deploymentLogs.set(rollbackLog.id, rollbackLog);

    // 更新原部署的回滚信息
    deployment.rollbackInfo = {
      ...deployment.rollbackInfo,
      rollbackWorkflowId: rollbackLog.id,
    };
    deploymentLogs.set(deploymentId, deployment);

    return {
      success: true,
      message: '回滚成功',
      rollbackLogId: rollbackLog.id,
    };
  },

  /**
   * 回滚到指定的部署记录
   * 回滚到指定部署记录对应的版本（用于列表中的回滚）
   */
  async rollbackToDeployment(targetDeploymentId: string): Promise<{ success: boolean; message: string; rollbackLogId?: string }> {
    const targetDeployment = deploymentLogs.get(targetDeploymentId);
    if (!targetDeployment) {
      return { success: false, message: '目标部署记录不存在' };
    }

    // 只有成功的部署才能作为回滚目标
    if (targetDeployment.status !== 'success') {
      return { success: false, message: '只能回滚到成功的部署版本' };
    }

    // 创建回滚日志记录，恢复到目标部署的状态
    const rollbackLog: DeploymentLog = {
      id: `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId: targetDeployment.workflowId,
      workflowName: `${targetDeployment.workflowName} (回滚到此版本)`,
      executionId: `rollback_${targetDeployment.executionId}`,
      status: 'success',
      createdAt: new Date(),
      completedAt: new Date(),
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `回滚到部署版本: ${targetDeployment.id}`,
        },
        ...targetDeployment.logs,
      ],
      results: targetDeployment.results,
      rollbackInfo: {
        canRollback: false,
        previousDeploymentId: targetDeployment.id,
      },
    };

    deploymentLogs.set(rollbackLog.id, rollbackLog);

    return {
      success: true,
      message: '回滚成功',
      rollbackLogId: rollbackLog.id,
    };
  },
};
