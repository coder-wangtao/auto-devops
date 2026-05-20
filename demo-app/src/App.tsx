import React from 'react';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 演示应用</h1>
        <p>这是一个由 DevOps 自动化平台部署的 React 演示应用</p>
      </header>
      <main className="app-main">
        <div className="card">
          <h2>应用信息</h2>
          <ul>
            <li><strong>应用名称:</strong> 演示应用</li>
            <li><strong>框架:</strong> React 18</li>
            <li><strong>构建工具:</strong> Vite</li>
            <li><strong>端口:</strong> 3010</li>
            <li><strong>状态:</strong> <span className="status-running">运行中</span></li>
          </ul>
        </div>
        <div className="card">
          <h2>部署信息</h2>
          <ul>
            <li><strong>部署时间:</strong> {new Date().toLocaleString('zh-CN')}</li>
            <li><strong>工作流:</strong> simple-deploy</li>
            <li><strong>环境:</strong> 开发环境</li>
          </ul>
        </div>
        <div className="card">
          <h2>功能特性</h2>
          <ul>
            <li>✅ React 18 最新特性</li>
            <li>✅ TypeScript 支持</li>
            <li>✅ Vite 快速构建</li>
            <li>✅ 响应式设计</li>
          </ul>
        </div>
      </main>
      <footer className="app-footer">
        <p>Powered by DevOps Automation Platform</p>
      </footer>
    </div>
  );
};

export default App;
