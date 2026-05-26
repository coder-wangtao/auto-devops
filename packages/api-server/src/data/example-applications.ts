/**
 * 示例应用数据
 */
import type { CreateApplicationRequest } from '../models/types.js';
import { applicationService } from '../services/application.service.js';
import { appTypeService } from '../services/app-type.service.js';

/**
 * 初始化示例应用
 * 为默认工作流创建对应的应用类型和应用
 */
export function initializeExampleApplications(): void {
  // 获取所有应用类型
  const appTypes = appTypeService.getAllAppTypes();

  // 为 simple-deploy 工作流创建应用类型（如果不存在）
  let simpleDeployType = appTypes.find(type => type.name === '简单部署应用');
  if (!simpleDeployType) {
    simpleDeployType = appTypeService.createAppType({
      name: '简单部署应用',
      description: '适用于简单部署流程的应用类型',
      defaultWorkflow: {
        name: '简单部署流程',
        level: 'type',
        steps: [
          {
            id: 'step1',
            name: '拉取代码',
            plugin: '@devops-automation/plugin-git',
            config: {
              action: 'pull',
              repository: 'https://github.com/example/repo.git',
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
            name: '构建镜像',
            plugin: '@devops-automation/plugin-docker',
            config: {
              action: 'build',
              image: 'my-app',
              tag: 'latest',
            },
          },
          {
            id: 'step4',
            name: '部署到K8s',
            plugin: '@devops-automation/plugin-k8s',
            config: {
              action: 'deploy',
              namespace: 'default',
              deployment: 'my-app',
            },
          },
          {
            id: 'step5',
            name: '启动演示应用',
            plugin: '@devops-automation/plugin-deploy',
            config: {
              action: 'start',
              port: 3010,
            },
            dependsOn: ['step4'],
          },
        ],
      },
    });
  }

  // 为 simple-deploy 工作流创建应用
  const existingSimpleDeployApp = applicationService
    .getAllApplications()
    .find(app => app.name === '简单部署示例应用');

  if (!existingSimpleDeployApp && simpleDeployType) {
    applicationService.createApplication({
      name: '简单部署示例应用',
      description: '使用简单部署流程的示例应用',
      typeId: simpleDeployType.id,
      workflowName: '简单部署流程',
      gitServerType: 'github',
      projectName: 'simple-deploy-example',
    });
  }

  // 为 ci-cd-pipeline 工作流创建应用类型（如果不存在）
  let ciCdType = appTypes.find(type => type.name === 'CI/CD流水线应用');
  if (!ciCdType) {
    ciCdType = appTypeService.createAppType({
      name: 'CI/CD流水线应用',
      description: '适用于完整CI/CD流水线的应用类型',
      defaultWorkflow: {
        name: 'CI/CD流水线',
        level: 'type',
        steps: [
          {
            id: 'step1',
            name: '代码检出',
            plugin: '@devops-automation/plugin-git',
            config: {
              action: 'clone',
              repository: 'https://github.com/example/repo.git',
              branch: 'main',
            },
          },
          {
            id: 'step2',
            name: '单元测试',
            plugin: '@devops-automation/plugin-test',
            config: {
              type: 'unit',
            },
            dependsOn: ['step1'],
          },
          {
            id: 'step3',
            name: '集成测试',
            plugin: '@devops-automation/plugin-test',
            config: {
              type: 'integration',
            },
            dependsOn: ['step2'],
          },
          {
            id: 'step4',
            name: '构建Docker镜像',
            plugin: '@devops-automation/plugin-docker',
            config: {
              action: 'build',
              image: 'my-app',
              tag: '${BUILD_NUMBER}',
            },
            dependsOn: ['step3'],
          },
          {
            id: 'step5',
            name: '推送镜像',
            plugin: '@devops-automation/plugin-docker',
            config: {
              action: 'push',
              image: 'my-app',
              tag: '${BUILD_NUMBER}',
            },
            dependsOn: ['step4'],
          },
          {
            id: 'step6',
            name: '部署到生产',
            plugin: '@devops-automation/plugin-deploy',
            config: {
              environment: 'production',
              strategy: 'rolling',
            },
            dependsOn: ['step5'],
          },
        ],
      },
    });
  }

  // 为 ci-cd-pipeline 工作流创建应用
  const existingCiCdApp = applicationService
    .getAllApplications()
    .find(app => app.name === 'CI/CD流水线示例应用');

  if (!existingCiCdApp && ciCdType) {
    applicationService.createApplication({
      name: 'CI/CD流水线示例应用',
      description: '使用完整CI/CD流水线的示例应用',
      typeId: ciCdType.id,
      workflowName: 'CI/CD流水线',
      gitServerType: 'github',
      projectName: 'cicd-pipeline-example',
    });
  }
}
