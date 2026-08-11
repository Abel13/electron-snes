export { NORMALIZED_INPUT_ACTIONS, isNormalizedInputAction } from './actions.js';
export type { NormalizedInputAction } from './actions.js';
export { validateConsoleInputMapping, mapNormalizedActions } from './console-mapping.js';
export type { ConsoleInputMapping, ConsoleInputMappingEntry } from './console-mapping.js';
export { InputDeviceDiscovery, KEYBOARD_DEVICE } from './device-discovery.js';
export type {
  GamepadButtonSnapshot,
  GamepadSnapshot,
  InputDeviceDescriptor,
  InputDeviceKind,
  InputDeviceSource,
  InputFrame,
} from './devices.js';
export { DEFAULT_GAMEPAD_BINDINGS, PLATFORM_GAMEPAD_BINDINGS, GamepadInputAdapter, RESERVED_GAMEPAD_BUTTON_INDEX, readPressedGamepadButtons } from './gamepad-adapter.js';
export type { GamepadBinding, GamepadPhysicalInput } from './gamepad-adapter.js';
export { GamepadPromptActivityTracker, classifyGamepadPromptScheme } from './input-prompt-scheme.js';
export type { InputPromptScheme } from './input-prompt-scheme.js';
export {
  DEFAULT_KEYBOARD_BINDINGS,
  InputProfileRepository,
  bindingsForGamepad,
  validateInputProfile,
} from './input-profiles.js';
export type { GamepadBindingSet, InputProfile, KeyboardBinding } from './input-profiles.js';
export { KeyboardInputAdapter, isCapturableKeyboardInput } from './keyboard-adapter.js';
export type { KeyboardCaptureCandidate, KeyboardInputEvent } from './keyboard-adapter.js';
export { PlayerAssignmentManager } from './player-assignment.js';
export type { PlayerAssignment } from './player-assignment.js';
export { UniversalInputRuntime } from './runtime.js';
