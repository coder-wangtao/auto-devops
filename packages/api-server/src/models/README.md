# 应用维度工作流系统

## 概述

本系统实现了基于应用类型和应用的工作流管理，支持多层级的工作流配置和权限控制。

## 数据模型

### 应用类型 (AppType)

应用类型定义了应用的分类（如桌面类应用、管理类应用、H5类应用等），每个类型可以配置一个默认工作流。

**特点：**
- 类型级别的默认工作流中的插件**不可修改**
- 类型下的所有应用会继承这个默认工作流

### 应用 (Application)

应用属于某个应用类型，可以配置多个自定义工作流。

**特点：**
- 每个应用可以关联多个工作流
- 应用工作流中的插件可以设置是否可微调（`adjustable` 属性）
- 如果 `adjustable` 为 `false`，则该插件在具体工作流中不可操作

## 权限控制规则

1. **类型默认工作流中的插件**：完全不可修改
2. **应用工作流中的插件**：
   - `adjustable: true` 或未设置：可以修改
   - `adjustable: false`：不可修改

## API 使用示例

### 1. 创建应用类型

```bash
POST /api/app-types
Content-Type: application/json

{
  "name": "桌面类应用",
  "description": "桌面端应用程序类型",
  "defaultWorkflow": {
    "name": "桌面应用默认工作流",
    "steps": [
      {
        "id": "step1",
        "name": "代码拉取",
        "plugin": "@devops-automation/plugin-git",
        "config": {
          "action": "pull",
          "repository": "https://github.com/example/desktop-app.git"
        }
      }
    ]
  }
}
```

### 2. 创建应用

```bash
POST /api/applications
Content-Type: application/json

{
  "name": "我的桌面应用",
  "description": "一个示例桌面应用",
  "typeId": "type_xxx",
  "workflows": [
    {
      "name": "自定义部署流程",
      "steps": [
        {
          "id": "step1",
          "name": "构建",
          "plugin": "@devops-automation/plugin-docker",
          "config": {
            "action": "build",
            "image": "my-app"
          },
          "adjustable": true  // 可微调
        },
        {
          "id": "step2",
          "name": "部署",
          "plugin": "@devops-automation/plugin-deploy",
          "config": {
            "environment": "production"
          },
          "adjustable": false  // 不可微调
        }
      ]
    }
  ]
}
```

### 3. 获取应用的完整工作流

```bash
GET /api/applications/{applicationId}/workflows
```

返回：
```json
{
  "success": true,
  "data": {
    "typeWorkflow": {
      "id": "wf_type_xxx",
      "name": "桌面应用默认工作流",
      "level": "type",
      "steps": [
        {
          "id": "step1",
          "name": "代码拉取",
          "plugin": "@devops-automation/plugin-git",
          "adjustable": undefined  // 类型工作流插件不可调整
        }
      ]
    },
    "applicationWorkflows": [
      {
        "id": "wf_app_xxx_0",
        "name": "自定义部署流程",
        "level": "application",
        "steps": [...]
      }
    ]
  }
}
```

### 4. 检查插件是否可以修改

```bash
GET /api/applications/{applicationId}/workflows/{workflowId}/steps/{stepId}/can-modify
```

返回：
```json
{
  "success": true,
  "data": {
    "canModify": false,
    "reason": "类型默认工作流中的插件不可修改"
  }
}
```

### 5. 更新应用（自动验证权限）

```bash
PUT /api/applications/{applicationId}
Content-Type: application/json

{
  "workflows": [
    {
      "id": "wf_app_xxx_0",
      "name": "自定义部署流程",
      "steps": [
        {
          "id": "step1",
          "name": "构建",
          "plugin": "@devops-automation/plugin-docker",
          "config": {
            "action": "build",
            "image": "my-app-updated"  // 如果 adjustable 为 false，此更新会被拒绝
          }
        }
      ]
    }
  ]
}
```

如果尝试修改不可调整的插件，会返回 403 错误：
```json
{
  "success": false,
  "message": "工作流 wf_app_xxx_0 中步骤 step1 的插件不可修改: 该插件被设置为不可微调"
}
```

## 工作流继承机制

1. 应用创建时，会自动继承所属类型的默认工作流
2. 类型默认工作流中的步骤在应用中显示，但不可修改
3. 应用可以添加自定义工作流，这些工作流中的插件可以配置是否可微调
4. 获取应用的完整工作流时，会返回类型工作流和应用工作流的组合
