import type { InputPromptAssetMap } from '@platform/ui';

const asset = (path: string) => ({ src: new URL(path, import.meta.url).href });

const desktop = {
  all: asset(
    new URL('../assets/input-prompts/kenney/desktop/arrows-all.svg', import.meta.url).href,
  ),
  horizontal: asset(
    new URL('../assets/input-prompts/kenney/desktop/arrows-horizontal.svg', import.meta.url).href,
  ),
  vertical: asset(
    new URL('../assets/input-prompts/kenney/desktop/arrows-vertical.svg', import.meta.url).href,
  ),
  enter: asset(new URL('../assets/input-prompts/kenney/desktop/enter.svg', import.meta.url).href),
  escape: asset(new URL('../assets/input-prompts/kenney/desktop/escape.svg', import.meta.url).href),
  shift: asset(new URL('../assets/input-prompts/kenney/desktop/shift.svg', import.meta.url).href),
  z: asset(new URL('../assets/input-prompts/kenney/desktop/z.svg', import.meta.url).href),
  x: asset(new URL('../assets/input-prompts/kenney/desktop/x.svg', import.meta.url).href),
  mouse: asset(
    new URL('../assets/input-prompts/kenney/desktop/mouse-left.svg', import.meta.url).href,
  ),
} as const;

const xbox = {
  all: asset(new URL('../assets/input-prompts/kenney/xbox/dpad-all.svg', import.meta.url).href),
  horizontal: asset(
    new URL('../assets/input-prompts/kenney/xbox/dpad-horizontal.svg', import.meta.url).href,
  ),
  vertical: asset(
    new URL('../assets/input-prompts/kenney/xbox/dpad-vertical.svg', import.meta.url).href,
  ),
  a: asset(new URL('../assets/input-prompts/kenney/xbox/a.svg', import.meta.url).href),
  b: asset(new URL('../assets/input-prompts/kenney/xbox/b.svg', import.meta.url).href),
  menu: asset(new URL('../assets/input-prompts/kenney/xbox/menu.svg', import.meta.url).href),
  view: asset(new URL('../assets/input-prompts/kenney/xbox/view.svg', import.meta.url).href),
} as const;

const playstation = {
  all: asset(
    new URL('../assets/input-prompts/kenney/playstation/dpad-all.svg', import.meta.url).href,
  ),
  horizontal: asset(
    new URL('../assets/input-prompts/kenney/playstation/dpad-horizontal.svg', import.meta.url).href,
  ),
  vertical: asset(
    new URL('../assets/input-prompts/kenney/playstation/dpad-vertical.svg', import.meta.url).href,
  ),
  cross: asset(
    new URL('../assets/input-prompts/kenney/playstation/cross.svg', import.meta.url).href,
  ),
  circle: asset(
    new URL('../assets/input-prompts/kenney/playstation/circle.svg', import.meta.url).href,
  ),
  options: asset(
    new URL('../assets/input-prompts/kenney/playstation/options.svg', import.meta.url).href,
  ),
  create: asset(
    new URL('../assets/input-prompts/kenney/playstation/create.svg', import.meta.url).href,
  ),
} as const;

export const kenneyInputPromptAssets = {
  desktop: {
    back: [desktop.escape],
    confirm: [desktop.enter, desktop.mouse],
    'navigate-all': [desktop.all],
    'navigate-horizontal': [desktop.horizontal],
    'navigate-vertical': [desktop.vertical],
    primary: [desktop.z],
    secondary: [desktop.x],
    select: [desktop.shift],
    settings: [desktop.escape],
    start: [desktop.enter],
  },
  xbox: {
    back: [xbox.b],
    confirm: [xbox.a],
    'navigate-all': [xbox.all],
    'navigate-horizontal': [xbox.horizontal],
    'navigate-vertical': [xbox.vertical],
    primary: [xbox.a],
    secondary: [xbox.b],
    select: [xbox.view],
    settings: [xbox.menu],
    start: [xbox.menu],
  },
  playstation: {
    back: [playstation.circle],
    confirm: [playstation.cross],
    'navigate-all': [playstation.all],
    'navigate-horizontal': [playstation.horizontal],
    'navigate-vertical': [playstation.vertical],
    primary: [playstation.cross],
    secondary: [playstation.circle],
    select: [playstation.create],
    settings: [playstation.options],
    start: [playstation.options],
  },
} as const satisfies InputPromptAssetMap;
