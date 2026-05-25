/**
 * 插件类型定义
 * @module types
 */

export interface PluginConfig {
  name: string;
  version: string;
  description?: string;
  [key: string]: unknown;
}

export interface PluginContext {
  [key: string]: unknown;
}

export interface PluginResult {
  success: boolean;
  message?: string;
  data?: unknown;
}
