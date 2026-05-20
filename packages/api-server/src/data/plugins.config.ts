/**
 * 插件配置文件
 * 在此文件中配置所有需要注册的插件
 * 添加新插件时，只需在此文件中添加配置即可
 * 
 * 注意：插件实际实现位于 plugins/ 目录下
 * 此文件只配置插件元数据和路径映射
 */

/**
 * 插件配置接口
 */
export interface PluginConfig {
  /** 插件名称（包名） */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description?: string;
  /** 插件目录名称（plugins/ 下的目录名） */
  directory: string;
  /** 插件导出名称（从插件文件导出的变量名，默认导出使用 'default'） */
  exportName?: string;
}

/**
 * 插件配置列表
 * 添加新插件时，在此数组中添加配置
 * 
 * 示例：
 * {
 *   name: '@devops-automation/plugin-new',
 *   version: '1.0.0',
 *   description: '新插件描述',
 *   directory: 'new-plugin',  // plugins/new-plugin/
 *   exportName: 'default'      // 或 'newPlugin' 如果使用命名导出
 * }
 */
export const pluginConfigs: PluginConfig[] = [
  {
    name: '@devops-automation/plugin-git',
    version: '1.0.0',
    description: 'Git操作插件，支持clone、pull、checkout等操作',
    directory: 'git-plugin',
    exportName: 'default',
  },
  {
    name: '@devops-automation/plugin-docker',
    version: '1.0.0',
    description: 'Docker操作插件，支持build、push、pull等操作',
    directory: 'docker-plugin',
    exportName: 'default',
  },
  {
    name: '@devops-automation/plugin-k8s',
    version: '1.0.0',
    description: 'Kubernetes操作插件，支持deploy、scale等操作',
    directory: 'k8s-plugin',
    exportName: 'default',
  },
  {
    name: '@devops-automation/plugin-test',
    version: '1.0.0',
    description: '测试执行插件，支持单元测试、集成测试等',
    directory: 'test-plugin',
    exportName: 'default',
  },
  {
    name: '@devops-automation/plugin-deploy',
    version: '1.0.0',
    description: '部署操作插件，支持多种部署策略',
    directory: 'deploy-plugin',
    exportName: 'default',
  },
];

