import { Icon, type IconProps } from './icon';

export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 15a3 3 0 0 1-3 3H8l-5 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z" />
      <path d="M8 9h8M8 13h5" />
    </Icon>
  );
}
