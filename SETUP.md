# 项目设置指南

## 首次运行前的准备

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建依赖包

在启动API服务之前，需要先构建依赖的包：

```bash
# 构建plugin-sdk和core-engine
pnpm build:deps

# 或者单独构建
pnpm --filter @devops-automation/plugin-sdk build
pnpm --filter @devops-automation/core-engine build
```

### 3. 启动服务

```bash
# 方式1：使用dev脚本（会自动构建依赖）
pnpm dev

# 方式2：分别启动
# 终端1：启动API服务
pnpm --filter @devops-automation/api-server dev

# 终端2：启动Web界面
pnpm --filter @devops-automation/web-dashboard dev
```

## 常见问题

### 问题1：找不到plugin-sdk模块

**原因**：plugin-sdk还没有构建，缺少dist目录。

**解决方案**：
```bash
pnpm --filter @devops-automation/plugin-sdk build
```

### 问题2：找不到core-engine模块

**原因**：core-engine还没有构建。

**解决方案**：
```bash
pnpm --filter @devops-automation/core-engine build
```

### 问题3：workspace依赖未链接

**原因**：pnpm workspace依赖没有正确链接。

**解决方案**：
```bash
# 重新安装依赖
pnpm install

# 或者强制重新链接
pnpm install --force
```

## 开发工作流

1. **修改plugin-sdk或core-engine后**：
   ```bash
   # 重新构建
   pnpm build:deps
   
   # 或者使用watch模式（如果支持）
   pnpm --filter @devops-automation/plugin-sdk dev
   ```

2. **修改API服务或Web界面后**：
   - 使用dev模式会自动重新加载
   - 无需手动构建

3. **清理构建产物**：
   ```bash
   pnpm clean
   ```

## 项目结构说明

- `packages/plugin-sdk` - 插件SDK（需要先构建）
- `packages/core-engine` - 核心引擎（依赖plugin-sdk，需要先构建）
- `packages/api-server` - API服务（依赖core-engine和plugin-sdk）
- `packages/web-dashboard` - Web界面（独立，不依赖其他包）

构建顺序：plugin-sdk → core-engine → api-server/web-dashboard

