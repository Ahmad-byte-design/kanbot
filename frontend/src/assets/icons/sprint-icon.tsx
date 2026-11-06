import { Icon, type IconProps } from './icon';

export function SprintIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4v5h5" />
      <path d="M20 20v-5h-5" />
      <path d="M4.6 9A8 8 0 0 1 19 7" />
      <path d="M19.4 15A8 8 0 0 1 5 17" />
    </Icon>
  );
}
