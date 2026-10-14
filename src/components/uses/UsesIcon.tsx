import {
  Activity,
  Bot,
  Boxes,
  Code,
  Compass,
  Cpu,
  Database,
  Download,
  Eye,
  Flame,
  GitBranch,
  Globe,
  History,
  Laptop,
  Layers,
  Palette,
  Radio,
  Send,
  Sparkles,
  Target,
  Terminal,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** The icon names the content editors offer (lib/cms/icons), resolved to their glyphs. */
const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  bot: Bot,
  boxes: Boxes,
  code: Code,
  compass: Compass,
  cpu: Cpu,
  database: Database,
  download: Download,
  eye: Eye,
  flame: Flame,
  git: GitBranch,
  globe: Globe,
  history: History,
  laptop: Laptop,
  layers: Layers,
  palette: Palette,
  radio: Radio,
  send: Send,
  sparkles: Sparkles,
  target: Target,
  terminal: Terminal,
  workflow: Workflow,
  zap: Zap,
};

/** A CMS-chosen glyph; unknown or empty names fall back to a neutral mark. */
export default function UsesIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && ICONS[name.toLowerCase()]) || Compass;
  return <Icon aria-hidden="true" strokeWidth={1.25} className={className} />;
}
