/**
 * API服务
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const workflowApi = {
  getAll: () => api.get('/workflows'),
  get: (id: string) => api.get(`/workflows/${id}`),
  create: (data: unknown) => api.post('/workflows', data),
  update: (id: string, data: unknown) => api.put(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
  execute: (id: string, context?: Record<string, unknown>) =>
    api.post(`/workflows/${id}/execute`, { context }),
  getExecutions: (id: string) => api.get(`/workflows/${id}/executions`),
};

export const pluginApi = {
  getAll: () => api.get('/plugins'),
  get: (name: string) => api.get(`/plugins/${name}`),
  register: (data: unknown) => api.post('/plugins', data),
  execute: (name: string, config: Record<string, unknown>, context?: Record<string, unknown>) =>
    api.post(`/plugins/${name}/execute`, { config, context }),
};

export const schedulerApi = {
  getStatus: () => api.get('/scheduler/status'),
};

export const appTypeApi = {
  getAll: () => api.get('/app-types'),
  get: (id: string) => api.get(`/app-types/${id}`),
  create: (data: unknown) => api.post('/app-types', data),
  update: (id: string, data: unknown) => api.put(`/app-types/${id}`, data),
  delete: (id: string) => api.delete(`/app-types/${id}`),
};

export const applicationApi = {
  getAll: (typeId?: string) => {
    const params = typeId ? { typeId } : {};
    return api.get('/applications', { params });
  },
  get: (id: string) => api.get(`/applications/${id}`),
  create: (data: unknown) => api.post('/applications', data),
  update: (id: string, data: unknown) => api.put(`/applications/${id}`, data),
  delete: (id: string) => api.delete(`/applications/${id}`),
  getWorkflows: (id: string) => api.get(`/applications/${id}/workflows`),
  getMergedWorkflows: (id: string) => api.get(`/applications/${id}/workflows/merged`),
  getMergedWorkflow: (id: string) => api.get(`/applications/${id}/workflow/merged`),
  canModifyPlugin: (applicationId: string, workflowId: string, stepId: string) =>
    api.get(`/applications/${applicationId}/workflows/${workflowId}/steps/${stepId}/can-modify`),
};

export const deploymentLogApi = {
  getAll: (workflowId?: string, operationType?: 'all' | 'deployment' | 'rollback') => {
    const params: Record<string, string> = {};
    if (workflowId) {
      params.workflowId = workflowId;
    }
    if (operationType) {
      params.operationType = operationType;
    }
    return api.get('/deployment-logs', { params });
  },
  get: (id: string) => api.get(`/deployment-logs/${id}`),
  getByExecutionId: (executionId: string) => api.get(`/deployment-logs/execution/${executionId}`),
  rollback: (id: string) => api.post(`/deployment-logs/${id}/rollback`),
  rollbackTo: (id: string) => api.post(`/deployment-logs/${id}/rollback-to`),
};

export default api;

