import { err, ok } from '@platform/core';
import type { BinaryStoragePort, Result } from '@platform/core';
import type { EmulatorSaveState } from '@platform/emulator-sdk';

export const SAVE_STATE_SLOTS = ['autosave', 'slot-1', 'slot-2', 'slot-3'] as const;
export type SaveStateSlot = (typeof SAVE_STATE_SLOTS)[number];

export interface SaveStateDescriptor {
  readonly sizeBytes: number;
  readonly slot: SaveStateSlot;
  readonly updatedAt: string;
}

const MAGIC = new Uint8Array([0x50, 0x43, 0x53, 0x31]);
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8', { fatal: true });

export class SaveStateRepository {
  public constructor(private readonly storage: BinaryStoragePort) {}

  public async list(gameId: string): Promise<Result<readonly SaveStateDescriptor[]>> {
    const prefix = `${assertGameId(gameId)}--`;
    const entries = await this.storage.list('save-states');
    if (!entries.ok) return entries;
    return ok(
      entries.value.flatMap((entry) => {
        if (!entry.key.startsWith(prefix)) return [];
        const slot = entry.key.slice(prefix.length);
        return isSaveStateSlot(slot)
          ? [{ sizeBytes: entry.sizeBytes, slot, updatedAt: entry.updatedAt }]
          : [];
      }),
    );
  }

  public async read(
    gameId: string,
    slot: SaveStateSlot,
  ): Promise<Result<EmulatorSaveState | undefined>> {
    const stored = await this.storage.read('save-states', keyFor(gameId, slot));
    if (!stored.ok) return stored;
    if (stored.value === undefined) return ok(undefined);
    try {
      return ok(decode(stored.value));
    } catch {
      return err({ code: 'invalid-input', message: 'The stored save state is invalid.' });
    }
  }

  public remove(gameId: string, slot: SaveStateSlot): Promise<Result<void>> {
    return this.storage.remove('save-states', keyFor(gameId, slot));
  }

  public write(
    gameId: string,
    slot: SaveStateSlot,
    saveState: EmulatorSaveState,
  ): Promise<Result<void>> {
    return this.storage.write('save-states', keyFor(gameId, slot), encode(saveState));
  }
}

const keyFor = (gameId: string, slot: SaveStateSlot): string => `${assertGameId(gameId)}--${slot}`;

const assertGameId = (gameId: string): string => {
  if (!/^[a-z0-9-]{1,80}$/.test(gameId)) throw new Error('The game identifier is invalid.');
  return gameId;
};

const isSaveStateSlot = (value: string): value is SaveStateSlot =>
  SAVE_STATE_SLOTS.includes(value as SaveStateSlot);

const encode = (state: EmulatorSaveState): Uint8Array => {
  if (!/^[a-z0-9.-]{3,120}$/.test(state.coreId)) throw new Error('The core ID is invalid.');
  if (!Number.isSafeInteger(state.formatVersion) || state.formatVersion < 1)
    throw new Error('The state format version is invalid.');
  if (state.bytes.byteLength === 0) throw new Error('The save state is empty.');
  const core = textEncoder.encode(state.coreId);
  const output = new Uint8Array(10 + core.byteLength + state.bytes.byteLength);
  output.set(MAGIC);
  const view = new DataView(output.buffer);
  view.setUint16(4, core.byteLength, false);
  view.setUint32(6, state.formatVersion, false);
  output.set(core, 10);
  output.set(state.bytes, 10 + core.byteLength);
  return output;
};

const decode = (value: Uint8Array): EmulatorSaveState => {
  if (value.byteLength < 11 || !MAGIC.every((byte, index) => value[index] === byte))
    throw new Error('Invalid envelope.');
  const view = new DataView(value.buffer, value.byteOffset, value.byteLength);
  const coreLength = view.getUint16(4, false);
  const formatVersion = view.getUint32(6, false);
  const payloadOffset = 10 + coreLength;
  if (coreLength === 0 || formatVersion < 1 || payloadOffset >= value.byteLength)
    throw new Error('Invalid envelope.');
  return {
    bytes: value.slice(payloadOffset),
    coreId: textDecoder.decode(value.slice(10, payloadOffset)),
    formatVersion,
  };
};
