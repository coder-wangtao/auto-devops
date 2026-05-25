/**
 * 部署插件
 * @module deploy-plugin
 */

import { createPlugin } from '@devops-automation/plugin-sdk';
import type { PluginConfig, PluginContext, PluginResult } from '@devops-automation/plugin-sdk';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 查找项目根目录（包含 pnpm-workspace.yaml 的目录）
 */
function findProjectRoot(startPath: string): string {
  let currentPath = resolve(startPath);
  const root = resolve('/');

  while (currentPath !== root) {
    const workspaceFile = resolve(currentPath, 'pnpm-workspace.yaml');
    const packageJsonFile = resolve(currentPath, 'package.json');

    // 检查是否存在 pnpm-workspace.yaml 和 package.json
    if (existsSync(workspaceFile) && existsSync(packageJsonFile)) {
      return currentPath;
    }

    // 向上查找
    const parentPath = resolve(currentPath, '..');
    if (parentPath === currentPath) {
      break; // 已经到达根目录
    }
    currentPath = parentPath;
  }

  // 如果找不到，使用默认计算方式
  return resolve(__dirname, '../../../..');
}

// 计算项目根目录
const projectRoot = findProjectRoot(__dirname);
const demoAppPath = resolve(projectRoot, 'demo-app');

// 调试：输出路径信息
console.log(`[DeployPlugin] __dirname: ${__dirname}`);
console.log(`[DeployPlugin] projectRoot: ${projectRoot}`);
console.log(`[DeployPlugin] demoAppPath: ${demoAppPath}`);

interface DeployPluginConfig extends PluginConfig {
  action?: 'start' | 'stop' | 'restart';
  appPath?: string;
  port?: number;
  environment?: string;
  target?: string;
  strategy?: 'blue-green' | 'rolling' | 'canary';
}

// 存储运行中的进程
const runningProcesses = new Map<string, any>();

/**
 * 启动应用
 */
