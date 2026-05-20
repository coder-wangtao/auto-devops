import React from 'react';
import DeploymentLogsComponent from '../components/DeploymentLogs';

const DeploymentLogs: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1>部署日志</h1>
      </div>
      <DeploymentLogsComponent />
    </div>
  );
};

export default DeploymentLogs;
