# 部署指南

本文档说明各个模块的独立部署和发布策略。

## 模块分类

### 📦 可独立发布的npm包

这些包可以发布到npm，供其他项目使用：

#### 1. `@devops-automation/plugin-sdk`
- **用途**：插件开发工具包
- **发布方式**：npm包
- **使用场景**：插件开发者安装此包来开发自定义插件
- **发布命令**：`pnpm publish:plugin-sdk`

#### 2. `@devops-automation/core-engine`
- **用途**：核心引擎库
- **发布方式**：npm包
- **使用场景**：其他项目可以直接使用核心引擎功能
- **发布命令**：`pnpm publish:core-engine`
- **依赖**：需要 `@devops-automation/plugin-sdk`

### 🚀 可独立部署的应用

这些是完整的应用，可以独立部署运行：

#### 3. `@devops-automation/web-dashboard`
- **类型**：前端应用（React + Vite）
- **部署方式**：
  - 静态文件部署（Nginx、CDN等）
  - Docker容器部署
  - Kubernetes部署
- **构建产物**：`dist/` 目录
- **部署命令**：`pnpm --filter @devops-automation/web-dashboard build`
- **特点**：构建后是纯静态文件，可部署到任何静态服务器

#### 4. `@devops-automation/api-server`
- **类型**：后端服务（Node.js + Express）
- **部署方式**：
  - 直接运行（Node.js）
  - Docker容器部署
  - Kubernetes部署
  - PM2进程管理
- **部署命令**：`pnpm --filter @devops-automation/api-server deploy`
- **依赖**：需要 `@devops-automation/core-engine`（可通过npm安装或workspace链接）

## 部署策略

### 策略1：完整平台部署（推荐）

所有模块一起部署，适合生产环境：

```bash
# 1. 构建所有包
pnpm build

# 2. 启动API服务
cd packages/api-server
pnpm start

# 3. 部署前端（构建后的dist目录）
cd packages/web-dashboard
# 将dist目录部署到Nginx或CDN
```

### 策略2：独立部署

#### 前端独立部署

```bash
# 构建前端
pnpm --filter @devops-automation/web-dashboard build

# 部署dist目录到静态服务器
# 配置API代理指向后端服务
```

#### 后端独立部署

```bash
# 构建后端
pnpm --filter @devops-automation/api-server build

# 启动服务
pnpm --filter @devops-automation/api-server start

# 或使用Docker
docker build -t devops-api -f packages/api-server/Dockerfile .
docker run -p 3001:3001 devops-api
```

### 策略3：npm包发布

发布核心包到npm供其他项目使用：

```bash
# 发布插件SDK
pnpm publish:plugin-sdk

# 发布核心引擎
pnpm publish:core-engine

# 或一次性发布所有可发布的包
pnpm publish:all
```

## Docker部署示例

### 前端Dockerfile

```dockerfile
# packages/web-dashboard/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages/web-dashboard ./packages/web-dashboard
RUN npm install -g pnpm && pnpm install && pnpm --filter @devops-automation/web-dashboard build

FROM nginx:alpine
COPY --from=builder /app/packages/web-dashboard/dist /usr/share/nginx/html
COPY packages/web-dashboard/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 后端Dockerfile

```dockerfile
# packages/api-server/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages ./packages
RUN npm install -g pnpm && pnpm install && pnpm build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/packages/api-server/dist ./dist
COPY --from=builder /app/packages/api-server/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

## Kubernetes部署示例

### 前端Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devops-dashboard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: devops-dashboard
  template:
    metadata:
      labels:
        app: devops-dashboard
    spec:
      containers:
      - name: dashboard
        image: devops-dashboard:latest
        ports:
        - containerPort: 80
```

### 后端Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devops-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: devops-api
  template:
    metadata:
      labels:
        app: devops-api
    spec:
      containers:
      - name: api
        image: devops-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: devops-secrets
              key: database-url
```

## 发布流程

### 发布npm包

1. **更新版本号**
   ```bash
   # 手动更新package.json中的version
   # 或使用工具自动更新
   ```

2. **构建包**
   ```bash
   pnpm --filter @devops-automation/plugin-sdk build
   ```

3. **发布到npm**
   ```bash
   pnpm publish:plugin-sdk
   ```

4. **验证发布**
   ```bash
   npm view @devops-automation/plugin-sdk
   ```

## 注意事项

1. **版本管理**：使用语义化版本（SemVer）
2. **依赖管理**：发布前确保依赖版本正确
3. **测试**：发布前运行完整测试套件
4. **文档**：确保README和API文档是最新的
5. **私有包**：`web-dashboard` 和 `api-server` 标记为 `private: true`，不会发布到npm

## CI/CD集成

可以在CI/CD流程中自动化部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter @devops-automation/api-server build
      - run: docker build -t devops-api .
      - run: docker push devops-api:latest
```

