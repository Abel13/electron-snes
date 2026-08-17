export const CONTROL_DIAGRAM_CONSOLE_SLOTS = [
  'left-01',
  'left-02',
  'left-03',
  'left-04',
  'left-05',
  'left-06',
  'left-07',
  'left-08',
  'left-09',
  'left-10',
  'left-11',
  'left-12',
  'right-01',
  'right-02',
  'right-03',
  'right-04',
  'right-05',
  'right-06',
  'right-07',
  'right-08',
  'right-09',
  'right-10',
  'right-11',
  'right-12',
] as const;

export const CONTROL_DIAGRAM_SYSTEM_SLOTS = ['system-right-01', 'system-right-02'] as const;

export type ControlDiagramConsoleSlot = (typeof CONTROL_DIAGRAM_CONSOLE_SLOTS)[number];
export type ControlDiagramSystemSlot = (typeof CONTROL_DIAGRAM_SYSTEM_SLOTS)[number];
export type ControlDiagramSlot = ControlDiagramConsoleSlot | ControlDiagramSystemSlot;

export const isControlDiagramConsoleSlot = (value: unknown): value is ControlDiagramConsoleSlot =>
  typeof value === 'string' && (CONTROL_DIAGRAM_CONSOLE_SLOTS as readonly string[]).includes(value);
