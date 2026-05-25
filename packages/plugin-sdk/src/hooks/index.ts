/**
 * 生命周期钩子
 * @module hooks
 */

export interface PluginHooks {
  beforeExecute?: () => Promise<void> | void;
  afterExecute?: () => Promise<void> | void;
  onError?: (error: Error) => Promise<void> | void;
}
