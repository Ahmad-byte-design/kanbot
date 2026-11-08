/* eslint-disable react-refresh/only-export-components */
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUp,
  BookOpen,
  Box,
  Briefcase,
  Bug,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDot,
  Code2,
  Eye,
  EyeOff,
  Flag,
  GripVertical,
  Info,
  Kanban,
  Languages,
  Layers,
  ListTodo,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Sparkles,
  SquareCheckBig,
  Sun,
  Tags,
  Target,
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
export const BookIcon = lucide(BookOpen);
export const BoxIcon = lucide(Box);
export const BriefcaseIcon = lucide(Briefcase);
export const BugIcon = lucide(Bug);
export const CalendarIcon = lucide(CalendarDays);
export const ChatIcon = lucide(MessageSquare);
export const CheckIcon = lucide(Check);
export const ChevronDownIcon = lucide(ChevronDown);
export const CircleDotIcon = lucide(CircleDot);
export const CloseIcon = lucide(X);
export const CodeIcon = lucide(Code2);
export const EyeIcon = lucide(Eye);
export const EyeOffIcon = lucide(EyeOff);
export const FlagIcon = lucide(Flag);
export const GripIcon = lucide(GripVertical);
export const InfoIcon = lucide(Info);
export const LanguagesIcon = lucide(Languages);
export const LayersIcon = lucide(Layers);
export const LogoutIcon = lucide(LogOut);
export const MenuIcon = lucide(Menu);
export const MoonIcon = lucide(Moon);
export const MoreIcon = lucide(MoreHorizontal);
export const MoveToSprintIcon = lucide(ArrowRightLeft);
export const PaletteIcon = lucide(Palette);
export const PanelLeftCloseIcon = lucide(PanelLeftClose);
export const PanelLeftOpenIcon = lucide(PanelLeftOpen);
export const PencilIcon = lucide(Pencil);
export const PlusIcon = lucide(Plus);
export const RefreshIcon = lucide(RefreshCw);
export const RocketIcon = lucide(Rocket);
export const SearchIcon = lucide(Search);
export const SendIcon = lucide(Send);
export const SparklesIcon = lucide(Sparkles);
export const SprintIcon = lucide(Timer);
export const StatusIcon = lucide(Tags);
export const SunIcon = lucide(Sun);
export const TaskIcon = lucide(SquareCheckBig);
export const TargetIcon = lucide(Target);
export const TrashIcon = lucide(Trash2);

/** Raw Lucide glyphs for new code that wants a size-free component. */
export {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUp,
  BookOpen,
  Box,
  Briefcase,
  Bug,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDot,
  Code2,
  Eye,
  EyeOff,
  Flag,
  GripVertical,
  Info,
  Kanban,
  Languages,
  Layers,
  ListTodo,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Sparkles,
  SquareCheckBig,
  Sun,
  Tags,
  Target,
  Timer,
  Trash2,
  X,
};
