import { Icon, type IconProps } from './icon';

export function EyeIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}
