import { Icon, type IconProps } from './icon';

export function CheckIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.4} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Icon>
  );
}
