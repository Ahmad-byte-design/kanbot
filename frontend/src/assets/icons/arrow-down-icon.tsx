import { Icon, type IconProps } from './icon';

export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12l7 7 7-7" />
    </Icon>
  );
}
