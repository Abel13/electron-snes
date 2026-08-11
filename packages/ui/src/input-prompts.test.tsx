import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InputPrompt, InputPromptProvider, type InputPromptAssetMap } from './input-prompts.js';

const assets = {
  desktop: { confirm: [{ src: '/desktop-enter.svg' }, { src: '/desktop-mouse.svg' }] },
  xbox: { confirm: [{ src: '/xbox-a.svg' }] },
  playstation: { confirm: [{ src: '/playstation-cross.svg' }] },
} as InputPromptAssetMap;

describe('adaptive input prompts', () => {
  it.each([
    ['desktop', 'Enter'],
    ['xbox', 'A'],
    ['playstation', '×'],
  ] as const)('renders the confirm prompt for %s', (scheme, expected) => {
    const markup = renderToStaticMarkup(
      <InputPromptProvider scheme={scheme}>
        <InputPrompt action="confirm" label="Confirm" />
      </InputPromptProvider>,
    );
    expect(markup).toContain(expected);
    expect(markup).toContain('aria-label="Confirm"');
  });

  it.each([
    ['desktop', '/desktop-enter.svg'],
    ['xbox', '/xbox-a.svg'],
    ['playstation', '/playstation-cross.svg'],
  ] as const)('renders the %s asset selected by the provider', (scheme, src) => {
    const markup = renderToStaticMarkup(
      <InputPromptProvider assetMap={assets} scheme={scheme}>
        <InputPrompt action="confirm" label="Confirm" />
      </InputPromptProvider>,
    );
    expect(markup).toContain(`src="${src}"`);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('aria-label="Confirm"');
  });
});
