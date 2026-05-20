import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Space, Select, Checkbox, Tag, Popover } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationApi, appTypeApi, pluginApi } from '../services/api';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

interface Plugin {
  name: string;
  version: string;
}

interface AppType {
  id: string;
  name: string;
  defaultWorkflow?: {
    id: string;
    name: string;
    steps: Array<{ id: string; name: string; plugin: string }>;
  };
}

interface WorkflowStep {
  id: string;
  name: string;
  plugin: string;
  config?: Record<string, unknown>;
  condition?: string;
  dependsOn?: string[];
  adjustable?: boolean;
  source?: 'type' | 'application';
  insertAfter?: string;
}

const CreateApplication: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [appTypes, setAppTypes] = useState<AppType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedAppType, setSelectedAppType] = useState<AppType | null>(null);
  const [mergedSteps, setMergedSteps] = useState<WorkflowStep[]>([]);
  const [customSteps, setCustomSteps] = useState<Array<{ step: WorkflowStep; insertAfter?: string }>>([]);

  useEffect(() => {
    loadPlugins();
    loadAppTypes();
    if (id) {
      loadApplication();
    }
  }, [id]);

  useEffect(() => {
    if (selectedTypeId) {
      const appType = appTypes.find((t) => t.id === selectedTypeId);
      setSelectedAppType(appType || null);
      form.setFieldsValue({ typeId: selectedTypeId });
      updateMergedSteps();
    }
  }, [selectedTypeId, appTypes]);

  useEffect(() => {
    updateMergedSteps();
  }, [customSteps, selectedAppType]);

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

  const loadAppTypes = async () => {
    try {
      const response = await appTypeApi.getAll();
      if (response.success) {
        setAppTypes(response.data || []);
      }
    } catch (error) {
      message.error('加载应用类型失败');
    }
  };

  const loadApplication = async () => {
    setLoading(true);
    try {
      const response = await applicationApi.get(id!);
      if (response.success) {
        const application = response.data;
        form.setFieldsValue({
          name: application.name,
          description: application.description,
          typeId: application.typeId,
          workflowName: application.workflowName,
          gitServerType: application.gitServerType,
          projectName: application.projectName,
        });
        setSelectedTypeId(application.typeId);
        
        // 加载合并后的工作流
        const workflowResponse = await applicationApi.getMergedWorkflow(id!);
        if (workflowResponse.success) {
          const workflow = workflowResponse.data;
          const allSteps = workflow.steps || [];
          setMergedSteps(allSteps);
          
          // 提取自定义步骤，保持它们在合并工作流中的顺序
          // 需要根据它们在合并工作流中的位置来确定 insertAfter
          const custom: Array<{ step: WorkflowStep; insertAfter?: string }> = [];
          
          for (let i = 0; i < allSteps.length; i++) {
            const step = allSteps[i] as WorkflowStep;
            if (step.source === 'application') {
              // 找到这个自定义步骤前面的最后一个类型步骤
              let insertAfter: string | undefined = undefined;
              for (let j = i - 1; j >= 0; j--) {
                const prevStep = allSteps[j] as WorkflowStep;
                if (prevStep.source === 'type') {
                  insertAfter = prevStep.id;
                  break;
                }
              }
              
              custom.push({
                step: {
                  id: step.id,
                  name: step.name,
                  plugin: step.plugin,
                  config: step.config,
                  condition: step.condition,
                  dependsOn: step.dependsOn,
                  adjustable: step.adjustable,
                },
                insertAfter: insertAfter || undefined,
              });
            }
          }
          
          setCustomSteps(custom);
        }
      }
    } catch (error) {
      message.error('加载应用失败');
    } finally {
      setLoading(false);
    }
  };

  const updateMergedSteps = () => {
    if (!selectedAppType?.defaultWorkflow) {
      setMergedSteps([]);
      return;
    }

    const typeSteps = selectedAppType.defaultWorkflow.steps.map((step) => ({
      ...step,
      source: 'type' as const,
      adjustable: undefined,
    }));

    // 合并步骤 - 保持自定义步骤的顺序
    const result: WorkflowStep[] = [];
    
    // 按 insertAfter 分组，但保持每个组内的顺序
    const insertionsByPosition = new Map<string | 'end', Array<typeof customSteps[0]>>();
    
    customSteps.forEach((custom) => {
      const position = custom.insertAfter || 'end';
      if (!insertionsByPosition.has(position)) {
        insertionsByPosition.set(position, []);
      }
      insertionsByPosition.get(position)!.push(custom);
    });

    // 合并类型步骤和自定义步骤
    for (let i = 0; i < typeSteps.length; i++) {
      const typeStep = typeSteps[i];
      result.push(typeStep);

      // 检查是否有需要在此步骤后插入的自定义步骤
      // 保持它们在 customSteps 数组中的顺序
      const insertions = insertionsByPosition.get(typeStep.id) || [];
      insertions.forEach((insertion) => {
        result.push({
          ...insertion.step,
          source: 'application',
          insertAfter: typeStep.id,
        });
      });
    }

    // 处理插入到最后的步骤，保持顺序
    const endInsertions = insertionsByPosition.get('end') || [];
    endInsertions.forEach((insertion) => {
      result.push({
        ...insertion.step,
        source: 'application',
        insertAfter: undefined,
      });
    });

    setMergedSteps(result);
  };

  const handleAddStep = (insertAfter?: string) => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      plugin: '',
      adjustable: true,
      source: 'application',
      insertAfter,
    };
    
    setCustomSteps([...customSteps, { step: newStep, insertAfter }]);
  };

  const handleRemoveStep = (stepId: string) => {
    setCustomSteps(customSteps.filter((cs) => cs.step.id !== stepId));
  };

  const handleStepChange = (stepId: string, field: keyof WorkflowStep, value: unknown) => {
    const newCustomSteps = customSteps.map((cs) => {
      if (cs.step.id === stepId) {
        return {
          ...cs,
          step: { ...cs.step, [field]: value },
        };
      }
      return cs;
    });
    setCustomSteps(newCustomSteps);
  };

  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    const stepIndex = mergedSteps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) return;

    const step = mergedSteps[stepIndex];
    if (step.source === 'type') {
      message.warning('类型默认步骤不能移动');
      return;
    }

    let targetIndex: number;
    if (direction === 'up') {
      if (stepIndex === 0) return; // 已经在最前面
      targetIndex = stepIndex - 1;
    } else {
      if (stepIndex === mergedSteps.length - 1) return; // 已经在最后面
      targetIndex = stepIndex + 1;
    }

    const targetStep = mergedSteps[targetIndex];
    
    // 如果目标位置是类型步骤，不能交换位置
    // 只能改变 insertAfter，但自定义步骤不能移动到类型步骤之前
    if (targetStep.source === 'type') {
      if (direction === 'up') {
        // 向上移动：如果前一个步骤是类型步骤，说明已经在类型步骤之后了，不能再上移
        message.warning('自定义步骤不能移动到类型步骤之前');
        return;
      } else {
        // 向下移动：移动到目标类型步骤之后
        const newCustomSteps = customSteps.map((cs) => {
          if (cs.step.id === stepId) {
            return {
              ...cs,
              insertAfter: targetStep.id,
            };
          }
          return cs;
        });
        setCustomSteps(newCustomSteps);
        return;
      }
    }
    
    // 如果目标位置是自定义步骤，可以交换位置
    // 创建新的 mergedSteps，交换两个步骤的位置
    const newMergedSteps = [...mergedSteps];
    [newMergedSteps[stepIndex], newMergedSteps[targetIndex]] = [
      newMergedSteps[targetIndex],
      newMergedSteps[stepIndex],
    ];

    // 从新的 mergedSteps 中重新提取 customSteps，保持顺序
    const newCustomSteps: Array<{ step: WorkflowStep; insertAfter?: string }> = [];
    
    for (let i = 0; i < newMergedSteps.length; i++) {
      const mergedStep = newMergedSteps[i] as WorkflowStep;
      if (mergedStep.source === 'application') {
        // 找到这个自定义步骤前面的最后一个类型步骤
        let insertAfter: string | undefined = undefined;
        for (let j = i - 1; j >= 0; j--) {
          const prevStep = newMergedSteps[j] as WorkflowStep;
          if (prevStep.source === 'type') {
            insertAfter = prevStep.id;
            break;
          }
        }
        
        // 找到原来的 customStep 数据
        const originalCustomStep = customSteps.find((cs) => cs.step.id === mergedStep.id);
        if (originalCustomStep) {
          newCustomSteps.push({
            step: {
              id: mergedStep.id,
              name: mergedStep.name,
              plugin: mergedStep.plugin,
              config: mergedStep.config,
              condition: mergedStep.condition,
              dependsOn: mergedStep.dependsOn,
              adjustable: mergedStep.adjustable,
            },
            insertAfter: insertAfter || undefined,
          });
        }
      }
    }

    setCustomSteps(newCustomSteps);
    setMergedSteps(newMergedSteps);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!values.typeId) {
        message.warning('请选择应用类型');
        return;
      }

      // 验证所有自定义步骤都有名称和插件
      const invalidSteps = customSteps.filter((cs) => !cs.step.name || !cs.step.plugin);
      if (invalidSteps.length > 0) {
        message.warning('请填写所有步骤的名称和插件');
        return;
      }

      // 按照合并后的步骤顺序提取自定义步骤，确保顺序正确
      const orderedCustomSteps: Array<{ step: WorkflowStep; insertAfter?: string }> = [];
      for (const mergedStep of mergedSteps) {
        if (mergedStep.source === 'application') {
          const customStep = customSteps.find((cs) => cs.step.id === mergedStep.id);
          if (customStep) {
            orderedCustomSteps.push(customStep);
          }
        }
      }

      const data = {
        ...values,
        customSteps: orderedCustomSteps.map((cs) => ({
          step: {
            id: cs.step.id,
            name: cs.step.name,
            plugin: cs.step.plugin,
            config: cs.step.config || {},
            condition: cs.step.condition,
            dependsOn: cs.step.dependsOn,
            adjustable: cs.step.adjustable !== false,
          },
          insertAfter: cs.insertAfter,
        })),
      };

      setLoading(true);
      if (id) {
        await applicationApi.update(id, data);
        message.success('更新成功');
      } else {
        await applicationApi.create(data);
        message.success('创建成功');
      }
      navigate('/applications');
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
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <h1>{id ? '编辑应用' : '创建应用'}</h1>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card title="基本信息" style={{ marginBottom: 16 }}>
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <Input placeholder="例如：我的桌面应用" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="请输入应用描述" />
          </Form.Item>

          <Form.Item
            label="应用类型"
            name="typeId"
            rules={[{ required: true, message: '请选择应用类型' }]}
          >
            <Select
              placeholder="选择应用类型"
              onChange={setSelectedTypeId}
              disabled={!!id}
            >
              {appTypes.map((type) => (
                <Option key={type.id} value={type.id}>
                  {type.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="工作流名称" name="workflowName">
            <Input placeholder="例如：部署工作流" />
          </Form.Item>

          <Form.Item
            label="Git 服务器类型"
            name="gitServerType"
            rules={[{ required: true, message: '请选择 Git 服务器类型' }]}
          >
            <Select placeholder="选择 Git 服务器类型">
              <Option value="github">GitHub</Option>
              <Option value="gitlab">GitLab</Option>
              <Option value="custom">自定义 Git 服务器</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="项目名称"
            name="projectName"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          {selectedAppType?.defaultWorkflow && (
            <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 4 }}>
              <strong>类型默认工作流：</strong>
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {selectedAppType.defaultWorkflow.name}
              </Tag>
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                包含 {selectedAppType.defaultWorkflow.steps?.length || 0} 个步骤（不可删除，但可在任意位置插入自定义步骤）
              </div>
            </div>
          )}
        </Card>

        <Card
          title="工作流步骤"
          extra={
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => handleAddStep()}
              disabled={!selectedAppType?.defaultWorkflow}
            >
              添加步骤（最后）
            </Button>
          }
        >
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <strong>提示：</strong>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>红色标签的步骤来自类型默认工作流，不可删除</li>
              <li>绿色标签的步骤是应用自定义步骤，可以删除</li>
              <li>可以在任意类型步骤之后插入自定义步骤</li>
              <li>应用自定义步骤可以设置是否可微调</li>
            </ul>
          </div>

          {mergedSteps.map((step, index) => (
            <Card
              key={step.id}
              type="inner"
              title={
                <Space>
                  <span>步骤 {index + 1}</span>
                  {step.source === 'type' ? (
                    <Tag color="red">类型默认（不可删除）</Tag>
                  ) : (
                    <Tag color="green">应用自定义</Tag>
                  )}
                  {step.adjustable === false && (
                    <Tag color="orange">不可微调</Tag>
                  )}
                </Space>
              }
              extra={
                <Space>
                  {step.source === 'application' && (
                    <>
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={
                          index === 0 || 
                          (index > 0 && mergedSteps[index - 1]?.source === 'type')
                        }
                        onClick={() => handleMoveStep(step.id, 'up')}
                      >
                        上移
                      </Button>
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === mergedSteps.length - 1}
                        onClick={() => handleMoveStep(step.id, 'down')}
                      >
                        下移
                      </Button>
                      <Popover
                        content={
                          <Button
                            type="link"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              handleAddStep(step.id);
                            }}
                          >
                            在此步骤后插入
                          </Button>
                        }
                        title="插入步骤"
                        trigger="click"
                      >
                        <Button size="small" icon={<PlusOutlined />}>
                          插入
                        </Button>
                      </Popover>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveStep(step.id)}
                      >
                        删除
                      </Button>
                    </>
                  )}
                  {step.source === 'type' && (
                    <Popover
                      content={
                        <Button
                          type="link"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            handleAddStep(step.id);
                          }}
                        >
                          在此步骤后插入
                        </Button>
                      }
                      title="插入步骤"
                      trigger="click"
                    >
                      <Button size="small" icon={<PlusOutlined />}>
                        插入
                      </Button>
                    </Popover>
                  )}
                </Space>
              }
              style={{ marginBottom: 12 }}
            >
              {step.source === 'type' ? (
                <div>
                  <div><strong>步骤名称：</strong>{step.name}</div>
                  <div style={{ marginTop: 8 }}><strong>插件：</strong>{step.plugin}</div>
                  {step.config && (
                    <div style={{ marginTop: 8 }}>
                      <strong>配置：</strong>
                      <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                        {JSON.stringify(step.config, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>步骤名称：</label>
                    <Input
                      value={step.name}
                      onChange={(e) => handleStepChange(step.id, 'name', e.target.value)}
                      placeholder="例如：构建应用"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>插件：</label>
                    <Select
                      value={step.plugin}
                      onChange={(value) => handleStepChange(step.id, 'plugin', value)}
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
                          handleStepChange(step.id, 'config', config);
                        } catch {
                          // 忽略 JSON 解析错误
                        }
                      }}
                      rows={4}
                      placeholder='{"key": "value"}'
                    />
                  </div>

                  <div>
                    <Checkbox
                      checked={step.adjustable !== false}
                      onChange={(e) => handleStepChange(step.id, 'adjustable', e.target.checked)}
                    >
                      可微调（取消勾选后，该插件在具体工作流中不能操作）
                    </Checkbox>
                  </div>
                </Space>
              )}
            </Card>
          ))}

          {mergedSteps.length === 0 && selectedAppType?.defaultWorkflow && (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              暂无步骤，请点击"添加步骤"按钮添加自定义步骤
            </div>
          )}

          {!selectedAppType?.defaultWorkflow && (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              请先选择应用类型
            </div>
          )}
        </Card>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/applications')}>
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

export default CreateApplication;
