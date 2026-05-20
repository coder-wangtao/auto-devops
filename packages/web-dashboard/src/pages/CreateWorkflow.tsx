import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  message,
  Select,
  InputNumber,
  Popconfirm,
  Divider,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { workflowApi, pluginApi } from '../services/api';

const { TextArea } = Input;

interface WorkflowStep {
  id: string;
  name: string;
  plugin: string;
  config?: Record<string, unknown>;
  condition?: string;
  dependsOn?: string[];
}

interface Plugin {
  name: string;
  version: string;
}

const CreateWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [form] = Form.useForm();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);

  useEffect(() => {
    loadPlugins();
    if (isEditMode && id) {
      loadWorkflow(id);
    }
  }, [id, isEditMode]);

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

  const loadWorkflow = async (workflowId: string) => {
    setLoadingWorkflow(true);
    try {
      const response = await workflowApi.get(workflowId);
      if (response.success && response.data) {
        const workflow = response.data;
        
        // 检查是否是应用工作流
        if (workflow.level === 'application' && workflow.applicationId) {
          message.warning('这是应用工作流，请到应用管理页面进行编辑');
          navigate(`/applications/edit/${workflow.applicationId}`);
          return;
        }
        
        // 格式化步骤数据，确保 config 是对象格式
        const formattedSteps = workflow.steps.map((step: any) => ({
          ...step,
          config: step.config || {},
        }));
        
        // 检查是否是应用工作流
        if ((workflow as any).level === 'application' && (workflow as any).applicationId) {
          message.warning('这是应用工作流，请到应用管理页面进行编辑');
          navigate(`/applications/edit/${(workflow as any).applicationId}`);
          return;
        }
        
        form.setFieldsValue({
          id: workflow.id,
          name: workflow.name,
          steps: formattedSteps.length > 0 ? formattedSteps : [
            {
              id: 'step1',
              name: '',
              plugin: '',
            },
          ],
        });
      } else {
        message.error('加载工作流失败');
        navigate('/workflows');
      }
    } catch (error) {
      message.error('加载工作流失败');
      navigate('/workflows');
    } finally {
      setLoadingWorkflow(false);
    }
  };

  const handleSubmit = async (values: {
    id: string;
    name: string;
    steps: WorkflowStep[];
  }) => {
    setSubmitting(true);
    try {
      const workflow = {
        id: values.id,
        name: values.name,
        steps: values.steps.map((step) => {
          const stepData: any = {
            id: step.id,
            name: step.name,
            plugin: step.plugin,
          };
          
          // 只有当配置存在且不为空时才添加
          if (step.config && Object.keys(step.config).length > 0) {
            stepData.config = step.config;
          }
          
          // 只有当条件存在时才添加
          if (step.condition && step.condition.trim()) {
            stepData.condition = step.condition.trim();
          }
          
          // 只有当依赖存在时才添加
          if (step.dependsOn && step.dependsOn.length > 0) {
            stepData.dependsOn = step.dependsOn;
          }
          
          return stepData;
        }),
      };

      if (isEditMode && id) {
        // 编辑模式：更新工作流
        // 再次检查是否是应用工作流（防止直接通过URL访问）
        try {
          const currentWorkflow = await workflowApi.get(id);
          if (currentWorkflow.success && currentWorkflow.data) {
            const wf = currentWorkflow.data as any;
            if (wf.level === 'application' && wf.applicationId) {
              message.warning('这是应用工作流，请到应用管理页面进行编辑');
              navigate(`/applications/edit/${wf.applicationId}`);
              return;
            }
          }
        } catch (error) {
          // 忽略检查错误，继续更新
        }
        
        const response = await workflowApi.update(id, workflow);
        if (response.success) {
          message.success('工作流更新成功');
          navigate('/workflows');
        }
      } else {
        // 创建模式：创建工作流
        const response = await workflowApi.create(workflow);
        if (response.success) {
          message.success('工作流创建成功');
          navigate('/workflows');
        }
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
        (isEditMode ? '更新工作流失败' : '创建工作流失败')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space style={{ marginBottom: '24px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/workflows')}>
          返回
        </Button>
        <h1 style={{ margin: 0 }}>{isEditMode ? '编辑工作流' : '创建工作流'}</h1>
      </Space>

      {loadingWorkflow ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>加载中...</p>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            steps: [
              {
                id: 'step1',
                name: '',
                plugin: '',
              },
            ],
          }}
        >
        <Card title="基本信息" style={{ marginBottom: '24px' }}>
          <Form.Item
            label="工作流ID"
            name="id"
            rules={[
              { required: true, message: '请输入工作流ID' },
              { pattern: /^[a-z0-9-]+$/, message: 'ID只能包含小写字母、数字和连字符' },
            ]}
          >
            <Input placeholder="例如: my-workflow" disabled={isEditMode} />
          </Form.Item>

          <Form.Item
            label="工作流名称"
            name="name"
            rules={[{ required: true, message: '请输入工作流名称' }]}
          >
            <Input placeholder="例如: 部署流程" />
          </Form.Item>
        </Card>

        <Card
          title="工作流步骤"
        >
          <Form.List name="steps">
            {(fields, { add, remove }) => (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const steps = form.getFieldValue('steps') || [];
                      const newStepId = `step${steps.length + 1}`;
                      add({
                        id: newStepId,
                        name: '',
                        plugin: '',
                      });
                    }}
                  >
                    添加步骤
                  </Button>
                </div>
                {fields.map((field, index) => {
                  const currentSteps = form.getFieldValue('steps') || [];
                  const availableDeps = currentSteps
                    .slice(0, index)
                    .map((step: WorkflowStep) => step.id);

                  return (
                    <Card
                      key={field.key}
                      size="small"
                      style={{ marginBottom: '16px' }}
                      title={
                        <Space>
                          <span>步骤 {index + 1}</span>
                          {fields.length > 1 && (
                            <Popconfirm
                              title="确定要删除这个步骤吗？"
                              onConfirm={() => remove(field.name)}
                            >
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                              >
                                删除
                              </Button>
                            </Popconfirm>
                          )}
                        </Space>
                      }
                    >
                      <Form.Item
                        label="步骤ID"
                        name={[field.name, 'id']}
                        rules={[
                          { required: true, message: '请输入步骤ID' },
                          { pattern: /^[a-z0-9-]+$/, message: 'ID只能包含小写字母、数字和连字符' },
                        ]}
                      >
                        <Input placeholder="例如: step1" />
                      </Form.Item>

                      <Form.Item
                        label="步骤名称"
                        name={[field.name, 'name']}
                        rules={[{ required: true, message: '请输入步骤名称' }]}
                      >
                        <Input placeholder="例如: 拉取代码" />
                      </Form.Item>

                      <Form.Item
                        label="插件"
                        name={[field.name, 'plugin']}
                        rules={[{ required: true, message: '请选择插件' }]}
                      >
                        <Select
                          placeholder="请选择插件"
                          loading={loading}
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          options={plugins.map((plugin) => ({
                            label: plugin.name,
                            value: plugin.name,
                          }))}
                        />
                      </Form.Item>

                      <Form.Item
                        label="插件配置 (JSON)"
                        name={[field.name, 'config']}
                        tooltip='插件的配置参数，JSON格式，例如: {"action": "pull", "repository": "https://github.com/example/repo.git"}'
                        getValueFromEvent={(e) => {
                          const value = e.target.value.trim();
                          if (!value) return undefined;
                          try {
                            return JSON.parse(value);
                          } catch {
                            return value;
                          }
                        }}
                        getValueProps={(value) => {
                          if (!value) return { value: '' };
                          if (typeof value === 'string') return { value };
                          return { value: JSON.stringify(value, null, 2) };
                        }}
                      >
                        <TextArea
                          rows={4}
                          placeholder='{"key": "value"}'
                        />
                      </Form.Item>

                      <Form.Item
                        label="依赖步骤"
                        name={[field.name, 'dependsOn']}
                        tooltip="选择此步骤依赖的其他步骤ID"
                      >
                        <Select
                          mode="multiple"
                          placeholder="选择依赖的步骤"
                          options={availableDeps.map((depId: string) => ({
                            label: depId,
                            value: depId,
                          }))}
                        />
                      </Form.Item>

                      <Form.Item
                        label="执行条件"
                        name={[field.name, 'condition']}
                        tooltip="步骤的执行条件表达式（可选）"
                      >
                        <Input placeholder={'例如: ${env} === \'production\''} />
                      </Form.Item>
                    </Card>
                  );
                })}

                {fields.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>暂无步骤，请添加步骤</p>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        add({
                          id: 'step1',
                          name: '',
                          plugin: '',
                        });
                      }}
                    >
                      添加步骤
                    </Button>
                  </div>
                )}
              </>
            )}
          </Form.List>
        </Card>

        <Divider />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEditMode ? '更新工作流' : '创建工作流'}
            </Button>
            <Button onClick={() => navigate('/workflows')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
      )}
    </div>
  );
};

export default CreateWorkflow;

