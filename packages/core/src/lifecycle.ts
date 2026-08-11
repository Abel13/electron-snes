import type { Result } from './result.js';

export type ServiceStatus = 'failed' | 'idle' | 'running' | 'starting' | 'stopped' | 'stopping';

export interface LifecycleService {
  getStatus(): Promise<Result<ServiceStatus>>;
  start(): Promise<Result<void>>;
  stop(): Promise<Result<void>>;
}
