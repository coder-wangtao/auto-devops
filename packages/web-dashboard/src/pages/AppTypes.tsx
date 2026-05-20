import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Modal, Descriptions, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { appTypeApi } from '../services/api';

interface AppType {
  id: string;
  name: string;
  description?: string;
  defaultWorkflow?: {
    id: string;
    name: string;
    steps: Array<{ id: string; name: string; plugin: string }>;
  };
  createdAt: string;
  updatedAt: string;
}

const AppTypes: React.FC = () => {
  const [appTypes, setAppTypes] = useState<AppType[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAppType, setSelectedAppType] = useState<AppType | null>(null);

  useEffect(() => {
    loadAppTypes();
  }, []);

  const loadAppTypes = async () => {
    setLoading(true);
    try {
      const response = await appTypeApi.getAll();
      if (response.success) {
        setAppTypes(response.data || []);
      }
    } catch (error) {
      message.error('加载应用类型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个应用类型吗？删除后，该类型下的应用将无法使用默认工作流。',
      onOk: async () => {
        try {
          await appTypeApi.delete(id);
          message.success('删除成功');
          loadAppTypes();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleViewDetail = (appType: AppType) => {
    setSelectedAppType(appType);
    setDetailVisible(true);
  };

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
      title: '默认工作流',
      key: 'defaultWorkflow',
      render: (_: unknown, record: AppType) => {
        if (record.defaultWorkflow) {
          return (
            <Tag color="blue">
              {record.defaultWorkflow.name} ({record.defaultWorkflow.steps?.length || 0} 步)
            </Tag>
          );
        }
        return <Tag>未配置</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: AppType) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Link to={`/app-types/edit/${record.id}`}>
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
        <h1>应用类型管理</h1>
        <Link to="/app-types/create">
          <Button type="primary" icon={<PlusOutlined />}>
            创建应用类型
          </Button>
        </Link>
      </div>

      <Table columns={columns} dataSource={appTypes} loading={loading} rowKey="id" />

      <Modal
        title="应用类型详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedAppType(null);
        }}
        footer={null}
        width={800}
      >
        {selectedAppType && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="ID">{selectedAppType.id}</Descriptions.Item>
              <Descriptions.Item label="名称">{selectedAppType.name}</Descriptions.Item>
              <Descriptions.Item label="描述">
                {selectedAppType.description || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedAppType.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(selectedAppType.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {selectedAppType.defaultWorkflow && (
              <Card title="默认工作流" style={{ marginTop: 16 }}>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="工作流名称">
                    {selectedAppType.defaultWorkflow.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="步骤">
                    <div>
                      {selectedAppType.defaultWorkflow.steps?.map((step, index) => (
                        <Tag key={step.id} color="blue" style={{ marginBottom: 8 }}>
                          {index + 1}. {step.name} ({step.plugin})
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

export default AppTypes;
