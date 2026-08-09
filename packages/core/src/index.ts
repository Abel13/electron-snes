export type { ConfigurationNamespace, ConfigurationStore } from './configuration.js';
export type { EventBus, EventEnvelope, EventHandler, JsonEventMap, Unsubscribe } from './events.js';
export type { LifecycleService, ServiceStatus } from './lifecycle.js';
export type { LogEntry, Logger, LogLevel } from './logging.js';
export {
  assessPermissionRequest,
  DEFAULT_PLUGIN_PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
  PERMISSION_CONSENT_REQUIREMENTS,
} from './permissions.js';
export type {
  DeniedPermissionAssessment,
  GrantedPermissionAssessment,
  PermissionAction,
  PermissionAssessment,
  PermissionConsentRequirement,
  PermissionGrant,
  PermissionRequest,
  PermissionResourceDefinition,
  UnavailablePermissionAssessment,
} from './permissions.js';
export { InMemoryRegistry } from './registry.js';
export type { Registry, RegistryEntry } from './registry.js';
export { err, ok } from './result.js';
export type { CoreError, CoreErrorCode, Err, Ok, Result } from './result.js';
export type {
  BinaryStorageDomain,
  BinaryStorageEntry,
  BinaryStoragePort,
  JsonStorageDomain,
  JsonStoragePort,
} from './storage.js';
