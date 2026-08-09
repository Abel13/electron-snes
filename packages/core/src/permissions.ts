export const PERMISSION_ACTIONS = ['execute', 'list', 'read', 'write'] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export interface PermissionRequest {
  readonly actions: readonly PermissionAction[];
  readonly reason?: string;
  readonly resource: string;
}
