import { Icon, type IconProps } from './icon';

export function SparklesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
      <path d="M19 15.5 19.8 18l2.2.8-2.2.9-.8 2.3-.8-2.3-2.2-.9 2.2-.8Z" />
    </Icon>
  );
}
