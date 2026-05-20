/**
 * 基础插件函数
 * @module base
 */

import type { PluginConfig, PluginContext, PluginResult } from '../types/index.js';

/**
 * 插件执行函数类型
 */
export type PluginExecuteFn = (
  config: PluginConfig,
  context: PluginContext
) => Promise<PluginResult>;

/**
 * 插件定义接口
 */
export interface PluginDefinition {
  name: string;
  version: string;
  execute: PluginExecuteFn;
}

/**
 * 创建插件配置的辅助函数
 */
export function createPlugin(
  name: string,
  version: string,
  execute: PluginExecuteFn
): PluginDefinition {
  return {
    name,
    version,
    execute,
  };
}

/**
 * 获取配置值的辅助函数
 */
export function getConfig<T = unknown>(
  config: PluginConfig,
  key: string
): T | undefined {
  return config[key] as T | undefined;
}

/**
 * 获取上下文值的辅助函数
 */
export function getContext<T = unknown>(
  context: PluginContext,
  key: string
): T | undefined {
  return context[key] as T | undefined;
}

