/**
 * Git操作插件
 * @module git-plugin
 */

import { createPlugin, getConfig } from '@devops-automation/plugin-sdk';
import type { PluginConfig, PluginContext, PluginResult } from '@devops-automation/plugin-sdk';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const execAsync = promisify(exec);

/**
 * Git插件配置接口
 */
interface GitPluginConfig extends PluginConfig {
  action: 'clone' | 'checkout' | 'pull' | 'push' | 'commit' | 'status' | 'fetch' | 'merge';
  repository?: string;
  branch?: string;
  tag?: string;
  commit?: string;
  workDir?: string;
  remote?: string;
  message?: string;
  files?: string[];
  depth?: number;
  username?: string;
  password?: string;
  sshKey?: string;
  force?: boolean;
}

/**
 * 执行Git命令
 */
async function executeGitCommand(
  command: string,
  workDir?: string,
  env?: Record<string, string>
): Promise<{ stdout: string; stderr: string }> {
  const options: { cwd?: string; env?: Record<string, string> } = {};
  
  if (workDir) {
    options.cwd = resolve(workDir);
  }
  
  if (env) {
    // 过滤掉 undefined 值
    const processEnv: Record<string, string> = {};
    for (const key in process.env) {
      const value = process.env[key];
      if (value !== undefined) {
        processEnv[key] = value;
      }
    }
    options.env = { ...processEnv, ...env };
  }

  try {
    const result = await execAsync(command, options);
    return result;
  } catch (error: any) {
    // Git命令即使成功也可能返回非零退出码，需要检查stderr
    if (error.stderr && !error.stdout) {
      throw new Error(error.stderr);
    }
    return { stdout: error.stdout || '', stderr: error.stderr || '' };
  }
}

/**
 * 获取工作目录
 */
function getWorkDirectory(config: GitPluginConfig, context: PluginContext): string {
  const workDir = getConfig<string>(config, 'workDir') || 
                  getContext<string>(context, 'workDir') ||
                  process.cwd();
  return resolve(workDir);
}

/**
 * 从上下文获取值
 */
function getContext<T = unknown>(context: PluginContext, key: string): T | undefined {
  return context[key] as T | undefined;
}

/**
 * 克隆仓库
 */
