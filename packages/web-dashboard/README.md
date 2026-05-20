# @devops-automation/web-dashboard

运维自动化平台Web管理界面

## 功能特性

- 📊 流程设计器 - 可视化拖拽式流程设计
- 📈 任务监控 - 实时任务状态监控
- 📝 日志查看 - 实时日志流查看
- 🔌 插件管理 - 插件安装、配置和管理
- ⚙️ 系统配置 - 环境配置、用户权限等

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 部署

构建后的静态文件位于 `dist` 目录，可以部署到任何静态文件服务器或CDN。

### Docker部署

```bash
docker build -t devops-dashboard .
docker run -p 3000:80 devops-dashboard
```

## 技术栈

- React 18
- TypeScript
- Ant Design
- Vite
- React Router
- Zustand
- React Flow

## 许可证

MIT

