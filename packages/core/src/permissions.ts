export const PERMISSION_ACTIONS = ['execute', 'list', 'read', 'write'] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PERMISSION_CONSENT_REQUIREMENTS = ['none', 'user'] as const;

export type PermissionConsentRequirement = (typeof PERMISSION_CONSENT_REQUIREMENTS)[number];

export interface PermissionRequest {
  readonly actions: readonly PermissionAction[];
  readonly reason?: string;
  readonly resource: string;
}

export interface PermissionGrant {
  readonly actions: readonly PermissionAction[];
  readonly resource: string;
}

export interface PermissionResourceDefinition {
  readonly actions: readonly PermissionAction[];
  readonly consent: PermissionConsentRequirement;
  readonly description: string;
  readonly id: string;
}

export interface GrantedPermissionAssessment {
  readonly actions: readonly PermissionAction[];
  readonly resource: string;
  readonly status: 'granted';
}

export interface DeniedPermissionAssessment {
  readonly actions: readonly PermissionAction[];
  readonly reason: 'missing-grant';
  readonly resource: string;
  readonly status: 'denied';
}

export interface UnavailablePermissionAssessment {
  readonly actions: readonly PermissionAction[];
  readonly reason: 'unknown-resource' | 'unsupported-action';
  readonly resource: string;
  readonly status: 'unavailable';
}

export type PermissionAssessment =
  DeniedPermissionAssessment | GrantedPermissionAssessment | UnavailablePermissionAssessment;

export const DEFAULT_PLUGIN_PERMISSION_RESOURCES = [
  {
    actions: ['read'],
    consent: 'user',
    description: 'Read ROM content selected by the user through the platform library.',
    id: 'library:rom-content',
  },
  {
    actions: ['read', 'write'],
    consent: 'none',
    description: 'Read and write isolated data owned by the plugin.',
    id: 'storage:plugin-data',
  },
  {
    actions: ['read', 'write'],
    consent: 'user',
    description: 'Read and write local game save data through the platform storage boundary.',
    id: 'storage:game-saves',
  },
  {
    actions: ['execute'],
    consent: 'user',
    description: 'Make outbound network requests through a future mediated network service.',
    id: 'network:outbound',
  },
  {
    actions: ['list', 'read'],
    consent: 'user',
    description: 'List and read normalized input device metadata through the input boundary.',
    id: 'input:devices',
  },
  {
    actions: ['execute'],
    consent: 'user',
    description: 'Invoke an explicitly configured external integration through the host.',
    id: 'integration:external',
  },
] as const satisfies readonly PermissionResourceDefinition[];

const includesAllActions = (
  availableActions: readonly PermissionAction[],
  requestedActions: readonly PermissionAction[],
): boolean => requestedActions.every((action) => availableActions.includes(action));

export const assessPermissionRequest = (
  request: PermissionRequest,
  grants: readonly PermissionGrant[],
  resources: readonly PermissionResourceDefinition[] = DEFAULT_PLUGIN_PERMISSION_RESOURCES,
): PermissionAssessment => {
  const resource = resources.find((candidate) => candidate.id === request.resource);

  if (resource === undefined) {
    return {
      actions: request.actions,
      reason: 'unknown-resource',
      resource: request.resource,
      status: 'unavailable',
    };
  }

  if (!includesAllActions(resource.actions, request.actions)) {
    return {
      actions: request.actions,
      reason: 'unsupported-action',
      resource: request.resource,
      status: 'unavailable',
    };
  }

  const grantedActions = grants
    .filter((grant) => grant.resource === request.resource)
    .flatMap((grant) => grant.actions);

  if (!includesAllActions(grantedActions, request.actions)) {
    return {
      actions: request.actions,
      reason: 'missing-grant',
      resource: request.resource,
      status: 'denied',
    };
  }

  return {
    actions: request.actions,
    resource: request.resource,
    status: 'granted',
  };
};
