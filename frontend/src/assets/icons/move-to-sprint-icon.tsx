import { Icon, type IconProps } from './icon';

export function MoveToSprintIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20v-5h5" />
      <path d="M4.6 15A8 8 0 0 0 19 17" />
      <path d="M20 4v5h-5" />
      <path d="M19.4 9A8 8 0 0 0 5 7" />
    </Icon>
  );
}
