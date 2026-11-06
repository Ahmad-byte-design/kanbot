import { Icon, type IconProps } from './icon';

export function GripIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}
