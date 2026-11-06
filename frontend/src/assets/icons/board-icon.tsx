import { Icon, type IconProps } from './icon';

export function BoardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="6" height="16" rx="1.5" />
      <rect x="11" y="4" width="6" height="10" rx="1.5" />
      <rect x="19" y="4" width="2" height="7" rx="1" />
    </Icon>
  );
}
