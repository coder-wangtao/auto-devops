/**
 * 示例工作流数据
 */
import type { WorkflowDefinition } from '@devops-automation/core-engine';

export const exampleWorkflows: WorkflowDefinition[] = [
  {
    id: 'simple-deploy',
    name: '简单部署流程',
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
  {
    id: 'ci-cd-pipeline',
    name: 'CI/CD流水线',
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
];

