/**
 * 示例应用类型数据
 */
import type { AppType, CreateAppTypeRequest } from '../models/types.js';
import { appTypeService } from '../services/app-type.service.js';

/**
 * 初始化示例应用类型
 */
export function initializeExampleAppTypes(): AppType[] {
  const appTypes: CreateAppTypeRequest[] = [
    {
      name: '桌面类应用',
      description: '桌面端应用程序类型',
      defaultWorkflow: {
        name: '桌面应用默认工作流',
        level: 'type',
        steps: [
          {
            id: 'step1',
            name: '代码拉取',
            plugin: '@devops-automation/plugin-git',
            config: {
              action: 'pull',
              repository: 'https://github.com/example/desktop-app.git',
            },
            // 类型工作流中的插件不可调整（adjustable 会被设置为 undefined）
          },
          {
            id: 'step2',
            name: '构建应用',
            plugin: '@devops-automation/plugin-docker',
            config: {
              action: 'build',
              image: 'desktop-app',
              tag: 'latest',
            },
          },
        ],
      },
    },
    {
      name: '管理类应用',
      description: '后台管理系统应用类型',
      defaultWorkflow: {
        name: '管理应用默认工作流',
        level: 'type',
        steps: [
          {
            id: 'step1',
            name: '代码检出',
            plugin: '@devops-automation/plugin-git',
            config: {
              action: 'clone',
              repository: 'https://github.com/example/admin-app.git',
              branch: 'main',
            },
          },
          {
            id: 'step2',
            name: '运行测试',
            plugin: '@devops-automation/plugin-test',
            config: {
              type: 'unit',
              command: 'npm test',
            },
          },
          {
            id: 'step3',
            name: '部署到K8s',
            plugin: '@devops-automation/plugin-k8s',
            config: {
              action: 'deploy',
              namespace: 'admin',
              deployment: 'admin-app',
            },
          },
        ],
      },
    },
    {
      name: 'H5类应用',
      description: '移动端H5应用类型',
      defaultWorkflow: {
        name: 'H5应用默认工作流',
        level: 'type',
        steps: [
          {
            id: 'step1',
            name: '代码拉取',
            plugin: '@devops-automation/plugin-git',
            config: {
              action: 'pull',
              repository: 'https://github.com/example/h5-app.git',
            },
          },
          {
            id: 'step2',
            name: '构建静态资源',
            plugin: '@devops-automation/plugin-docker',
            config: {
              action: 'build',
              image: 'h5-app',
              tag: 'latest',
            },
          },
          {
            id: 'step3',
            name: '部署',
            plugin: '@devops-automation/plugin-deploy',
            config: {
              environment: 'production',
              strategy: 'rolling',
            },
          },
        ],
      },
    },
  ];

  return appTypes.map(data => appTypeService.createAppType(data));
}
