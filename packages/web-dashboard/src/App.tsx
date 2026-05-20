import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  HomeOutlined,
  ApiOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  FolderOutlined,
  AppstoreAddOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import Home from './pages/Home';
import Workflows from './pages/Workflows';
import CreateWorkflow from './pages/CreateWorkflow';
import Plugins from './pages/Plugins';
import Dashboard from './pages/Dashboard';
import AppTypes from './pages/AppTypes';
import CreateAppType from './pages/CreateAppType';
import Applications from './pages/Applications';
import CreateApplication from './pages/CreateApplication';
import DeploymentLogs from './pages/DeploymentLogs';
import './index.css';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider collapsible>
            <div
              style={{
                height: '32px',
                margin: '16px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
              }}
            >
              运维自动化
            </div>
            <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
              <Menu.Item key="1" icon={<HomeOutlined />}>
                <Link to="/">首页</Link>
              </Menu.Item>
              <Menu.Item key="2" icon={<FolderOutlined />}>
                <Link to="/app-types">应用类型</Link>
              </Menu.Item>
              <Menu.Item key="3" icon={<AppstoreAddOutlined />}>
                <Link to="/applications">应用</Link>
              </Menu.Item>
              <Menu.Item key="4" icon={<ApiOutlined />}>
                <Link to="/workflows">工作流</Link>
              </Menu.Item>
              <Menu.Item key="5" icon={<AppstoreOutlined />}>
                <Link to="/plugins">插件</Link>
              </Menu.Item>
              <Menu.Item key="6" icon={<DashboardOutlined />}>
                <Link to="/dashboard">仪表盘</Link>
              </Menu.Item>
              <Menu.Item key="7" icon={<FileTextOutlined />}>
                <Link to="/deployment-logs">部署日志</Link>
              </Menu.Item>
            </Menu>
          </Sider>
          <Layout>
            <Header style={{ background: '#fff', padding: '0 24px' }}>
              <h2 style={{ margin: 0 }}>运维自动化平台</h2>
            </Header>
            <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/app-types" element={<AppTypes />} />
                <Route path="/app-types/create" element={<CreateAppType />} />
                <Route path="/app-types/edit/:id" element={<CreateAppType />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/applications/create" element={<CreateApplication />} />
                <Route path="/applications/edit/:id" element={<CreateApplication />} />
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/workflows/create" element={<CreateWorkflow />} />
                <Route path="/workflows/edit/:id" element={<CreateWorkflow />} />
                <Route path="/plugins" element={<Plugins />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/deployment-logs" element={<DeploymentLogs />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
