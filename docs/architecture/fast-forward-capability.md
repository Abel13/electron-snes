# Fast-forward capability

Fast-forward is an optional emulator capability. A core advertises support with
`EmulatorCapabilities.fastForward` and implements
`EmulatorSession.setFastForwardActive(active)`.

The operation is edge-oriented: `true` starts accelerated execution while the user holds the
configured command, and `false` returns to normal execution. Hosts must not invoke the operation or
expose its controls when the capability is false. Emulator implementations own the acceleration
factor, scheduling, video pacing, and temporary audio suppression.

The additive optional method remains compatible with plugin API revision 1. A plugin that declares
fast-forward support without implementing the operation is rejected before activation.
