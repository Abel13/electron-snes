export type PermissionAction = 'execute' | 'list' | 'read' | 'write';

export interface PermissionRequest {
  readonly actions: readonly PermissionAction[];
  readonly reason?: string;
  readonly resource: string;
}
