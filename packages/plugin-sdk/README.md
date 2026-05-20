# @devops-automation/plugin-sdk

插件开发SDK - 用于开发运维自动化平台插件的工具包

## 安装

```bash
npm install @devops-automation/plugin-sdk
# 或
pnpm add @devops-automation/plugin-sdk
# 或
yarn add @devops-automation/plugin-sdk
```

## 使用

```typescript
import { createPlugin } from '@devops-automation/plugin-sdk';
import type { PluginConfig, PluginContext, PluginResult } from '@devops-automation/plugin-sdk';

// 定义插件执行函数
async function executeMyPlugin(
  config: PluginConfig,
  context: PluginContext
): Promise<PluginResult> {
  // 实现你的插件逻辑
  return {
    success: true,
    message: '插件执行成功',
  };
}

// 创建插件定义
export const myPlugin = createPlugin(
  'my-plugin',
  '1.0.0',
  executeMyPlugin
);
```

## API文档

详见 [插件开发文档](../../docs/plugins/README.md)

## 许可证

MIT

