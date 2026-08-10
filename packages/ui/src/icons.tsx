import type { SVGProps } from 'react';

export type IconName =
  'archive' | 'clock' | 'gamepad' | 'grid' | 'heart' | 'plus' | 'search' | 'settings' | 'sparkles';

const paths: Record<IconName, string> = {
  archive: 'M4 7h16v13H4zM3 3h18v4H3zm6 8h6',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  gamepad:
    'M7 9h10a5 5 0 0 1 4.6 6.9l-1 2.5a2 2 0 0 1-3.2.8L15 17H9l-2.4 2.2a2 2 0 0 1-3.2-.8l-1-2.5A5 5 0 0 1 7 9Zm1 3v4m-2-2h4m6-1h.01M18 15h.01',
  grid: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z',
  plus: 'M12 5v14M5 12h14',
  search: 'm21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  settings:
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5 1.6-1.2-2-3.4-2 .8a7 7 0 0 0-1.4-.8L15.3 5h-4.6l-.3 2.4a7 7 0 0 0-1.4.8l-2-.8-2 3.4L6.6 12a7 7 0 0 0 0 1.6L5 14.8l2 3.4 2-.8a7 7 0 0 0 1.4.8l.3 2.4h4.6l.3-2.4a7 7 0 0 0 1.4-.8l2 .8 2-3.4-1.6-1.2a7 7 0 0 0 0-1.6Z',
  sparkles:
    'm12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Zm7 10 .7 2.3L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.7L19 13ZM5 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z',
};

export const Icon = ({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      d={paths[name]}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);
