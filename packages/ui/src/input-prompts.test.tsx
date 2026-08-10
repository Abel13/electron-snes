import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InputPrompt, InputPromptProvider } from './input-prompts.js';

describe('adaptive input prompts', () => {
  it.each([['desktop', 'Enter'], ['xbox', 'A'], ['playstation', '×']] as const)(
    'renders the confirm prompt for %s',
    (scheme, expected) => {
      const markup = renderToStaticMarkup(
        <InputPromptProvider scheme={scheme}><InputPrompt action="confirm" label="Confirm" /></InputPromptProvider>,
      );
      expect(markup).toContain(expected);
      expect(markup).toContain('aria-label="Confirm"');
    },
  );
});
