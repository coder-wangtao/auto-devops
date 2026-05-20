import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import {
  ApiOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { workflowApi, schedulerApi, pluginApi } from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    workflows: 0,
    plugins: 0,
    running: 0,
    success: 0,
  });
  const [schedulerStatus, setSchedulerStatus] = useState({
    queueLength: 0,
    runningTasks: 0,
    maxConcurrency: 0,
  });

  useEffect(() => {
    loadStats();
    loadSchedulerStatus();
  }, []);

  const loadStats = async () => {
    try {
      const workflowsRes = await workflowApi.getAll();
      const pluginsRes = await pluginApi.getAll();
      if (workflowsRes.success) {
        setStats(prev => ({
          ...prev,
          workflows: workflowsRes.data?.length || 0,
        }));
      }
      if (pluginsRes.success) {
        setStats(prev => ({
          ...prev,
          plugins: pluginsRes.data?.length || 0,
        }));
      }
    } catch (error) {
      console.error('加载统计失败', error);
    }
  };

  const loadSchedulerStatus = async () => {
    try {
      const response = await schedulerApi.getStatus();
      if (response.success) {
        setSchedulerStatus(response.data);
        setStats(prev => ({
          ...prev,
          running: response.data.runningTasks,
        }));
      }
    } catch (error) {
      console.error('加载调度器状态失败', error);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>仪表盘</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="工作流总数" value={stats.workflows} prefix={<ApiOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="已注册插件" value={stats.plugins} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="运行中任务" value={stats.running} prefix={<PlayCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="成功执行" value={stats.success} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="调度器状态">
            <p>队列长度: {schedulerStatus.queueLength}</p>
            <p>运行中任务: {schedulerStatus.runningTasks}</p>
            <p>最大并发数: {schedulerStatus.maxConcurrency}</p>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="系统信息">
            <p>
              API服务: <Tag color="green">运行中</Tag>
            </p>
            <p>
              前端服务: <Tag color="green">运行中</Tag>
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
