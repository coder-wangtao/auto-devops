/**
 * 插件加载工具
 * 从 plugins/ 目录加载真实的插件实现
 */

import { pluginConfigs } from '../data/plugins.config.js';
import type { PluginDefinition } from '@devops-automation/plugin-sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 从 plugins 目录加载插件
 * @param config 插件配置
 * @returns 插件实例
 */
async function loadPluginFromDirectory(
  config: (typeof pluginConfigs)[0]
): Promise<PluginDefinition | null> {
  try {
    // 构建插件文件路径（相对于项目根目录）
    // 从 packages/api-server/src/utils/ 到项目根目录，然后到 plugins/
    const projectRoot = join(__dirname, '../../../../');
    const pluginPath = join(projectRoot, 'plugins', config.directory, 'src', 'index.ts');

    // 使用动态导入加载插件
    const pluginModule = await import(pathToFileURL(pluginPath).href);

    // 获取插件实例（支持默认导出和命名导出）
    const plugin =
      config.exportName === 'default' || !config.exportName
        ? pluginModule.default
        : pluginModule[config.exportName];

    if (!plugin) {
      console.error(`❌ 插件 ${config.name} 未找到导出: ${config.exportName || 'default'}`);
      return null;
    }

    // 验证插件是否符合 PluginDefinition 接口
    if (!plugin.name || !plugin.version || !plugin.execute) {
      console.error(`❌ 插件 ${config.name} 格式不正确`);
      return null;
    }

    return plugin;
  } catch (error: any) {
    console.error(`❌ 加载插件 ${config.name} 失败:`, error.message);
    return null;
  }
}

/**
 * 加载所有插件
 * @returns 插件实例数组
 */
export async function loadPlugins(): Promise<PluginDefinition[]> {
  const plugins: PluginDefinition[] = [];

  console.log(`📦 开始加载 ${pluginConfigs.length} 个插件...`);

  for (const config of pluginConfigs) {
    const plugin = await loadPluginFromDirectory(config);
    if (plugin) {
      plugins.push(plugin);
      console.log(
        `  ✓ ${plugin.name} (v${plugin.version})${config.description ? ` - ${config.description}` : ''}`
      );
    }
  }

  console.log(`📦 成功加载 ${plugins.length}/${pluginConfigs.length} 个插件`);
  return plugins;
}

/**
 * 注册所有插件到插件服务
 * @param registerPlugin 注册插件的函数
 */
export async function registerAllPlugins(
  registerPlugin: (plugin: PluginDefinition) => void
): Promise<void> {
  const plugins = await loadPlugins();
  plugins.forEach(plugin => {
    registerPlugin(plugin);
  });
  console.log(`✅ 已注册 ${plugins.length} 个插件`);
}
