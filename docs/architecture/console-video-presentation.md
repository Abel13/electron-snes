# Console Video Presentation

## Purpose

The emulator core produces native video frames. The console plugin declares how those frames are
presented in a PixelCore session. This separation preserves the frame, lets each console have an
appropriate scene, and prevents renderer code from branching on console identifiers.

## Ownership

- Emulator core: native frame dimensions, RGBA output, and optional rendering capabilities.
- Console plugin: video profile, permitted scaling modes, default mode, scene composition, and
  visual-token values.
- Desktop composition root: combines the active console profile with the active emulator session.
- UI: renders the declared profile and frame without changing console pixels.

## Declarative profile

```ts
type ConsoleVideoPresentation = {
  nativeResolution: { width: number; height: number };
  scalingModes: readonly ('pixel-perfect' | 'fit' | 'fill')[];
  defaultScalingMode: 'pixel-perfect' | 'fit' | 'fill';
  allowCrop: boolean;
  filtering: 'nearest' | 'linear';
  scene: {
    layout: 'portable-vertical' | 'portable-wide' | 'home-4-3' | 'custom';
    frameStyle: string;
    backdropStyle: string;
    accent: string;
  };
};
```

`pixel-perfect` preserves native aspect ratio and uses integer scaling where the available space
permits. `fit` preserves the aspect ratio while using the available presentation region. `fill` is
available only when the console explicitly permits crop or a non-pixel presentation. No mode may
stretch a frame independently on the horizontal and vertical axes.

## Scene behavior

The session scene adapts to the console rather than fitting every console into a universal black
rectangle. Unused composition space can contain a low-emphasis backdrop, console artwork, cover art,
particles, and ambient light defined by the profile. It must not be treated as part of the game frame.

Game Boy Family currently uses `160x144` and pixelated presentation. A future GBA profile will use
`240x160` with its own wide portable scene. These are examples, not renderer special cases.

## Accessibility and performance

- The native frame is the primary visual content and remains distinguishable from decorative scene art.
- Status, pause, exit confirmation, time, battery, and input prompts occupy reserved safe areas.
- Reduced motion disables continuous scene motion and retains only short state transitions.
- Palette-driven ambient effects sample existing video pixels at a bounded rate and update CSS
  variables directly; they must not create a React render for every emulator frame.
- The video canvas and ambient palette stop updating while a session is paused or has ended.

## Validation

For every console profile, verify native aspect ratio, no unintended crop or stretch, window resizing,
fullscreen behavior, reduced motion, safe-area preservation, and that the UI can render the profile
without a console-specific conditional.
