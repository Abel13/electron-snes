export const NORMALIZED_INPUT_ACTIONS = [
  'move-up',
  'move-down',
  'move-left',
  'move-right',
  'primary',
  'secondary',
  'left-shoulder',
  'right-shoulder',
  'start',
  'select',
] as const;

export type NormalizedInputAction = (typeof NORMALIZED_INPUT_ACTIONS)[number];

const normalizedInputActions = new Set<string>(NORMALIZED_INPUT_ACTIONS);

export const isNormalizedInputAction = (value: unknown): value is NormalizedInputAction =>
  typeof value === 'string' && normalizedInputActions.has(value);
