/**
 * 任务调度器
 * @module scheduler
 */

/**
 * 任务定义
 */
export interface Task {
  id: string;
  name: string;
  priority: number;
  execute: () => Promise<unknown>;
  createdAt: Date;
}

/**
 * 调度选项
 */
export interface SchedulerOptions {
  maxConcurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * 调度结果
 */
export interface ScheduleResult {
  taskId: string;
  success: boolean;
  result?: unknown;
  error?: Error;
}

/**
 * 创建任务调度器
 */
export function createTaskScheduler(options: SchedulerOptions = {}) {
  const { maxConcurrency = 5, retryAttempts = 3, retryDelay = 1000 } = options;

  const taskQueue: Task[] = [];
  let runningTasks = 0;

  /**
   * 添加任务到队列
   */
  function scheduleTask(task: Task): void {
    taskQueue.push(task);
    taskQueue.sort((a, b) => b.priority - a.priority);
    processQueue();
  }

  /**
   * 处理任务队列
   */
  async function processQueue(): Promise<void> {
    if (runningTasks >= maxConcurrency || taskQueue.length === 0) {
      return;
    }

    const task = taskQueue.shift();
    if (!task) return;

    runningTasks++;
    try {
      await executeWithRetry(task, retryAttempts, retryDelay);
    } finally {
      runningTasks--;
      processQueue();
    }
  }

  /**
   * 带重试的执行
   */
  async function executeWithRetry(
    task: Task,
    attempts: number,
    delay: number
  ): Promise<ScheduleResult> {
    for (let i = 0; i < attempts; i++) {
      try {
        const result = await task.execute();
        return {
          taskId: task.id,
          success: true,
          result,
        };
      } catch (error) {
        if (i === attempts - 1) {
          return {
            taskId: task.id,
            success: false,
            error: error as Error,
          };
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return {
      taskId: task.id,
      success: false,
      error: new Error('Max retry attempts reached'),
    };
  }

  /**
   * 获取队列状态
   */
  function getQueueStatus() {
    return {
      queueLength: taskQueue.length,
      runningTasks,
      maxConcurrency,
    };
  }

  return {
    scheduleTask,
    getQueueStatus,
  };
}

/**
 * 默认导出调度器工厂函数
 */
export const createScheduler = createTaskScheduler;
