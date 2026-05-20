import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  message,
  Modal,
  Descriptions,
  Button,
  Space,
  Table,
  Input,
  Form,
} from 'antd';
import {
  AppstoreOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { pluginApi } from '../services/api';

const { TextArea } = Input;

interface Plugin {
  name: string;
  version: string;
}

interface PluginDetailProps {
  visible: boolean;
  plugin: Plugin | null;
  onClose: () => void;
  onTest: (pluginName: string, config: Record<string, unknown>) => void;
}

const PluginDetail: React.FC<PluginDetailProps> = ({ visible, plugin, onClose, onTest }) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (!plugin) return;

    try {
      const values = await form.validateFields();
      let config: Record<string, unknown> = {};

      // 处理配置：如果是字符串则解析，否则直接使用
      if (values.config) {
        if (typeof values.config === 'string') {
          const trimmed = values.config.trim();
          if (trimmed) {
            config = JSON.parse(trimmed);
          }
        } else {
          config = values.config;
        }
      }

      setTesting(true);
      await onTest(plugin.name, config);
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证失败
        message.error('请检查表单输入');
      } else if (error.message && error.message.includes('JSON')) {
        message.error('配置格式错误，请输入有效的JSON');
      } else {
        message.error('执行失败');
      }
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (visible && plugin) {
      form.resetFields();
    }
  }, [visible, plugin, form]);

  if (!plugin) return null;

  return (
    <Modal
      title={`插件详情 - ${plugin.name}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="插件名称">{plugin.name}</Descriptions.Item>
          <Descriptions.Item label="版本">
            <Tag color="blue">v{plugin.version}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color="success">已注册</Tag>
          </Descriptions.Item>
        </Descriptions>

        <div>
          <h3>测试执行</h3>
          <Form form={form} layout="vertical">
            <Form.Item
              label="配置参数 (JSON)"
              name="config"
              tooltip='插件的配置参数，JSON格式，例如: {"action": "pull", "repository": "https://github.com/example/repo.git"}'
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.trim() === '') {
                      return Promise.resolve();
                    }
                    try {
                      JSON.parse(value);
                      return Promise.resolve();
                    } catch {
                      return Promise.reject(new Error('请输入有效的JSON格式'));
                    }
                  },
                },
              ]}
            >
              <TextArea rows={6} placeholder='{"key": "value"}' />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleTest}
                loading={testing}
              >
                执行测试
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Space>
    </Modal>
  );
};

const Plugins: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const response = await pluginApi.getAll();
      if (response.success) {
        setPlugins(response.data || []);
      }
    } catch (error) {
      message.error('加载插件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setDetailVisible(true);
  };

  const handleTestPlugin = async (pluginName: string, config: Record<string, unknown>) => {
    try {
      const response = await pluginApi.execute(pluginName, config) as any;
      if (response.success) {
        const result = response.data;
        if (result?.success) {
          message.success(`插件执行成功: ${result.message || '执行完成'}`);
        } else {
          message.error(`插件执行失败: ${result?.message || '未知错误'}`);
        }
      } else {
        message.error(`插件执行失败: ${response.message || '未知错误'}`);
      }
    } catch (error: any) {
      message.error(
        `插件执行失败: ${error?.response?.data?.message || error.message || '未知错误'}`
      );
    }
  };

  // 获取插件显示名称（简化长名称）
  const getDisplayName = (name: string) => {
    // 如果是 @devops-automation/plugin-xxx 格式，提取 plugin-xxx 部分
    const match = name.match(/plugin-([\w-]+)$/);
    if (match) {
      return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return name;
  };

  // 获取插件类型标签
  const getPluginType = (name: string) => {
    if (name.includes('git')) return { color: 'orange', text: 'Git' };
    if (name.includes('docker')) return { color: 'blue', text: 'Docker' };
    if (name.includes('k8s') || name.includes('kubernetes'))
      return { color: 'purple', text: 'K8s' };
    if (name.includes('test')) return { color: 'green', text: '测试' };
    if (name.includes('deploy')) return { color: 'red', text: '部署' };
    return { color: 'default', text: '其他' };
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>插件管理</h1>
        <Button icon={<ReloadOutlined />} onClick={loadPlugins} loading={loading}>
          刷新
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {plugins.map(plugin => {
          const displayName = getDisplayName(plugin.name);
          const typeInfo = getPluginType(plugin.name);

          return (
            <Col xs={24} sm={12} md={8} lg={6} key={plugin.name}>
              <Card
                loading={loading}
                hoverable
                actions={[
                  <Button
                    type="link"
                    icon={<InfoCircleOutlined />}
                    onClick={() => handleViewDetail(plugin)}
                  >
                    详情
                  </Button>,
                ]}
              >
                <Card.Meta
                  avatar={<AppstoreOutlined style={{ fontSize: '24px' }} />}
                  title={
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{displayName}</div>
                      <div style={{ fontSize: '12px', color: '#999', wordBreak: 'break-all' }}>
                        {plugin.name}
                      </div>
                    </div>
                  }
                  description={
                    <Space>
                      <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
                      <Tag color="blue">v{plugin.version}</Tag>
                    </Space>
                  }
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      {plugins.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>暂无插件</p>
          <Button onClick={loadPlugins}>刷新</Button>
        </div>
      )}

      <PluginDetail
        visible={detailVisible}
        plugin={selectedPlugin}
        onClose={() => {
          setDetailVisible(false);
          setSelectedPlugin(null);
        }}
        onTest={handleTestPlugin}
      />
    </div>
  );
};

export default Plugins;
