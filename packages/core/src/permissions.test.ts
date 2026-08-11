import { expect, expectTypeOf, test } from 'vitest';

import {
  assessPermissionRequest,
  DEFAULT_PLUGIN_PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
} from './permissions.js';
import type {
  PermissionAction,
  PermissionGrant,
  PermissionResourceDefinition,
} from './permissions.js';

test('grants a request only when every action has an explicit matching grant', () => {
  const assessment = assessPermissionRequest(
    { actions: ['read', 'write'], resource: 'storage:plugin-data' },
    [
      { actions: ['read'], resource: 'storage:plugin-data' },
      { actions: ['write'], resource: 'storage:plugin-data' },
    ],
  );

  expect(assessment).toEqual({
    actions: ['read', 'write'],
    resource: 'storage:plugin-data',
    status: 'granted',
  });
});

test('denies a supported request with missing or partial grants', () => {
  const assessment = assessPermissionRequest(
    { actions: ['read', 'write'], resource: 'storage:plugin-data' },
    [{ actions: ['read'], resource: 'storage:plugin-data' }],
  );

  expect(assessment).toEqual({
    actions: ['read', 'write'],
    reason: 'missing-grant',
    resource: 'storage:plugin-data',
    status: 'denied',
  });
});

test('marks unknown resources and unsupported actions as unavailable', () => {
  expect(
    assessPermissionRequest({ actions: ['read'], resource: 'filesystem:root' }, [
      { actions: ['read'], resource: 'filesystem:root' },
    ]),
  ).toMatchObject({ reason: 'unknown-resource', status: 'unavailable' });

  expect(
    assessPermissionRequest({ actions: ['write'], resource: 'library:rom-content' }, [
      { actions: ['write'], resource: 'library:rom-content' },
    ]),
  ).toMatchObject({ reason: 'unsupported-action', status: 'unavailable' });
});

test('assesses multiple independent resource requests without mutating their inputs', () => {
  const requests = [
    { actions: ['read'], resource: 'library:rom-content' },
    { actions: ['execute'], resource: 'network:outbound' },
  ] as const;
  const grants = [
    { actions: ['read'], resource: 'library:rom-content' },
    { actions: ['execute'], resource: 'network:outbound' },
  ] as const;

  const assessments = requests.map((request) => assessPermissionRequest(request, grants));

  expect(assessments.map((assessment) => assessment.status)).toEqual(['granted', 'granted']);
  expect(requests).toEqual([
    { actions: ['read'], resource: 'library:rom-content' },
    { actions: ['execute'], resource: 'network:outbound' },
  ]);
  expect(grants).toEqual([
    { actions: ['read'], resource: 'library:rom-content' },
    { actions: ['execute'], resource: 'network:outbound' },
  ]);
});

test('keeps action definitions connected to every permission contract', () => {
  expect(DEFAULT_PLUGIN_PERMISSION_RESOURCES).toHaveLength(6);
  expectTypeOf<(typeof PERMISSION_ACTIONS)[number]>().toEqualTypeOf<PermissionAction>();
  expectTypeOf<PermissionGrant['actions']>().toEqualTypeOf<readonly PermissionAction[]>();
  expectTypeOf<PermissionResourceDefinition['actions']>().toEqualTypeOf<
    readonly PermissionAction[]
  >();
});
