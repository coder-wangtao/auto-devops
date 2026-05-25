/**
 * 插件SDK入口文件
 * @module plugin-sdk
 */

export * from './types/index.js';
export * from './base/index.js';
export * from './hooks/index.js';

// 重新导出常用类型和函数，方便使用
export type { PluginConfig, PluginContext, PluginResult } from './types/index.js';

export {
  createPlugin,
  getConfig,
  getContext,
  type PluginDefinition,
  type PluginExecuteFn,
} from './base/index.js';
