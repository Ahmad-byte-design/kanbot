/* eslint-disable react-refresh/only-export-components */
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Info,
  Kanban,
  Layers,
  ListTodo,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Timer,
  Trash2,
  X,
} from 'lucide-react';

/**
 * The app's icon set is Lucide, wrapped once so every call site keeps the
 * familiar `<PlusIcon width={14} />` API with a consistent 18px / 1.8 stroke
 * default. Never hand-roll an SVG icon again.
 */
export type IconProps = LucideProps;

function lucide(Icon: LucideIcon): LucideIcon {
  return function WrappedIcon({ size = 18, strokeWidth = 1.8, ...props }: LucideProps) {
    return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props} />;
  } as LucideIcon;
}

export const ArrowDownIcon = lucide(ArrowDown);
export const ArrowLeftIcon = lucide(ArrowLeft);
export const ArrowRightIcon = lucide(ArrowRight);
export const ArrowUpIcon = lucide(ArrowUp);
export const BacklogIcon = lucide(ListTodo);
export const BoardIcon = lucide(Kanban);
export const CalendarIcon = lucide(CalendarDays);
export const ChatIcon = lucide(MessageSquare);
export const CheckIcon = lucide(Check);
export const ChevronDownIcon = lucide(ChevronDown);
export const CloseIcon = lucide(X);
export const EyeIcon = lucide(Eye);
export const EyeOffIcon = lucide(EyeOff);
export const GripIcon = lucide(GripVertical);
export const InfoIcon = lucide(Info);
export const LayersIcon = lucide(Layers);
export const LogoutIcon = lucide(LogOut);
export const MoreIcon = lucide(MoreHorizontal);
export const MoveToSprintIcon = lucide(ArrowRightLeft);
export const PencilIcon = lucide(Pencil);
export const PlusIcon = lucide(Plus);
export const RefreshIcon = lucide(RefreshCw);
export const SearchIcon = lucide(Search);
export const SendIcon = lucide(Send);
export const SparklesIcon = lucide(Sparkles);
export const SprintIcon = lucide(Timer);
export const TrashIcon = lucide(Trash2);

/** Raw Lucide glyphs for new code that wants a size-free component. */
export {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Info,
  Kanban,
  Layers,
  ListTodo,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Timer,
  Trash2,
  X,
};
