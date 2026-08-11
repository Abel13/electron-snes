# Rewind capability

Rewind is an optional emulator capability. A core advertises support with
`EmulatorCapabilities.rewind` and implements `EmulatorSession.setRewindActive(active)`.

The operation is edge-oriented: `true` starts rewinding while the user holds the configured
command, and `false` returns to normal execution. Hosts must not call the operation or expose its
controls when the capability is false. Emulator implementations own history retention, exhaustion
behavior, frame restoration, and temporary audio suppression.

The additive optional method remains compatible with plugin API revision 1. A plugin that declares
rewind support without implementing the operation is rejected before activation.
