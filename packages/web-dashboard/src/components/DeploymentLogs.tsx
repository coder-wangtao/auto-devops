import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  Typography,
  Space,
  Card,
  message,
  Select,
  Radio,
  Row,
  Col,
} from 'antd';
import {
  RollbackOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { deploymentLogApi, workflowApi } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

const { Text, Paragraph } = Typography;

interface DeploymentLogEntry {
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
}

interface DeploymentLog {
  id: string;
  workflowId: string;
  workflowName: string;
  executionId: string;
  status: 'success' | 'failed' | 'running';
  createdAt: string;
  completedAt?: string;
  logs: DeploymentLogEntry[];
  results: unknown[];
  rollbackInfo?: {
    canRollback: boolean;
    rollbackWorkflowId?: string;
    previousDeploymentId?: string;
  };
}

interface DeploymentLogsProps {
  workflowId?: string;
}

interface Workflow {
  id: string;
  name: string;
}

const DeploymentLogs: React.FC<DeploymentLogsProps> = ({ workflowId: initialWorkflowId }) => {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DeploymentLog | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState<string | null>(null);

  // 筛选状态
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | undefined>(
    initialWorkflowId
  );
  const [operationType, setOperationType] = useState<'all' | 'deployment' | 'rollback'>('all');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    loadWorkflows();
    loadLogs();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [selectedWorkflowId, operationType]);

  const loadWorkflows = async () => {
    try {
      const response = await workflowApi.getAll();
      if (response.success) {
        setWorkflows(response.data || []);
      }
    } catch (error) {
      console.error('加载工作流失败', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await deploymentLogApi.getAll(selectedWorkflowId, operationType);
      if (response.success) {
        setLogs(response.data || []);
      }
    } catch (error) {
      message.error('加载部署日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (log: DeploymentLog) => {
    setSelectedLog(log);
    setDetailVisible(true);
  };

  const handleRollback = async (log: DeploymentLog) => {
    // 只有成功的部署才能回滚
    if (log.status !== 'success') {
      message.warning('只能回滚成功的部署版本');
      return;
    }

    Modal.confirm({
      title: '确认回滚',
      content: `确定要回滚到部署 "${log.workflowName}" (${new Date(log.createdAt).toLocaleString('zh-CN')}) 吗？`,
      onOk: async () => {
        setRollbackLoading(log.id);
        try {
          // 使用 rollbackTo 方法，回滚到指定的部署记录（用于列表中的回滚）
          const response = await deploymentLogApi.rollbackTo(log.id);
          if (response.success) {
            message.success('回滚成功');
            loadLogs();
          } else {
            message.error(response.message || '回滚失败');
          }
        } catch (error) {
          message.error('回滚失败');
        } finally {
          setRollbackLoading(null);
        }
      },
    });
  };

  const handleRollbackToPrevious = async (log: DeploymentLog) => {
    if (!log.rollbackInfo?.canRollback) {
      message.warning('该部署无法回滚（可能部署失败或没有可回滚的版本）');
      return;
    }

    Modal.confirm({
      title: '确认回滚',
      content: `确定要回滚部署 "${log.workflowName}" 到上一个版本吗？`,
      onOk: async () => {
        setRollbackLoading(log.id);
        try {
          // 使用 rollback 方法，回滚到上一个版本（用于详情弹窗中的回滚）
          const response = await deploymentLogApi.rollback(log.id);
          if (response.success) {
            message.success('回滚成功');
            loadLogs();
            // 如果当前查看的详情就是被回滚的记录，关闭详情弹窗
            if (selectedLog?.id === log.id) {
              setDetailVisible(false);
            }
          } else {
            message.error(response.message || '回滚失败');
          }
        } catch (error) {
          message.error('回滚失败');
        } finally {
          setRollbackLoading(null);
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            成功
          </Tag>
        );
      case 'failed':
        return (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            失败
          </Tag>
        );
      case 'running':
        return (
          <Tag color="processing" icon={<ClockCircleOutlined />}>
            运行中
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'red';
      case 'warn':
        return 'orange';
      case 'info':
        return 'blue';
      case 'debug':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<DeploymentLog> = [
    {
      title: '部署ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (text: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {text.substring(0, 20)}...
        </Text>
      ),
    },
    {
      title: '工作流名称',
      dataIndex: 'workflowName',
      key: 'workflowName',
    },
    {
      title: '操作类型',
      key: 'operationType',
      width: 100,
      render: (_: unknown, record: DeploymentLog) => {
        const isRollback = record.executionId?.startsWith('rollback_');
        return isRollback ? <Tag color="orange">回滚</Tag> : <Tag color="blue">部署</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '部署时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => formatDate(text),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '日志条数',
      dataIndex: 'logs',
      key: 'logs',
      width: 100,
      render: (logs: DeploymentLogEntry[]) => logs.length,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: DeploymentLog) => {
        // 判断是否是回滚记录（executionId 以 rollback_ 开头）
        const isRollbackRecord = record.executionId?.startsWith('rollback_');

        return (
          <Space>
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
              查看详情
            </Button>
            {record.status === 'success' && !isRollbackRecord && (
              <Button
                type="link"
                danger
                icon={<RollbackOutlined />}
                loading={rollbackLoading === record.id}
                onClick={() => handleRollback(record)}
              >
                回滚到此版本
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {/* 筛选条件 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: 8 }}>工作流：</span>
            <Select
              style={{ width: 200 }}
              placeholder="全部工作流"
              allowClear
              value={selectedWorkflowId}
              onChange={value => setSelectedWorkflowId(value)}
            >
              {workflows.map(workflow => (
                <Option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <span style={{ marginRight: 8 }}>操作类型：</span>
            <Radio.Group value={operationType} onChange={e => setOperationType(e.target.value)}>
              <Radio.Button value="all">全部</Radio.Button>
              <Radio.Button value="deployment">部署</Radio.Button>
              <Radio.Button value="rollback">回滚</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: total => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title={`部署日志详情 - ${selectedLog?.workflowName}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedLog && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="部署ID">{selectedLog.id}</Descriptions.Item>
              <Descriptions.Item label="工作流名称">{selectedLog.workflowName}</Descriptions.Item>
              <Descriptions.Item label="执行ID">{selectedLog.executionId}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedLog.status)}</Descriptions.Item>
              <Descriptions.Item label="部署时间">
                {formatDate(selectedLog.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {selectedLog.completedAt ? formatDate(selectedLog.completedAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="日志条数">{selectedLog.logs.length}</Descriptions.Item>
              <Descriptions.Item label="步骤数">{selectedLog.results.length}</Descriptions.Item>
            </Descriptions>

            <Card title="控制台日志" size="small">
              <div
                style={{
                  maxHeight: '400px',
                  overflow: 'auto',
                  background: '#1e1e1e',
                  color: '#d4d4d4',
                  padding: '12px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                {selectedLog.logs.length === 0 ? (
                  <Text type="secondary">暂无日志</Text>
                ) : (
                  selectedLog.logs.map((log, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      <Tag color={getLogLevelColor(log.level)} style={{ marginRight: '8px' }}>
                        {log.level.toUpperCase()}
                      </Tag>
                      <Text style={{ color: '#d4d4d4' }}>
                        [{new Date(log.timestamp).toLocaleString('zh-CN')}] {log.message}
                      </Text>
                      {log.data && (
                        <div style={{ marginLeft: '60px', marginTop: '4px', color: '#858585' }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {selectedLog.rollbackInfo?.canRollback &&
              !selectedLog.executionId?.startsWith('rollback_') && (
                <div style={{ textAlign: 'right' }}>
                  <Button
                    type="primary"
                    danger
                    icon={<RollbackOutlined />}
                    loading={rollbackLoading === selectedLog.id}
                    onClick={() => handleRollbackToPrevious(selectedLog)}
                  >
                    回滚到上一个版本
                  </Button>
                </div>
              )}
          </Space>
        )}
      </Modal>
    </>
  );
};

export default DeploymentLogs;
