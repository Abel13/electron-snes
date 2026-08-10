export type FocusDirection = 'down' | 'left' | 'right' | 'up';

interface FocusCandidate {
  readonly element: HTMLElement;
  readonly rect: DOMRect;
}

export const moveDirectionalFocus = (
  direction: FocusDirection,
  root: ParentNode = document,
): boolean => {
  const elements = Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null);
  if (elements.length === 0) return false;
  const current =
    document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  if (current === undefined || !elements.includes(current)) {
    elements[0]?.focus();
    return true;
  }
  const origin = current.getBoundingClientRect();
  const originX = origin.left + origin.width / 2;
  const originY = origin.top + origin.height / 2;
  const candidates: FocusCandidate[] = elements
    .filter((element) => element !== current)
    .map((element) => ({ element, rect: element.getBoundingClientRect() }));
  const ranked = candidates
    .map((candidate) => {
      const x = candidate.rect.left + candidate.rect.width / 2 - originX;
      const y = candidate.rect.top + candidate.rect.height / 2 - originY;
      const isForward =
        direction === 'left'
          ? x < -2
          : direction === 'right'
            ? x > 2
            : direction === 'up'
              ? y < -2
              : y > 2;
      if (!isForward) return undefined;
      const primary = direction === 'left' || direction === 'right' ? Math.abs(x) : Math.abs(y);
      const cross = direction === 'left' || direction === 'right' ? Math.abs(y) : Math.abs(x);
      return { candidate, score: primary + cross * 2.2 };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
    .sort((left, right) => left.score - right.score);
  const target = ranked[0]?.candidate.element;
  if (target === undefined) return false;
  target.focus();
  return true;
};
