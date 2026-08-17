import { describe, expect, it, vi } from 'vitest';

import { MgbaWorkerSession } from './mgba-session.js';
import type { MgbaWorkerMessage, MgbaWorkerRequest } from './mgba-worker-protocol.js';

class FakeWorker {
  readonly requests: MgbaWorkerRequest[] = [];
  terminated = false;
  private messageListener: ((message: MgbaWorkerMessage) => void) | undefined;
  private errorListener: ((error: Error) => void) | undefined;
  private exitListener: ((code: number) => void) | undefined;

  on(event: 'message' | 'error' | 'exit', listener: never): void {
    if (event === 'message')
      this.messageListener = listener as (message: MgbaWorkerMessage) => void;
    if (event === 'error') this.errorListener = listener as (error: Error) => void;
    if (event === 'exit') this.exitListener = listener as (code: number) => void;
  }

  postMessage(message: MgbaWorkerRequest): void {
    this.requests.push(message);
  }

  async terminate(): Promise<number> {
    this.terminated = true;
    this.exitListener?.(1);
    return 1;
  }

  emit(message: MgbaWorkerMessage): void {
    this.messageListener?.(message);
  }

  fail(error = new Error('failed')): void {
    this.errorListener?.(error);
  }

  exit(code: number): void {
    this.exitListener?.(code);
  }
}

describe('MgbaWorkerSession', () => {
  it('settles pending work when the worker exits cleanly and rejects subsequent requests', async () => {
    const worker = new FakeWorker();
    const session = new MgbaWorkerSession(worker);
    const start = session.start();

    worker.exit(0);

    await expect(start).resolves.toMatchObject({ code: 'unexpected', status: 'error' });
    await expect(session.pause()).resolves.toMatchObject({ code: 'unexpected', status: 'error' });
  });

  it('settles pending work on worker failures', async () => {
    const worker = new FakeWorker();
    const session = new MgbaWorkerSession(worker);
    const request = session.start();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    worker.fail();

    await expect(request).resolves.toMatchObject({ code: 'unexpected', status: 'error' });
    error.mockRestore();
  });

  it('copies save-state bytes before transferring them to the worker', async () => {
    const worker = new FakeWorker();
    const session = new MgbaWorkerSession(worker);
    const original = new Uint8Array([1, 2, 3]);
    const restored = session.restoreSaveState({
      bytes: original,
      coreId: 'org.pixelcore.mgba',
      formatVersion: 1,
    });
    const request = worker.requests[0];
    if (request?.type !== 'restore-save-state') throw new Error('Expected a restore request.');

    expect(request.saveState.bytes).not.toBe(original);
    expect(original).toEqual(new Uint8Array([1, 2, 3]));
    worker.emit({ id: request.id, result: { status: 'ok' }, status: 'running', type: 'result' });
    await expect(restored).resolves.toEqual({ status: 'ok' });
  });

  it('terminates the worker even when stop returns an error', async () => {
    const worker = new FakeWorker();
    const session = new MgbaWorkerSession(worker);
    const stopped = session.stop();
    const request = worker.requests[0];
    if (request?.type !== 'stop') throw new Error('Expected a stop request.');

    worker.emit({
      id: request.id,
      result: { code: 'unexpected', message: 'stop failed', status: 'error' },
      status: 'failed',
      type: 'result',
    });

    await expect(stopped).resolves.toMatchObject({ code: 'unexpected', status: 'error' });
    expect(worker.terminated).toBe(true);
  });
});
