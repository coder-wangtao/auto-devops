import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Modal, Descriptions, Card, Select, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FilterOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { applicationApi, appTypeApi } from '../services/api';

const { Option } = Select;
const { Search } = Input;

interface Application {
  id: string;
  name: string;
  description?: string;
  typeId: string;
  workflows: Array<{
    id: string;
    name: string;
    steps: Array<{ id: string; name: string; plugin: string }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface AppType {
  id: string;
  name: string;
}

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [appTypes, setAppTypes] = useState<AppType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(undefined);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    loadAppTypes();
    loadApplications();
  }, []);

  useEffect(() => {
    loadApplications();
  }, [selectedTypeId]);

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

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await applicationApi.getAll(selectedTypeId);
      if (response.success) {
        setApplications(response.data || []);
      }
    } catch (error) {
      message.error('加载应用失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个应用吗？',
      onOk: async () => {
        try {
          await applicationApi.delete(id);
          message.success('删除成功');
          loadApplications();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleViewDetail = async (application: Application) => {
    try {
      const workflowResponse = await applicationApi.getMergedWorkflow(application.id);
      if (workflowResponse.success) {
        const workflow = workflowResponse.data;
        setSelectedApplication({
          ...application,
          mergedWorkflow: workflow,
        });
        setDetailVisible(true);
      }
    } catch (error) {
      message.error('加载应用详情失败');
    }
  };

  const getAppTypeName = (typeId: string) => {
    const appType = appTypes.find((t) => t.id === typeId);
    return appType?.name || typeId;
  };

  const filteredApplications = applications.filter((app) => {
    if (searchKeyword) {
      return app.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
             app.description?.toLowerCase().includes(searchKeyword.toLowerCase());
    }
    return true;
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '应用类型',
      dataIndex: 'typeId',
      key: 'typeId',
      render: (typeId: string) => <Tag color="purple">{getAppTypeName(typeId)}</Tag>,
    },
    {
      title: '工作流数量',
      key: 'workflows',
      render: (_: unknown, record: Application) => (
        <Tag color="blue">{record.workflows?.length || 0}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_: unknown, record: Application) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Link to={`/applications/edit/${record.id}`}>
            <Button type="link" icon={<EditOutlined />}>
              编辑
            </Button>
          </Link>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>应用管理</h1>
        <Link to="/applications/create">
          <Button type="primary" icon={<PlusOutlined />}>
            创建应用
          </Button>
        </Link>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Select
          placeholder="筛选应用类型"
          allowClear
          style={{ width: 200 }}
          value={selectedTypeId}
          onChange={setSelectedTypeId}
        >
          {appTypes.map((type) => (
            <Option key={type.id} value={type.id}>
              {type.name}
            </Option>
          ))}
        </Select>
        <Search
          placeholder="搜索应用名称或描述"
          allowClear
          style={{ width: 300 }}
          onSearch={setSearchKeyword}
          onChange={(e) => !e.target.value && setSearchKeyword('')}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredApplications}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title="应用详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedApplication(null);
        }}
        footer={null}
        width={900}
      >
        {selectedApplication && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="ID">{selectedApplication.id}</Descriptions.Item>
              <Descriptions.Item label="名称">{selectedApplication.name}</Descriptions.Item>
              <Descriptions.Item label="描述">
                {selectedApplication.description || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="应用类型">
                <Tag color="purple">{getAppTypeName(selectedApplication.typeId)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedApplication.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(selectedApplication.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {(selectedApplication as any).mergedWorkflow && (
              <Card
                title="合并后的工作流"
                style={{ marginTop: 16 }}
              >
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="工作流名称">
                    {(selectedApplication as any).mergedWorkflow.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="步骤">
                    <div>
                      {(selectedApplication as any).mergedWorkflow.steps?.map((step: any, index: number) => (
                        <Tag
                          key={step.id}
                          color={step.source === 'type' ? 'red' : step.adjustable === false ? 'orange' : 'green'}
                          style={{ marginBottom: 8 }}
                        >
                          {index + 1}. {step.name} ({step.plugin}) -{' '}
                          {step.source === 'type'
                            ? '类型默认（不可删除）'
                            : step.adjustable === false
                            ? '不可微调'
                            : '可微调'}
                        </Tag>
                      ))}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Applications;