async function cloneRepository(config: GitPluginConfig, context: PluginContext): Promise<PluginResult> {
  
  
  const repository = getConfig<string>(config, 'repository');
  if (!repository) {
    return {
      success: false,
      message: '缺少必需参数: repository',
    };
  }

  const branch = getConfig<string>(config, 'branch');
  const depth = getConfig<number>(config, 'depth');
  const workDir = getWorkDirectory(config, context);
  const repoName = repository.split('/').pop()?.replace('.git', '') || 'repo';
  const targetDir = join(workDir, repoName);

  // 如果目录已存在，检查是否是git仓库
  if (existsSync(targetDir)) {
    if (existsSync(join(targetDir, '.git'))) {
      return {
        success: true,
        message: `仓库已存在于: ${targetDir}`,
        data: { path: targetDir },
      };
    }
  } else {
    await mkdir(targetDir, { recursive: true });
  }

  let cloneCommand = `git clone ${repository}`;
  
  if (branch) {
    cloneCommand += ` -b ${branch}`;
  }
  
  if (depth) {
    cloneCommand += ` --depth ${depth}`;
  }
  
  cloneCommand += ` ${targetDir}`;

  try {
    const { stdout, stderr } = await executeGitCommand(cloneCommand, workDir);
    return {
      success: true,
      message: `成功克隆仓库: ${repository}${branch ? ` (分支: ${branch})` : ''}`,
      data: {
        path: targetDir,
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `克隆仓库失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 切换分支或标签
 */
async function checkoutBranch(config: GitPluginConfig, context: PluginContext): Promise<PluginResult> {
  const branch = getConfig<string>(config, 'branch');
  const tag = getConfig<string>(config, 'tag');
  const commit = getConfig<string>(config, 'commit');
  const workDir = getWorkDirectory(config, context);
  const force = getConfig<boolean>(config, 'force') || false;

  if (!branch && !tag && !commit) {
    return {
      success: false,
      message: '缺少必需参数: branch, tag 或 commit',
    };
  }

  const target = branch || tag || commit;
  let checkoutCommand = `git checkout ${force ? '-f ' : ''}${target}`;

  try {
    const { stdout, stderr } = await executeGitCommand(checkoutCommand, workDir);
    return {
      success: true,
      message: `成功切换到: ${target}`,
      data: {
        target,
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `切换失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 拉取代码
 */
async function pullCode(config: GitPluginConfig, context: PluginContext): Promise<PluginResult> {
  const branch = getConfig<string>(config, 'branch');
  const remote = getConfig<string>(config, 'remote') || 'origin';
  const workDir = getWorkDirectory(config, context);

  // 检查是否是git仓库
  if (!existsSync(join(workDir, '.git'))) {
    return {
      success: false,
      message: `目录 ${workDir} 不是Git仓库`,
    };
  }

  let pullCommand = `git pull ${remote}`;
  if (branch) {
    pullCommand += ` ${branch}`;
  }

  try {
    const { stdout, stderr } = await executeGitCommand(pullCommand, workDir);
    return {
      success: true,
      message: `成功拉取代码${branch ? ` (分支: ${branch})` : ''}`,
      data: {
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `拉取代码失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 推送代码
 */
async function pushCode(config: GitPluginConfig, context: PluginContext): Promise<PluginResult> {
  const branch = getConfig<string>(config, 'branch');
  const remote = getConfig<string>(config, 'remote') || 'origin';
  const force = getConfig<boolean>(config, 'force') || false;
  const workDir = getWorkDirectory(config, context);

  // 检查是否是git仓库
  if (!existsSync(join(workDir, '.git'))) {
    return {
      success: false,
      message: `目录 ${workDir} 不是Git仓库`,
    };
  }

  let pushCommand = `git push ${remote}`;
  if (branch) {
    pushCommand += ` ${branch}`;
  }
  if (force) {
    pushCommand += ' --force';
  }

  try {
    const { stdout, stderr } = await executeGitCommand(pushCommand, workDir);
    return {
      success: true,
      message: `成功推送代码${branch ? ` (分支: ${branch})` : ''}`,
      data: {
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `推送代码失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 提交代码
 */
async function commitChanges(config: GitPluginConfig, context: PluginContext): Promise<PluginResult> {
  const message = getConfig<string>(config, 'message');
  const files = getConfig<string[]>(config, 'files');
  const workDir = getWorkDirectory(config, context);

  // 检查是否是git仓库
  if (!existsSync(join(workDir, '.git'))) {
    return {
      success: false,
      message: `目录 ${workDir} 不是Git仓库`,
    };
  }

  if (!message) {
    return {
      success: false,
      message: '缺少必需参数: message',
    };
  }

  try {
    // 添加文件
    if (files && files.length > 0) {
      const addCommand = `git add ${files.join(' ')}`;
      await executeGitCommand(addCommand, workDir);
    } else {
      // 如果没有指定文件，添加所有更改
      await executeGitCommand('git add -A', workDir);
    }

    // 提交
    const commitCommand = `git commit -m "${message.replace(/"/g, '\\"')}"`;
    const { stdout, stderr } = await executeGitCommand(commitCommand, workDir);
    
    return {
      success: true,
      message: '成功提交代码',
      data: {
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `提交代码失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 查看状态
 */
async function getStatus(config: GitPluginConfig, context: PluginContext): Promise<PluginResult> {
  const workDir = getWorkDirectory(config, context);

  // 检查是否是git仓库
  if (!existsSync(join(workDir, '.git'))) {
    return {
      success: false,
      message: `目录 ${workDir} 不是Git仓库`,
    };
  }

  try {
    const { stdout, stderr } = await executeGitCommand('git status', workDir);
    const branchResult = await executeGitCommand('git branch --show-current', workDir);
    const branch = branchResult.stdout.trim();
    
    return {
      success: true,
      message: '获取状态成功',
      data: {
        branch,
        status: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `获取状态失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 获取远程更新
 */
async function fetchUpdates(config: GitPluginConfig, context: PluginContext): Promise<PluginResult> {
  const remote = getConfig<string>(config, 'remote') || 'origin';
  const workDir = getWorkDirectory(config, context);

  // 检查是否是git仓库
  if (!existsSync(join(workDir, '.git'))) {
    return {
      success: false,
      message: `目录 ${workDir} 不是Git仓库`,
    };
  }

  try {
    const { stdout, stderr } = await executeGitCommand(`git fetch ${remote}`, workDir);
    return {
      success: true,
      message: `成功获取远程更新 (${remote})`,
      data: {
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `获取远程更新失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 合并分支
 */
async function mergeBranch(config: GitPluginConfig, context: PluginContext): Promise<PluginResult> {
  const branch = getConfig<string>(config, 'branch');
  const workDir = getWorkDirectory(config, context);

  if (!branch) {
    return {
      success: false,
      message: '缺少必需参数: branch',
    };
  }

  // 检查是否是git仓库
  if (!existsSync(join(workDir, '.git'))) {
    return {
      success: false,
      message: `目录 ${workDir} 不是Git仓库`,
    };
  }

  try {
    const { stdout, stderr } = await executeGitCommand(`git merge ${branch}`, workDir);
    return {
      success: true,
      message: `成功合并分支: ${branch}`,
      data: {
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `合并分支失败: ${(error as Error).message}`,
    };
  }
}

/**
 * Git插件执行函数
 */
async function executeGitPlugin(
  config: PluginConfig,
  context: PluginContext
): Promise<PluginResult> {
  const action = getConfig<string>(config, 'action');

  if (!action) {
    return {
      success: false,
      message: '缺少必需参数: action',
    };
  }

  try {
    switch (action) {
      case 'clone':
        return await cloneRepository(config as GitPluginConfig, context);
      case 'checkout':
        return await checkoutBranch(config as GitPluginConfig, context);
      case 'pull':
        return await pullCode(config as GitPluginConfig, context);
      case 'push':
        return await pushCode(config as GitPluginConfig, context);
      case 'commit':
        return await commitChanges(config as GitPluginConfig, context);
      case 'status':
        return await getStatus(config as GitPluginConfig, context);
      case 'fetch':
        return await fetchUpdates(config as GitPluginConfig, context);
      case 'merge':
        return await mergeBranch(config as GitPluginConfig, context);
      default:
        return {
          success: false,
          message: `未知的Git操作: ${action}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Git操作失败: ${(error as Error).message}`,
    };
  }
}

/**
 * Git插件定义
 */
export const gitPlugin = createPlugin(
  '@devops-automation/plugin-git',
  '1.0.0',
  executeGitPlugin
);

export default gitPlugin;

