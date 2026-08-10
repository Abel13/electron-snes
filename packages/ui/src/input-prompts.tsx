import { createContext, useContext, useState, type ReactNode } from 'react';

export type InputPromptScheme = 'desktop' | 'playstation' | 'xbox';

export type InputPromptAction =
  | 'back'
  | 'confirm'
  | 'navigate-all'
  | 'navigate-horizontal'
  | 'navigate-vertical'
  | 'primary'
  | 'secondary'
  | 'select'
  | 'settings'
  | 'start';

export interface InputPromptAsset {
  readonly src: string;
}

export type InputPromptAssetMap = Readonly<
  Record<
    InputPromptScheme,
    Readonly<Partial<Record<InputPromptAction, readonly InputPromptAsset[]>>>
  >
>;

export interface InputPromptProviderProps {
  readonly assetMap?: InputPromptAssetMap;
  readonly children: ReactNode;
  readonly scheme: InputPromptScheme;
}

interface InputPromptContextValue {
  readonly assetMap: InputPromptAssetMap | undefined;
  readonly scheme: InputPromptScheme;
}

const InputPromptContext = createContext<InputPromptContextValue>({
  assetMap: undefined,
  scheme: 'desktop',
});

export const InputPromptProvider = (props: InputPromptProviderProps): React.JSX.Element => (
  <InputPromptContext.Provider value={{ assetMap: props.assetMap, scheme: props.scheme }}>
    {props.children}
  </InputPromptContext.Provider>
);

interface PromptToken {
  readonly kind: 'button' | 'dpad' | 'key' | 'menu' | 'mouse';
  readonly text?: string;
}

const prompts: Record<InputPromptScheme, Record<InputPromptAction, readonly PromptToken[]>> = {
  desktop: {
    back: [{ kind: 'key', text: 'Esc' }],
    confirm: [{ kind: 'key', text: 'Enter' }, { kind: 'mouse' }],
    'navigate-all': [{ kind: 'key', text: '↑↓←→' }],
    'navigate-horizontal': [{ kind: 'key', text: '← →' }],
    'navigate-vertical': [{ kind: 'key', text: '↑ ↓' }],
    primary: [{ kind: 'key', text: 'Z' }],
    secondary: [{ kind: 'key', text: 'X' }],
    select: [{ kind: 'key', text: 'Shift' }],
    settings: [{ kind: 'key', text: 'Esc' }],
    start: [{ kind: 'key', text: 'Enter' }],
  },
  xbox: {
    back: [{ kind: 'button', text: 'B' }],
    confirm: [{ kind: 'button', text: 'A' }],
    'navigate-all': [{ kind: 'dpad' }],
    'navigate-horizontal': [{ kind: 'dpad', text: '↔' }],
    'navigate-vertical': [{ kind: 'dpad', text: '↕' }],
    primary: [{ kind: 'button', text: 'A' }],
    secondary: [{ kind: 'button', text: 'B' }],
    select: [{ kind: 'menu', text: '▣' }],
    settings: [{ kind: 'menu', text: '≡' }],
    start: [{ kind: 'menu', text: '≡' }],
  },
  playstation: {
    back: [{ kind: 'button', text: '○' }],
    confirm: [{ kind: 'button', text: '×' }],
    'navigate-all': [{ kind: 'dpad' }],
    'navigate-horizontal': [{ kind: 'dpad', text: '↔' }],
    'navigate-vertical': [{ kind: 'dpad', text: '↕' }],
    primary: [{ kind: 'button', text: '×' }],
    secondary: [{ kind: 'button', text: '○' }],
    select: [{ kind: 'menu', text: '▱' }],
    settings: [{ kind: 'menu', text: '☰' }],
    start: [{ kind: 'menu', text: '☰' }],
  },
};

const PromptGlyph = ({ token }: { readonly token: PromptToken }): React.JSX.Element => {
  if (token.kind === 'mouse')
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M8 3h8a4 4 0 0 1 4 4v8a8 8 0 0 1-16 0V7a4 4 0 0 1 4-4Zm4 0v6m-8 2h16" />
      </svg>
    );
  if (token.kind === 'dpad')
    return (
      <span className="pc-prompt-dpad" aria-hidden="true">
        <i />
        <b>{token.text}</b>
      </span>
    );
  return (
    <span aria-hidden="true" className={`pc-prompt-${token.kind}`}>
      {token.text}
    </span>
  );
};

const PromptAsset = (props: {
  readonly asset: InputPromptAsset;
  readonly fallback: PromptToken;
}): React.JSX.Element => {
  const [failed, setFailed] = useState(false);
  if (failed) return <PromptGlyph token={props.fallback} />;
  return (
    <span className="pc-prompt-asset">
      <img
        aria-hidden="true"
        src={props.asset.src}
        onError={() => {
          setFailed(true);
        }}
      />
    </span>
  );
};

export const InputPrompt = (props: {
  readonly action: InputPromptAction;
  readonly label: string;
}): React.JSX.Element => {
  const { assetMap, scheme } = useContext(InputPromptContext);
  const tokens = prompts[scheme][props.action];
  const assets = assetMap?.[scheme][props.action];
  return (
    <span
      aria-label={props.label}
      className="pc-input-prompt"
      key={`${scheme}-${props.action}`}
      role="img"
    >
      {tokens.map((token, index) => {
        const selectedAsset = assets?.[index];
        return selectedAsset ? (
          <PromptAsset asset={selectedAsset} fallback={token} key={selectedAsset.src} />
        ) : (
          <PromptGlyph key={index} token={token} />
        );
      })}
    </span>
  );
};

export const InputPromptGroup = (props: {
  readonly actions: readonly InputPromptAction[];
  readonly label: string;
}): React.JSX.Element => (
  <span className="pc-input-prompt-group">
    {props.actions.map((action) => (
      <InputPrompt action={action} key={action} label={props.label} />
    ))}
  </span>
);
