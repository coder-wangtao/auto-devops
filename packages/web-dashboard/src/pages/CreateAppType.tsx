import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Space, Select } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { appTypeApi, pluginApi } from '../services/api';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

interface Plugin {
  name: string;
  version: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  plugin: string;
  config?: Record<string, unknown>;
  condition?: string;
  dependsOn?: string[];
}

const CreateAppType: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  useEffect(() => {
    loadPlugins();
    if (id) {
      loadAppType();
    }
  }, [id]);

  const loadPlugins = async () => {
    try {
      const response = await pluginApi.getAll();
      if (response.success) {
        setPlugins(response.data || []);
      }
    } catch (error) {
      message.error('加载插件失败');
    }
  };

  const loadAppType = async () => {
    setLoading(true);
    try {
      const response = await appTypeApi.get(id!);
      if (response.success) {
        const appType = response.data;
        form.setFieldsValue({
          name: appType.name,
          description: appType.description,
        });
        if (appType.defaultWorkflow) {
          setSteps(appType.defaultWorkflow.steps || []);
        }
      }
    } catch (error) {
      message.error('加载应用类型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: '',
      plugin: '',
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
  };

  const handleStepChange = (index: number, field: keyof WorkflowStep, value: unknown) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (steps.length === 0) {
        message.warning('请至少添加一个工作流步骤');
        return;
      }

      // 验证所有步骤都有名称和插件
      const invalidSteps = steps.filter((s) => !s.name || !s.plugin);
      if (invalidSteps.length > 0) {
        message.warning('请填写所有步骤的名称和插件');
        return;
      }

      const data = {
        ...values,
        defaultWorkflow: {
          name: `${values.name}默认工作流`,
          steps: steps.map((step) => ({
            id: step.id,
            name: step.name,
            plugin: step.plugin,
            config: step.config || {},
            condition: step.condition,
            dependsOn: step.dependsOn,
          })),
        },
      };

      setLoading(true);
      if (id) {
        await appTypeApi.update(id, data);
        message.success('更新成功');
      } else {
        await appTypeApi.create(data);
        message.success('创建成功');
      }
      navigate('/app-types');
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(id ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <h1>{id ? '编辑应用类型' : '创建应用类型'}</h1>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card title="基本信息" style={{ marginBottom: 16 }}>
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入应用类型名称' }]}
          >
            <Input placeholder="例如：桌面类应用" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="请输入应用类型描述" />
          </Form.Item>
        </Card>

        <Card
          title="默认工作流"
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddStep}>
              添加步骤
            </Button>
          }
        >
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <strong>提示：</strong>类型默认工作流中的插件在应用中不可修改
          </div>

          {steps.map((step, index) => (
            <Card
              key={step.id}
              type="inner"
              title={`步骤 ${index + 1}`}
              extra={
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveStep(index)}
                >
                  删除
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>步骤名称：</label>
                  <Input
                    value={step.name}
                    onChange={(e) => handleStepChange(index, 'name', e.target.value)}
                    placeholder="例如：代码拉取"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>插件：</label>
                  <Select
                    value={step.plugin}
                    onChange={(value) => handleStepChange(index, 'plugin', value)}
                    style={{ width: '100%' }}
                    placeholder="选择插件"
                  >
                    {plugins.map((plugin) => (
                      <Option key={plugin.name} value={plugin.name}>
                        {plugin.name} (v{plugin.version})
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>配置（JSON）：</label>
                  <TextArea
                    value={step.config ? JSON.stringify(step.config, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const config = e.target.value ? JSON.parse(e.target.value) : {};
                        handleStepChange(index, 'config', config);
                      } catch {
                        // 忽略 JSON 解析错误
                      }
                    }}
                    rows={4}
                    placeholder='{"key": "value"}'
                  />
                </div>
              </Space>
            </Card>
          ))}

          {steps.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              暂无步骤，请点击"添加步骤"按钮添加
            </div>
          )}
        </Card>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/app-types')}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {id ? '更新' : '创建'}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default CreateAppType;
