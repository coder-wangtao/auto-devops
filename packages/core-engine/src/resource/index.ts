/**
 * 资源管理器
 * @module resource
 */

/**
 * 资源定义
 */
export interface Resource {
  id: string;
  type: string;
  name: string;
  status: 'available' | 'allocated' | 'released';
  metadata?: Record<string, unknown>;
}

/**
 * 资源池配置
 */
export interface ResourcePoolOptions {
  maxResources?: number;
  autoCleanup?: boolean;
  cleanupInterval?: number;
}

/**
 * 创建资源管理器
 */
export function createResourceManager(options: ResourcePoolOptions = {}) {
  const { maxResources = 100, autoCleanup = true, cleanupInterval = 60000 } = options;

  const resources: Map<string, Resource> = new Map();
  let cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * 注册资源
   */
  function registerResource(resource: Resource): boolean {
    if (resources.size >= maxResources) {
      return false;
    }
    resources.set(resource.id, resource);
    return true;
  }

  /**
   * 分配资源
   */
  function allocateResource(type: string, name?: string): Resource | null {
    for (const resource of resources.values()) {
      if (
        resource.type === type &&
        resource.status === 'available' &&
        (!name || resource.name === name)
      ) {
        resource.status = 'allocated';
        return resource;
      }
    }
    return null;
  }

  /**
   * 释放资源
   */
  function releaseResource(id: string): boolean {
    const resource = resources.get(id);
    if (resource && resource.status === 'allocated') {
      resource.status = 'released';
      if (autoCleanup) {
        setTimeout(() => {
          resources.delete(id);
        }, cleanupInterval);
      }
      return true;
    }
    return false;
  }

  /**
   * 获取资源
   */
  function getResource(id: string): Resource | undefined {
    return resources.get(id);
  }

  /**
   * 获取所有资源
   */
  function getAllResources(): Resource[] {
    return Array.from(resources.values());
  }

  /**
   * 获取可用资源
   */
  function getAvailableResources(type?: string): Resource[] {
    return Array.from(resources.values()).filter(
      r => r.status === 'available' && (!type || r.type === type)
    );
  }

  /**
   * 清理资源
   */
  function cleanupResources(): number {
    let cleaned = 0;
    for (const [id, resource] of resources.entries()) {
      if (resource.status === 'released') {
        resources.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  /**
   * 启动自动清理
   */
  function startAutoCleanup(): void {
    if (cleanupTimer) return;
    cleanupTimer = setInterval(() => {
      cleanupResources();
    }, cleanupInterval);
  }

  /**
   * 停止自动清理
   */
  function stopAutoCleanup(): void {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }

  /**
   * 销毁资源管理器
   */
  function destroy(): void {
    stopAutoCleanup();
    resources.clear();
  }

  return {
    registerResource,
    allocateResource,
    releaseResource,
    getResource,
    getAllResources,
    getAvailableResources,
    cleanupResources,
    startAutoCleanup,
    stopAutoCleanup,
    destroy,
  };
}
