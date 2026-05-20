/**
 * Docker操作插件
 * @module docker-plugin
 */

import { createPlugin, getConfig } from '@devops-automation/plugin-sdk';
import type { PluginConfig, PluginContext, PluginResult } from '@devops-automation/plugin-sdk';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const execAsync = promisify(exec);

/**
 * Docker插件配置接口
 */
interface DockerPluginConfig extends PluginConfig {
  action: 'build' | 'push' | 'pull' | 'run' | 'stop' | 'rm' | 'images' | 'ps' | 'tag' | 'rmi';
  image?: string;
  tag?: string;
  newTag?: string;
  container?: string;
  dockerfile?: string;
  context?: string;
  registry?: string;
  ports?: string[];
  env?: string[];
  volumes?: string[];
  workDir?: string;
  command?: string;
  detach?: boolean;
  force?: boolean;
  all?: boolean;
}

/**
 * 执行Docker命令
 */
async function executeDockerCommand(
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
    // Docker命令即使成功也可能返回非零退出码，需要检查stderr
    if (error.stderr && !error.stdout) {
      throw new Error(error.stderr);
    }
    return { stdout: error.stdout || '', stderr: error.stderr || '' };
  }
}

/**
 * 获取工作目录
 */
function getWorkDirectory(config: DockerPluginConfig, context: PluginContext): string {
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
 * 构建镜像
 */
async function buildImage(config: DockerPluginConfig, context: PluginContext): Promise<PluginResult> {
  const image = getConfig<string>(config, 'image');
  const tag = getConfig<string>(config, 'tag') || 'latest';
  const dockerfile = getConfig<string>(config, 'dockerfile') || 'Dockerfile';
  const contextPath = getConfig<string>(config, 'context') || '.';
  const workDir = getWorkDirectory(config, context);

  if (!image) {
    return {
      success: false,
      message: '缺少必需参数: image',
    };
  }

  const fullImageName = `${image}:${tag}`;
  const dockerfilePath = resolve(workDir, dockerfile);
  const buildContext = resolve(workDir, contextPath);

  // 检查 Dockerfile 是否存在
  if (!existsSync(dockerfilePath) && dockerfile === 'Dockerfile') {
    // 如果默认 Dockerfile 不存在，检查构建上下文目录
    if (!existsSync(buildContext)) {
      return {
        success: false,
        message: `构建上下文目录不存在: ${buildContext}`,
      };
    }
  }

  let buildCommand = `docker build -t ${fullImageName}`;
  
  if (existsSync(dockerfilePath)) {
    buildCommand += ` -f ${dockerfilePath}`;
  }
  
  buildCommand += ` ${buildContext}`;

  try {
    const { stdout, stderr } = await executeDockerCommand(buildCommand, workDir);
    return {
      success: true,
      message: `成功构建镜像: ${fullImageName}`,
      data: {
        image: fullImageName,
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `构建镜像失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 推送镜像
 */
async function pushImage(config: DockerPluginConfig, context: PluginContext): Promise<PluginResult> {
  const image = getConfig<string>(config, 'image');
  const tag = getConfig<string>(config, 'tag') || 'latest';
  const registry = getConfig<string>(config, 'registry');

  if (!image) {
    return {
      success: false,
      message: '缺少必需参数: image',
    };
  }

  let fullImageName = `${image}:${tag}`;
  if (registry) {
    fullImageName = `${registry}/${fullImageName}`;
  }

  try {
    const { stdout, stderr } = await executeDockerCommand(`docker push ${fullImageName}`);
    return {
      success: true,
      message: `成功推送镜像: ${fullImageName}`,
      data: {
        image: fullImageName,
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `推送镜像失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 拉取镜像
 */
async function pullImage(config: DockerPluginConfig, context: PluginContext): Promise<PluginResult> {
  const image = getConfig<string>(config, 'image');
  const tag = getConfig<string>(config, 'tag') || 'latest';
  const registry = getConfig<string>(config, 'registry');

  if (!image) {
    return {
      success: false,
      message: '缺少必需参数: image',
    };
  }

  let fullImageName = `${image}:${tag}`;
  if (registry) {
    fullImageName = `${registry}/${fullImageName}`;
  }

  try {
    const { stdout, stderr } = await executeDockerCommand(`docker pull ${fullImageName}`);
    return {
      success: true,
      message: `成功拉取镜像: ${fullImageName}`,
      data: {
        image: fullImageName,
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `拉取镜像失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 运行容器
 */
async function runContainer(config: DockerPluginConfig, context: PluginContext): Promise<PluginResult> {
  const image = getConfig<string>(config, 'image');
  const tag = getConfig<string>(config, 'tag') || 'latest';
  const container = getConfig<string>(config, 'container');
  const ports = getConfig<string[]>(config, 'ports') || [];
  const env = getConfig<string[]>(config, 'env') || [];
  const volumes = getConfig<string[]>(config, 'volumes') || [];
  const command = getConfig<string>(config, 'command');
  const detach = getConfig<boolean>(config, 'detach') || false;

  if (!image) {
    return {
      success: false,
      message: '缺少必需参数: image',
    };
  }

  const fullImageName = `${image}:${tag}`;
  let runCommand = 'docker run';

  if (detach) {
    runCommand += ' -d';
  }

  if (container) {
    runCommand += ` --name ${container}`;
  }

  ports.forEach(port => {
    runCommand += ` -p ${port}`;
  });

  env.forEach(envVar => {
    runCommand += ` -e ${envVar}`;
  });

  volumes.forEach(volume => {
    runCommand += ` -v ${volume}`;
  });

  runCommand += ` ${fullImageName}`;

  if (command) {
    runCommand += ` ${command}`;
  }

  try {
    const { stdout, stderr } = await executeDockerCommand(runCommand);
    return {
      success: true,
      message: `成功运行容器: ${container || fullImageName}`,
      data: {
        container: container || stdout.trim(),
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `运行容器失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 停止容器
 */
async function stopContainer(config: DockerPluginConfig, context: PluginContext): Promise<PluginResult> {
  const container = getConfig<string>(config, 'container');

  if (!container) {
    return {
      success: false,
      message: '缺少必需参数: container',
    };
  }

  try {
    const { stdout, stderr } = await executeDockerCommand(`docker stop ${container}`);
    return {
      success: true,
      message: `成功停止容器: ${container}`,
      data: {
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `停止容器失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 删除容器
 */
async function removeContainer(config: DockerPluginConfig, context: PluginContext): Promise<PluginResult> {
  const container = getConfig<string>(config, 'container');
  const force = getConfig<boolean>(config, 'force') || false;

  if (!container) {
    return {
      success: false,
      message: '缺少必需参数: container',
    };
  }

  let rmCommand = `docker rm ${container}`;
  if (force) {
    rmCommand += ' -f';
  }

  try {
    const { stdout, stderr } = await executeDockerCommand(rmCommand);
    return {
      success: true,
      message: `成功删除容器: ${container}`,
      data: {
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `删除容器失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 列出镜像
 */
async function listImages(config: DockerPluginConfig, context: PluginContext): Promise<PluginResult> {
  const all = getConfig<boolean>(config, 'all') || false;

  let imagesCommand = 'docker images';
  if (all) {
    imagesCommand += ' -a';
  }

  try {
    const { stdout, stderr } = await executeDockerCommand(imagesCommand);
    return {
      success: true,
      message: '获取镜像列表成功',
      data: {
        images: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `获取镜像列表失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 列出容器
 */
async function listContainers(config: DockerPluginConfig, context: PluginContext): Promise<PluginResult> {
  const all = getConfig<boolean>(config, 'all') || false;

  let psCommand = 'docker ps';
  if (all) {
    psCommand += ' -a';
  }

  try {
    const { stdout, stderr } = await executeDockerCommand(psCommand);
    return {
      success: true,
      message: '获取容器列表成功',
      data: {
        containers: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `获取容器列表失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 标记镜像
 */
async function tagImage(config: DockerPluginConfig, context: PluginContext): Promise<PluginResult> {
  const image = getConfig<string>(config, 'image');
  const tag = getConfig<string>(config, 'tag') || 'latest';
  const newTag = getConfig<string>(config, 'newTag') || tag;
  const registry = getConfig<string>(config, 'registry');

  if (!image) {
    return {
      success: false,
      message: '缺少必需参数: image',
    };
  }

  const sourceImage = `${image}:${tag}`;
  let targetImage = `${image}:${newTag}`;
  
  if (registry) {
    targetImage = `${registry}/${targetImage}`;
  }

  try {
    const { stdout, stderr } = await executeDockerCommand(`docker tag ${sourceImage} ${targetImage}`);
    return {
      success: true,
      message: `成功标记镜像: ${sourceImage} -> ${targetImage}`,
      data: {
        source: sourceImage,
        target: targetImage,
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `标记镜像失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 删除镜像
 */
async function removeImage(config: DockerPluginConfig, context: PluginContext): Promise<PluginResult> {
  const image = getConfig<string>(config, 'image');
  const tag = getConfig<string>(config, 'tag') || 'latest';
  const force = getConfig<boolean>(config, 'force') || false;

  if (!image) {
    return {
      success: false,
      message: '缺少必需参数: image',
    };
  }

  const fullImageName = `${image}:${tag}`;
  let rmiCommand = `docker rmi ${fullImageName}`;
  
  if (force) {
    rmiCommand += ' -f';
  }

  try {
    const { stdout, stderr } = await executeDockerCommand(rmiCommand);
    return {
      success: true,
      message: `成功删除镜像: ${fullImageName}`,
      data: {
        output: stdout || stderr,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `删除镜像失败: ${(error as Error).message}`,
    };
  }
}

/**
 * Docker插件执行函数
 */
async function executeDockerPlugin(
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
      case 'build':
        return await buildImage(config as DockerPluginConfig, context);
      case 'push':
        return await pushImage(config as DockerPluginConfig, context);
      case 'pull':
        return await pullImage(config as DockerPluginConfig, context);
      case 'run':
        return await runContainer(config as DockerPluginConfig, context);
      case 'stop':
        return await stopContainer(config as DockerPluginConfig, context);
      case 'rm':
        return await removeContainer(config as DockerPluginConfig, context);
      case 'images':
        return await listImages(config as DockerPluginConfig, context);
      case 'ps':
        return await listContainers(config as DockerPluginConfig, context);
      case 'tag':
        return await tagImage(config as DockerPluginConfig, context);
      case 'rmi':
        return await removeImage(config as DockerPluginConfig, context);
      default:
        return {
          success: false,
          message: `未知的Docker操作: ${action}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Docker操作失败: ${(error as Error).message}`,
    };
  }
}

/**
 * Docker插件定义
 */
export const dockerPlugin = createPlugin(
  '@devops-automation/plugin-docker',
  '1.0.0',
  executeDockerPlugin
);

export default dockerPlugin;

