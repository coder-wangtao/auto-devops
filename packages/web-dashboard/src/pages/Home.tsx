import React from 'react';
import { Card, Row, Col, Statistic, Button } from 'antd';
import { Link } from 'react-router-dom';
import {
  ApiOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const Home: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>运维自动化平台</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="工作流总数" value={0} prefix={<ApiOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="已注册插件" value={5} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="运行中任务" value={0} prefix={<PlayCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="成功执行" value={0} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="快速开始" extra={<Link to="/workflows">查看全部</Link>}>
            <p>创建您的工作流，自动化您的部署流程</p>
            <Link to="/workflows/create">
              <Button type="primary">创建工作流</Button>
            </Link>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="插件管理" extra={<Link to="/plugins">查看全部</Link>}>
            <p>管理您的插件，扩展平台功能</p>
            <Link to="/plugins">
              <Button>查看插件</Button>
            </Link>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
