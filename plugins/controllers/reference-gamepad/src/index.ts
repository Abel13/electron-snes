import { defineController } from '@platform/controller-sdk';

export const referenceGamepad = defineController({
  controller: {
    id: 'org.pixelcore.example.reference-gamepad',
    mappings: [
      { input: { index: 12, kind: 'button' }, normalizedAction: 'move-up' },
      { input: { index: 13, kind: 'button' }, normalizedAction: 'move-down' },
      { input: { index: 14, kind: 'button' }, normalizedAction: 'move-left' },
      { input: { index: 15, kind: 'button' }, normalizedAction: 'move-right' },
      { input: { index: 0, kind: 'button' }, normalizedAction: 'primary' },
      { input: { index: 1, kind: 'button' }, normalizedAction: 'secondary' },
      { input: { index: 9, kind: 'button' }, normalizedAction: 'start' },
      { input: { index: 8, kind: 'button' }, normalizedAction: 'select' },
    ],
    match: [{ nameIncludes: ['Reference Gamepad'], standardMapping: true }],
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['gamepad-mapping'],
    id: 'org.pixelcore.example.reference-gamepad',
    name: 'Reference Gamepad',
    permissions: [],
    type: 'controller',
    version: '1.0.0',
  },
});
