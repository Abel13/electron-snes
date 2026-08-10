import {
  Archive,
  Clock3,
  Gamepad2,
  Heart,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  Sparkles,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

export type IconName =
  'archive' | 'clock' | 'gamepad' | 'grid' | 'heart' | 'plus' | 'search' | 'settings' | 'sparkles';

const icons = {
  archive: Archive,
  clock: Clock3,
  gamepad: Gamepad2,
  grid: LayoutGrid,
  heart: Heart,
  plus: Plus,
  search: Search,
  settings: Settings,
  sparkles: Sparkles,
} as const satisfies Record<IconName, LucideIcon>;

export const Icon = ({
  color = 'currentColor',
  name,
  strokeLinecap = 'round',
  strokeLinejoin = 'round',
  strokeWidth = 1.7,
  ...props
}: LucideProps & { readonly name: IconName }): React.JSX.Element => {
  const LucideComponent = icons[name];
  return (
    <LucideComponent
      {...props}
      aria-hidden="true"
      color={color}
      focusable="false"
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      strokeWidth={strokeWidth}
    />
  );
};
