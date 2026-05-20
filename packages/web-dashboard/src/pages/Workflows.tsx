import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Modal } from 'antd';
import { PlusOutlined, PlayCircleOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { workflowApi } from '../services/api';
import ExecutionDetail from '../components/ExecutionDetail';

interface Workflow {
  id: string;
  name: string;
  steps: Array<{ id: string; name: string; plugin: string }>;
  level?: 'type' | 'application';
  applicationId?: string;
}

interface ExecutionResult {
  success: boolean;
  stepId: string;
  result?: unknown;
  error?: Error | string | { message?: string; name?: string; stack?: string };
}

const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [executionVisible, setExecutionVisible] = useState(false);
  const [executionData, setExecutionData] = useState<{
    workflowName: string;
    workflowId: string;
    executionId?: string;
    steps: Workflow['steps'];
    results: ExecutionResult[];
  } | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const response = await workflowApi.getAll();
      if (response.success) {
        setWorkflows(response.data || []);
      }
    } catch (error) {
      message.error('加载工作流失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (id: string) => {
    try {
      const workflow = workflows.find((w) => w.id === id);
      if (!workflow) {
        message.error('工作流不存在');
        return;
      }

      const response = await workflowApi.execute(id);
      if (response.success) {
        // 显示执行详情
        setExecutionData({
          workflowName: workflow.name,
          workflowId: id,
          executionId: response.executionId,
          steps: workflow.steps,
          results: response.data || [],
        });
        setExecutionVisible(true);
        
        // 检查是否有失败的步骤
        const hasError = (response.data || []).some((r: ExecutionResult) => !r.success);
        if (hasError) {
          message.warning('工作流执行完成，但有步骤失败');
        } else {
          message.success('工作流执行成功');
        }
      }
    } catch (error) {
      message.error('执行失败');
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个工作流吗？',
      onOk: async () => {
        try {
          await workflowApi.delete(id);
          message.success('删除成功');
          loadWorkflows();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
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
      title: '类型',
      key: 'level',
      render: (_: unknown, record: Workflow) => {
        if (record.level === 'application') {
          return <Tag color="purple">应用工作流</Tag>;
        }
        if (record.level === 'type') {
          return <Tag color="blue">类型工作流</Tag>;
        }
        return <Tag>独立工作流</Tag>;
      },
    },
    {
      title: '步骤数',
      dataIndex: 'steps',
      key: 'steps',
      render: (steps: Array<unknown>) => steps?.length || 0,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Workflow) => (
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleExecute(record.id)}
          >
            执行
          </Button>
          {record.level === 'application' ? (
            <Link to={`/applications/edit/${record.applicationId}`}>
              <Button icon={<EditOutlined />}>
                编辑应用
              </Button>
            </Link>
          ) : (
            <>
              <Link to={`/workflows/edit/${record.id}`}>
                <Button icon={<EditOutlined />}>
                  编辑
                </Button>
              </Link>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>工作流管理</h1>
        <Link to="/workflows/create">
          <Button type="primary" icon={<PlusOutlined />}>
            创建工作流
          </Button>
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={workflows}
        loading={loading}
        rowKey="id"
      />

      {executionData && (
        <ExecutionDetail
          visible={executionVisible}
          onClose={() => {
            setExecutionVisible(false);
            setExecutionData(null);
          }}
          workflowName={executionData.workflowName}
          workflowId={executionData.workflowId}
          executionId={executionData.executionId}
          steps={executionData.steps}
          results={executionData.results}
        />
      )}
    </div>
  );
};

export default Workflows;

