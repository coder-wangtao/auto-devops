import React, { useState, useEffect } from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Typography,
  Space,
  Timeline,
  Button,
  message,
  Card,
  Collapse,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { deploymentLogApi } from '../services/api';

const { Text, Paragraph } = Typography;

interface ExecutionResult {
  success: boolean;
  stepId: string;
  result?: unknown;
  error?: Error | string | { message?: string; name?: string; stack?: string };
}

interface WorkflowStep {
  id: string;
  name: string;
  plugin: string;
}

interface DeploymentLog {
  id: string;
  workflowId: string;
  workflowName: string;
  executionId: string;
  status: 'success' | 'failed' | 'running';
  createdAt: string;
  completedAt?: string;
  logs: Array<{
    timestamp: string;
    level: 'log' | 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: unknown;
  }>;
  results: ExecutionResult[];
  rollbackInfo?: {
    canRollback: boolean;
    rollbackWorkflowId?: string;
    previousDeploymentId?: string;
  };
}

interface ExecutionDetailProps {
  visible: boolean;
  onClose: () => void;
  workflowName: string;
  workflowId?: string;
  executionId?: string;
  steps: WorkflowStep[];
  results: ExecutionResult[];
}

const ExecutionDetail: React.FC<ExecutionDetailProps> = ({
  visible,
  onClose,
  workflowName,
  workflowId,
  executionId,
  steps,
  results,
}) => {
  const [deploymentLog, setDeploymentLog] = useState<DeploymentLog | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);

  // 创建步骤ID到步骤信息的映射
  const stepMap = new Map(steps.map(step => [step.id, step]));

  // 加载部署日志
  useEffect(() => {
    if (visible && executionId) {
      loadDeploymentLog();
    } else {
      setDeploymentLog(null);
    }
  }, [visible, executionId]);

  const loadDeploymentLog = async () => {
    if (!executionId) return;

    setLoadingLog(true);
    try {
      const response = await deploymentLogApi.getByExecutionId(executionId);
      if (response.success) {
        setDeploymentLog(response.data);
      }
    } catch (error) {
      // 如果找不到日志，不显示错误，因为可能是旧数据
      setDeploymentLog(null);
    } finally {
      setLoadingLog(false);
    }
  };

  const handleRollback = async () => {
    if (!deploymentLog || !deploymentLog.rollbackInfo?.canRollback) {
      message.warning('该部署无法回滚（可能部署失败或没有可回滚的版本）');
      return;
    }

    Modal.confirm({
      title: '确认回滚',
      content: `确定要回滚部署 "${workflowName}" 到上一个版本吗？`,
      onOk: async () => {
        setRollbackLoading(true);
        try {
          // 使用 rollback 方法，回滚到上一个版本
          const response = await deploymentLogApi.rollback(deploymentLog.id);
          if (response.success) {
            message.success('回滚成功');
            // 重新加载日志
            await loadDeploymentLog();
          } else {
            message.error(response.message || '回滚失败');
          }
        } catch (error) {
          message.error('回滚失败');
        } finally {
          setRollbackLoading(false);
        }
      },
    });
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

  // 格式化结果显示
  const formatResult = (result: unknown): string => {
    if (result === null || result === undefined) {
      return '无结果';
    }
    if (typeof result === 'string') {
      return result;
    }
    if (typeof result === 'object') {
      try {
        return JSON.stringify(result, null, 2);
      } catch {
        return String(result);
      }
    }
    return String(result);
  };

  // 格式化错误信息
  const formatError = (
    error: Error | string | { message?: string; name?: string; stack?: string } | undefined
  ): string => {
    if (!error) return '';
    if (typeof error === 'string') return error;
    if (error instanceof Error) {
      return error.message || String(error);
    }
    // 处理序列化后的错误对象
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as { message?: string; name?: string; stack?: string };
      if (errorObj.message) {
        return errorObj.message;
      }
      if (errorObj.name) {
        return `${errorObj.name}: ${errorObj.message || '未知错误'}`;
      }
    }
    return String(error);
  };

  // 计算总体状态
  const allSuccess = results.every(r => r.success);
  const hasError = results.some(r => !r.success);

  return (
    <Modal
      title={`执行详情 - ${workflowName}`}
      open={visible}
      onCancel={onClose}
      footer={(() => {
        // 判断是否是回滚记录（executionId 以 rollback_ 开头）
        const isRollbackRecord = deploymentLog?.executionId?.startsWith('rollback_');
        // 只有非回滚记录且可以回滚时才显示按钮
        if (deploymentLog?.rollbackInfo?.canRollback && !isRollbackRecord) {
          return (
            <Button
              type="primary"
              danger
              icon={<RollbackOutlined />}
              loading={rollbackLoading}
              onClick={handleRollback}
            >
              回滚到上一个版本
            </Button>
          );
        }
        return null;
      })()}
      width={1000}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 总体状态 */}
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="工作流名称">{workflowName}</Descriptions.Item>
          <Descriptions.Item label="总体状态">
            {allSuccess ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                全部成功
              </Tag>
            ) : hasError ? (
              <Tag color="error" icon={<CloseCircleOutlined />}>
                执行失败
              </Tag>
            ) : (
              <Tag color="processing" icon={<ClockCircleOutlined />}>
                执行中
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="总步骤数">{steps.length}</Descriptions.Item>
          <Descriptions.Item label="成功步骤">
            {results.filter(r => r.success).length} / {results.length}
          </Descriptions.Item>
          {deploymentLog && (
            <>
              <Descriptions.Item label="部署时间">
                {new Date(deploymentLog.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="日志条数">{deploymentLog.logs.length}</Descriptions.Item>
            </>
          )}
        </Descriptions>

        {/* 步骤执行详情 */}
        <div>
          <h3>步骤执行详情</h3>
          <Timeline>
            {results.map((result, index) => {
              const step = stepMap.get(result.stepId);
              const stepName = step?.name || result.stepId;
              const pluginName = step?.plugin || '未知插件';

              return (
                <Timeline.Item
                  key={result.stepId}
                  color={result.success ? 'green' : 'red'}
                  dot={
                    result.success ? (
                      <CheckCircleOutlined style={{ fontSize: '16px' }} />
                    ) : (
                      <CloseCircleOutlined style={{ fontSize: '16px' }} />
                    )
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text strong>
                        步骤 {index + 1}: {stepName}
                      </Text>
                      <Tag style={{ marginLeft: 8 }}>{pluginName}</Tag>
                      <Tag color={result.success ? 'success' : 'error'}>
                        {result.success ? '成功' : '失败'}
                      </Tag>
                    </div>
                    {result.success && result.result && (
                      <div style={{ marginLeft: 24 }}>
                        <Text type="secondary">执行结果：</Text>
                        <Paragraph
                          copyable
                          style={{
                            marginTop: 4,
                            padding: 8,
                            background: '#f5f5f5',
                            borderRadius: 4,
                            maxHeight: 200,
                            overflow: 'auto',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {formatResult(result.result)}
                        </Paragraph>
                      </div>
                    )}
                    {!result.success && result.error && (
                      <div style={{ marginLeft: 24 }}>
                        <Text type="danger">错误信息：</Text>
                        <Paragraph
                          style={{
                            marginTop: 4,
                            padding: 8,
                            background: '#fff1f0',
                            borderRadius: 4,
                            color: '#cf1322',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {formatError(result.error)}
                        </Paragraph>
                      </div>
                    )}
                  </Space>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </div>

        {/* 控制台日志 - 放在流程下面，默认收起 */}
        {deploymentLog && deploymentLog.logs.length > 0 && (
          <Collapse
            items={[
              {
                key: 'logs',
                label: `控制台日志 (${deploymentLog.logs.length} 条)`,
                children: (
                  <div
                    style={{
                      maxHeight: '300px',
                      overflow: 'auto',
                      background: '#1e1e1e',
                      color: '#d4d4d4',
                      padding: '12px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  >
                    {deploymentLog.logs.map((log, index) => (
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
                    ))}
                  </div>
                ),
              },
            ]}
            defaultActiveKey={[]}
          />
        )}
      </Space>
    </Modal>
  );
};

export default ExecutionDetail;