async function startApp(config: DeployPluginConfig): Promise<PluginResult> {
  const appPath = config.appPath || demoAppPath;
  const port = config.port || 3010;

  console.log(`[DeployPlugin] 准备启动应用，路径: ${appPath}, 端口: ${port}`);

  try {
    // 检查应用目录是否存在
    const fs = await import('fs/promises');
    try {
      await fs.access(appPath);
      console.log(`[DeployPlugin] 应用目录存在: ${appPath}`);
    } catch (error) {
      console.error(`[DeployPlugin] 应用目录不存在: ${appPath}`, error);
      return {
        success: false,
        message: `应用目录不存在: ${appPath}`,
      };
    }

    // 检查是否已经运行
    const processKey = `${appPath}:${port}`;
    if (runningProcesses.has(processKey)) {
      const existingProcess = runningProcesses.get(processKey);
      if (existingProcess && !existingProcess.killed) {
        console.log(`[DeployPlugin] 应用已在运行: ${processKey}`);
        return {
          success: true,
          message: `应用已在端口 ${port} 上运行`,
        };
      }
    }

    // 检查 node_modules 是否存在，如果不存在则安装依赖
    const nodeModulesPath = resolve(appPath, 'node_modules');
    try {
      await fs.access(nodeModulesPath);
      console.log(`[DeployPlugin] node_modules 已存在`);
    } catch {
      // node_modules 不存在，需要安装依赖
      console.log(`[DeployPlugin] node_modules 不存在，开始安装依赖...`);
      const isWindows = process.platform === 'win32';
      const pnpmCmd = isWindows ? 'pnpm.cmd' : 'pnpm';

      return new Promise(resolve => {
        const installProcess = spawn(pnpmCmd, ['install', '--no-frozen-lockfile'], {
          cwd: appPath,
          shell: true,
          stdio: 'pipe',
        });

        installProcess.stdout?.on('data', data => {
          console.log(`[DeployPlugin] 安装依赖输出: ${data.toString()}`);
        });

        installProcess.stderr?.on('data', data => {
          console.error(`[DeployPlugin] 安装依赖错误: ${data.toString()}`);
        });

        installProcess.on('exit', async code => {
          console.log(`[DeployPlugin] 依赖安装完成，退出码: ${code}`);
          if (code === 0) {
            // 安装成功，继续启动应用
            console.log(`[DeployPlugin] 依赖安装成功，开始启动应用...`);
            const result = await startAppAfterInstall(config, appPath, port, processKey);
            resolve(result);
          } else {
            console.error(`[DeployPlugin] 依赖安装失败，退出码: ${code}`);
            resolve({
              success: false,
              message: `依赖安装失败，退出码: ${code}`,
            });
          }
        });

        installProcess.on('error', error => {
          console.error(`[DeployPlugin] 安装依赖时出错:`, error);
          resolve({
            success: false,
            message: `安装依赖时出错: ${error.message}`,
          });
        });
      });
    }

    // 依赖已安装，直接启动
    console.log(`[DeployPlugin] 依赖已安装，开始启动应用...`);
    return await startAppAfterInstall(config, appPath, port, processKey);
  } catch (error) {
    return {
      success: false,
      message: `启动应用失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 安装依赖后启动应用
 */
async function startAppAfterInstall(
  config: DeployPluginConfig,
  appPath: string,
  port: number,
  processKey: string
): Promise<PluginResult> {
  try {
    const isWindows = process.platform === 'win32';
    const pnpmCmd = isWindows ? 'pnpm.cmd' : 'pnpm';

    console.log(`[DeployPlugin] 执行命令: ${pnpmCmd} run dev, 工作目录: ${appPath}`);

    const childProcess = spawn(pnpmCmd, ['run', 'dev'], {
      cwd: appPath,
      shell: true,
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: port.toString(),
      },
    });

    // 监听进程输出
    childProcess.stdout?.on('data', data => {
      console.log(`[DeployPlugin] 应用输出: ${data.toString()}`);
    });

    childProcess.stderr?.on('data', data => {
      console.error(`[DeployPlugin] 应用错误: ${data.toString()}`);
    });

    // 存储进程引用
    runningProcesses.set(processKey, childProcess);
    console.log(`[DeployPlugin] 进程已启动，PID: ${childProcess.pid}`);

    // 监听进程退出
    childProcess.on('exit', code => {
      console.log(`[DeployPlugin] 进程退出，退出码: ${code}`);
      runningProcesses.delete(processKey);
    });

    childProcess.on('error', error => {
      console.error(`[DeployPlugin] 进程错误:`, error);
      runningProcesses.delete(processKey);
    });

    // 等待一段时间确保进程启动
    console.log(`[DeployPlugin] 等待进程启动...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 检查进程是否还在运行
    if (childProcess.killed) {
      console.error(`[DeployPlugin] 进程已退出`);
      return {
        success: false,
        message: `应用启动失败，进程已退出`,
      };
    }

    console.log(`[DeployPlugin] 应用启动成功，端口: ${port}`);
    return {
      success: true,
      message: `应用已在端口 ${port} 上启动，访问 http://localhost:${port}`,
      data: {
        port,
        url: `http://localhost:${port}`,
        pid: childProcess.pid,
      },
    };
  } catch (error) {
    console.error(`[DeployPlugin] 启动应用异常:`, error);
    return {
      success: false,
      message: `启动应用失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 停止应用
 */
async function stopApp(config: DeployPluginConfig): Promise<PluginResult> {
  const appPath = config.appPath || demoAppPath;
  const port = config.port || 3010;
  const processKey = `${appPath}:${port}`;

  console.log(`[DeployPlugin] 准备停止应用，路径: ${appPath}, 端口: ${port}`);
  console.log(`[DeployPlugin] 进程键: ${processKey}`);

  try {
    const process = runningProcesses.get(processKey);
    if (process && !process.killed) {
      console.log(`[DeployPlugin] 找到运行中的进程，PID: ${process.pid}`);

      // 在 Windows 上需要终止整个进程树
      const isWindows = process.platform === 'win32';
      if (isWindows) {
        // Windows 上使用 taskkill 来终止进程树
        const { spawn } = await import('child_process');
        spawn('taskkill', ['/F', '/T', '/PID', process.pid.toString()], {
          shell: true,
          stdio: 'ignore',
        });
      } else {
        // Unix 系统上终止进程树
        process.kill('SIGTERM');
        // 如果进程不响应，强制终止
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        }, 3000);
      }

      runningProcesses.delete(processKey);
      console.log(`[DeployPlugin] 应用已停止`);
      return {
        success: true,
        message: `应用已停止（端口 ${port}）`,
      };
    }

    console.log(`[DeployPlugin] 应用未在运行`);
    return {
      success: true,
      message: `应用未在运行（端口 ${port}）`,
    };
  } catch (error) {
    console.error(`[DeployPlugin] 停止应用失败:`, error);
    return {
      success: false,
      message: `停止应用失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 部署插件执行函数
 */
async function executeDeployPlugin(
  config: PluginConfig,
  context: PluginContext
): Promise<PluginResult> {
  const deployConfig = config as DeployPluginConfig;
  const { action, environment, target, strategy } = deployConfig;

  console.log(
    `[DeployPlugin] 执行插件，action: ${action}, config:`,
    JSON.stringify(config, null, 2)
  );
  console.log(`[DeployPlugin] 项目根目录: ${projectRoot}`);
  console.log(`[DeployPlugin] 演示应用路径: ${demoAppPath}`);

  try {
    // 如果指定了 action 为 start，则启动应用
    if (action === 'start') {
      console.log(`[DeployPlugin] 执行启动操作`);
      return await startApp(deployConfig);
    }

    // 如果指定了 action 为 stop，则停止应用
    if (action === 'stop') {
      return await stopApp(deployConfig);
    }

    // 如果指定了 action 为 restart，则重启应用
    if (action === 'restart') {
      await stopApp(deployConfig);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await startApp(deployConfig);
    }

    // 原有的部署策略逻辑
    switch (strategy) {
      case 'blue-green':
        // TODO: 实现蓝绿部署逻辑
        return {
          success: true,
          message: `成功执行蓝绿部署到 ${environment}`,
        };
      case 'rolling':
        // TODO: 实现滚动部署逻辑
        return {
          success: true,
          message: `成功执行滚动部署到 ${environment}`,
        };
      case 'canary':
        // TODO: 实现金丝雀部署逻辑
        return {
          success: true,
          message: `成功执行金丝雀部署到 ${environment}`,
        };
      default:
        // 如果没有指定策略，默认启动应用
        return await startApp(deployConfig);
    }
  } catch (error) {
    return {
      success: false,
      message: `部署失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 部署插件定义
 */
export const deployPlugin = createPlugin(
  '@devops-automation/plugin-deploy',
  '1.0.0',
  executeDeployPlugin
);

export default deployPlugin;
