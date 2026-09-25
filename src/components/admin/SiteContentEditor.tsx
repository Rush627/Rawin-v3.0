"use client";

import React, { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import {
  Globe,
  Home,
  User,
  Mail,
  FileText,
  Wrench,
  Bot,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ImageIcon,
  Upload,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Layers,
  Compass,
  Laptop,
  Flame,
  Radio,
  FileDown,
  Briefcase,
  GraduationCap,
  Link2,
  MapPin,
  X,
  Eye,
  Check,
  History,
  Target,
  Boxes,
  Send,
  Download,
  Cpu,
  MessageSquare,
  ShieldCheck,
  Lock,
  EyeOff,
  BookOpen,
  Code,
  Palette,
  Database,
  Zap,
  Activity,
  GitBranch,
  Terminal,
  Workflow,
} from "lucide-react";
import RawinSelect, { type RawinSelectOption } from "./RawinSelect";
import NeoToggle from "@/components/NeoToggle";
import OrbitKnowledgeManager from "./OrbitKnowledgeManager";
import type { OrbitKnowledgeItem } from "@/lib/orbit-knowledge";
const DEFAULT_HERO_TYPING_PHRASES = [
  "Full Stack Developer",
  "Creative Technologies",
  "UI/UX Designer",
];

import type {
  SiteContent,
  ContentSectionKey,
  AssetKey,
  DevStackItem,
  ExploringItem,
  DailyStackItem,
  BuildStepItem,
  ResumeSkillGroup,
  ResumeExperienceItem,
  ResumeEducationItem,
  ResumeStatusIndicator,
  EvolutionMilestoneItem,
  AboutPrincipleItem,
  AboutFocusItem,
} from "@/lib/site-content";
import {
  updateSectionAction,
  updateAssetAction,
  uploadResumePdfAction,
  removeResumePdfAction,
  uploadMilestoneImageAction,
  updateOrbitVerificationCodeAction,
  type ContentActionState,
} from "@/app/saint-denis/content/actions";

const ICON_SELECT_OPTIONS: RawinSelectOption[] = [
  { value: "layers", label: "Layers", icon: <Layers className="w-3.5 h-3.5" /> },
  { value: "code", label: "Code", icon: <Code className="w-3.5 h-3.5" /> },
  { value: "cpu", label: "CPU", icon: <Cpu className="w-3.5 h-3.5" /> },
  { value: "palette", label: "Palette", icon: <Palette className="w-3.5 h-3.5" /> },
  { value: "database", label: "Database", icon: <Database className="w-3.5 h-3.5" /> },
  { value: "zap", label: "Zap", icon: <Zap className="w-3.5 h-3.5" /> },
  { value: "activity", label: "Activity", icon: <Activity className="w-3.5 h-3.5" /> },
  { value: "compass", label: "Compass", icon: <Compass className="w-3.5 h-3.5" /> },
  { value: "git", label: "Git", icon: <GitBranch className="w-3.5 h-3.5" /> },
  { value: "terminal", label: "Terminal", icon: <Terminal className="w-3.5 h-3.5" /> },
  { value: "bot", label: "Bot", icon: <Bot className="w-3.5 h-3.5" /> },
  { value: "globe", label: "Globe", icon: <Globe className="w-3.5 h-3.5" /> },
  { value: "sparkles", label: "Sparkles", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { value: "radio", label: "Radio", icon: <Radio className="w-3.5 h-3.5" /> },
  { value: "flame", label: "Flame", icon: <Flame className="w-3.5 h-3.5" /> },
  { value: "laptop", label: "Laptop", icon: <Laptop className="w-3.5 h-3.5" /> },
  { value: "workflow", label: "Workflow", icon: <Workflow className="w-3.5 h-3.5" /> },
  { value: "eye", label: "Eye", icon: <Eye className="w-3.5 h-3.5" /> },
  { value: "boxes", label: "Boxes", icon: <Boxes className="w-3.5 h-3.5" /> },
  { value: "target", label: "Target", icon: <Target className="w-3.5 h-3.5" /> },
  { value: "send", label: "Send", icon: <Send className="w-3.5 h-3.5" /> },
  { value: "download", label: "Download", icon: <Download className="w-3.5 h-3.5" /> },
  { value: "history", label: "History", icon: <History className="w-3.5 h-3.5" /> },
];

const ICON_OPTIONS = ICON_SELECT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }));

const STATUS_INDICATOR_OPTIONS: RawinSelectOption[] = [
  { value: "green", label: "Green (Available for hire)" },
  { value: "orange", label: "Orange (Currently working on a project)" },
  { value: "cyan", label: "Cyan (Open to select opportunities)" },
  { value: "gray", label: "Gray (Not currently available)" },
];

interface SiteContentEditorProps {
  initialContent: SiteContent;
  initialKnowledge?: OrbitKnowledgeItem[];
}

export type AdminTabKey = ContentSectionKey | "orbit-knowledge";

interface SectionConfig {
  key: AdminTabKey;
  label: string;
  icon: typeof Globe;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  {
    key: "global",
    label: "Global",
    icon: Globe,
    description: "Brand identity, status indicators, and footer copyright text.",
  },
  {
    key: "assets",
    label: "Site Assets",
    icon: ImageIcon,
    description: "Visual identity assets: Profile Photo, Website Logo, and Website Favicon.",
  },
  {
    key: "home",
    label: "Home",
    icon: Home,
    description: "Hero typography, biography copy, CTA labels, and featured work headings.",
  },
  {
    key: "about",
    label: "About",
    icon: User,
    description: "Personal introduction, RAWIN evolution milestones, core principles, journey, and focus areas.",
  },
  {
    key: "uses",
    label: "Uses",
    icon: Wrench,
    description: "Tools, setup, and hardware showcase overview.",
  },
  {
    key: "resume",
    label: "Resume",
    icon: FileText,
    description: "Curriculum vitae subtitles, executive summary, and action labels.",
  },
  {
    key: "contact",
    label: "Contact & Social",
    icon: Mail,
    description: "Centralized contact details, social links, form placeholders, and page copy.",
  },
  {
    key: "ai",
    label: "Rawin Orbit",
    icon: Bot,
    description: "RAWIN ORBIT intelligence interface titles, intro text, placeholder, and suggested prompts.",
  },
  {
    key: "orbit-knowledge",
    label: "Orbit Knowledge",
    icon: BookOpen,
    description: "Manual authoritative facts, education, and knowledge base for Rawin Orbit.",
  },
];

interface UsesItemHeaderProps {
  index: number;
  totalCount: number;
  title: string;
  badge?: string;
  metaBadge?: string;
  enabled?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  itemTypeLabel: string;
  ariaControlsId: string;
}

function UsesItemHeader({
  index,
  totalCount,
  title,
  badge,
  metaBadge,
  enabled = true,
  isOpen,
  onToggle,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onDelete,
  itemTypeLabel,
  ariaControlsId,
}: UsesItemHeaderProps) {
  return (
    <div
      data-item-header="true"
      className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/[0.01]"
    >
      {/* Clickable Header Trigger */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={ariaControlsId}
        className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer select-none group"
      >
        <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-pacific-cyan" : "text-muted"
            }`}
          />
        </div>

        {badge && (
          <span className="text-[10px] font-mono text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 px-1.5 py-0.5 rounded shrink-0 font-medium">
            {badge}
          </span>
        )}

        <span className="text-xs sm:text-sm font-bold font-space text-foreground truncate group-hover:text-pacific-cyan transition-colors">
          {title || `Untitled ${itemTypeLabel}`}
        </span>

        {metaBadge && (
          <span className="text-[10px] font-mono text-muted/70 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded uppercase shrink-0 hidden sm:inline-block truncate max-w-[130px]">
            {metaBadge}
          </span>
        )}

        {!enabled && (
          <span className="text-[10px] font-mono text-rose-400/90 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded shrink-0">
            Disabled
          </span>
        )}
      </button>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.05]">
        {/* Mobile-only status and metadata indicators */}
        <div className="flex items-center gap-2 sm:hidden min-w-0 flex-1">
          {metaBadge && (
            <span className="text-[10px] font-mono text-muted/70 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded uppercase truncate max-w-[110px]">
              {metaBadge}
            </span>
          )}
          <span className={`text-[10px] font-mono shrink-0 ${!enabled ? "text-rose-400" : "text-emerald-400"}`}>
            ● {!enabled ? "Hidden" : "Live"}
          </span>
        </div>

        {/* Control Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleVisibility}
            aria-label={!enabled ? `Show ${itemTypeLabel}` : `Hide ${itemTypeLabel}`}
            title={!enabled ? `Show ${itemTypeLabel}` : `Hide ${itemTypeLabel}`}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              !enabled
                ? "text-muted/50 border-white/[0.05] hover:text-foreground hover:bg-white/[0.06]"
                : "text-pacific-cyan border-pacific-cyan/20 bg-pacific-cyan/[0.06] hover:bg-pacific-cyan/15"
            }`}
          >
            {!enabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            aria-label={`Move ${itemTypeLabel} up`}
            title={`Move ${itemTypeLabel} up`}
            className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted hover:text-foreground disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={index === totalCount - 1}
            onClick={onMoveDown}
            aria-label={`Move ${itemTypeLabel} down`}
            title={`Move ${itemTypeLabel} down`}
            className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted hover:text-foreground disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${itemTypeLabel}`}
            title={`Delete ${itemTypeLabel}`}
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 transition-colors cursor-pointer ml-0.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SiteContentEditor({ initialContent, initialKnowledge = [] }: SiteContentEditorProps) {
  const [activeTab, setActiveTab] = useState<AdminTabKey>("global");
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ContentActionState | null>(null);
  const [isMobileGlobalOpen, setIsMobileGlobalOpen] = useState(false);
  const [isMobileHomeOpen, setIsMobileHomeOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-expand mobile accordions on error
  useEffect(() => {
    if (activeTab === "global" && feedback?.error) {
      setIsMobileGlobalOpen(true);
    }
    if (activeTab === "home" && feedback?.error) {
      setIsMobileHomeOpen(true);
    }
  }, [activeTab, feedback]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "orbit-knowledge" || tabParam === "knowledge") {
        setActiveTab("orbit-knowledge");
      } else if (tabParam && SECTIONS.some((s) => s.key === tabParam)) {
        setActiveTab(tabParam as AdminTabKey);
      }
    }
  }, []);

  // Owner Verification Code state (Rawin Orbit Security)
  const [newVerificationCode, setNewVerificationCode] = useState("");
  const [confirmVerificationCode, setConfirmVerificationCode] = useState("");
  const [showNewCode, setShowNewCode] = useState(false);
  const [showConfirmCode, setShowConfirmCode] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState<ContentActionState | null>(null);
  const [isSavingCode, setIsSavingCode] = useState(false);

  const handleSaveVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCode(true);
    setVerificationMsg(null);

    const trimmedNew = newVerificationCode.trim();
    const trimmedConfirm = confirmVerificationCode.trim();

    if (!trimmedNew) {
      setVerificationMsg({ error: "Verification code cannot be empty." });
      setIsSavingCode(false);
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setVerificationMsg({ error: "New verification codes do not match." });
      setIsSavingCode(false);
      return;
    }

    if (trimmedNew.length < 4 || trimmedNew.length > 32) {
      setVerificationMsg({ error: "Verification code must be between 4 and 32 characters." });
      setIsSavingCode(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("newCode", trimmedNew);
      formData.append("confirmCode", trimmedConfirm);
      const res = await updateOrbitVerificationCodeAction({}, formData);
      setVerificationMsg(res);
      if (res.success) {
        setNewVerificationCode("");
        setConfirmVerificationCode("");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update verification code.";
      setVerificationMsg({ error: msg });
    } finally {
      setIsSavingCode(false);
    }
  };

  // Asset CMS state
  const [assetUrls, setAssetUrls] = useState({
    profilePhoto: initialContent.assets?.profilePhoto?.url || "/images/profile.png",
    logo: initialContent.assets?.logo?.url || "/images/logo.png",
    favicon: initialContent.assets?.favicon?.url || "/favicon.png",
  });

  const [assetAlts, setAssetAlts] = useState({
    profilePhoto: initialContent.assets?.profilePhoto?.alt || "Rushan Siddiqui : Full Stack Developer",
    logo: initialContent.assets?.logo?.alt || "RAWIN Logo",
    favicon: initialContent.assets?.favicon?.alt || "RAWIN Favicon",
  });

  const [selectedFiles, setSelectedFiles] = useState<{
    profilePhoto: File | null;
    logo: File | null;
    favicon: File | null;
  }>({
    profilePhoto: null,
    logo: null,
    favicon: null,
  });

  const [previewUrls, setPreviewUrls] = useState<{
    profilePhoto: string | null;
    logo: string | null;
    favicon: string | null;
  }>({
    profilePhoto: null,
    logo: null,
    favicon: null,
  });

  const [assetLoading, setAssetLoading] = useState<string | null>(null);
  const [milestoneLoading, setMilestoneLoading] = useState<string | null>(null);

  // Site Assets accordion state (collapsed by default)
  const [openAssetSections, setOpenAssetSections] = useState<Record<AssetKey, boolean>>({
    profilePhoto: false,
    logo: false,
    favicon: false,
  });

  const toggleAssetSection = (key: AssetKey) => {
    setOpenAssetSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllAssetSections = () => {
    const keys: AssetKey[] = ["profilePhoto", "logo", "favicon"];
    const allOpen = keys.every((k) => openAssetSections[k]);
    const nextState = !allOpen;
    setOpenAssetSections({
      profilePhoto: nextState,
      logo: nextState,
      favicon: nextState,
    });
  };

  // About Content Top-Level Accordion States (Collapsed by default)
  const [aboutOpenSections, setAboutOpenSections] = useState<Record<string, boolean>>({
    intro: false,
    narrative: false,
    evolution: false,
    principles: false,
    journey: false,
    focus: false,
    cta: false,
  });

  const toggleAboutSection = (key: string) => {
    setAboutOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllAboutSections = () => {
    const keys = ["intro", "narrative", "evolution", "principles", "journey", "focus", "cta"];
    const allOpen = keys.every((k) => aboutOpenSections[k]);
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    keys.forEach((k) => {
      updated[k] = nextState;
    });
    setAboutOpenSections(updated);
  };

  // Contact & Social Top-Level Accordion States (Collapsed by default)
  const [contactOpenSections, setContactOpenSections] = useState<Record<string, boolean>>({
    details: false,
    socials: false,
    form: false,
    headings: false,
  });

  const toggleContactSection = (key: string) => {
    setContactOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllContactSections = () => {
    const keys = ["details", "socials", "form", "headings"];
    const allOpen = keys.every((k) => contactOpenSections[k]);
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    keys.forEach((k) => {
      updated[k] = nextState;
    });
    setContactOpenSections(updated);
  };

  // Resume Content Top-Level Accordion States (All Collapsed by default)
  const [resumeOpenSections, setResumeOpenSections] = useState<Record<string, boolean>>({
    hero: false,
    contact: false,
    status: false,
    pdf: false,
    skills: false,
    experience: false,
    education: false,
  });

  const toggleResumeSection = (key: string) => {
    setResumeOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllResumeSections = () => {
    const keys = ["hero", "contact", "status", "pdf", "skills", "experience", "education"];
    const allOpen = keys.every((k) => resumeOpenSections[k]);
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    keys.forEach((k) => {
      updated[k] = nextState;
    });
    setResumeOpenSections(updated);
  };

  // Resume Nested Accordion States (All Collapsed by default)
  const [openSkillGroups, setOpenSkillGroups] = useState<Record<string, boolean>>({});
  const toggleSkillGroup = (id: string) => {
    setOpenSkillGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [openExperienceRecords, setOpenExperienceRecords] = useState<Record<string, boolean>>({});
  const toggleExperienceRecord = (id: string) => {
    setOpenExperienceRecords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [openEducationRecords, setOpenEducationRecords] = useState<Record<string, boolean>>({});
  const toggleEducationRecord = (id: string) => {
    setOpenEducationRecords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Nested Accordions for Repeatable Items (Milestones, Principles, Focus Areas)
  const [openMilestones, setOpenMilestones] = useState<Record<string, boolean>>({});
  const toggleMilestone = (key: string) => {
    setOpenMilestones((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [openPrinciples, setOpenPrinciples] = useState<Record<string, boolean>>({});
  const togglePrinciple = (key: string) => {
    setOpenPrinciples((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [openFocusAreas, setOpenFocusAreas] = useState<Record<string, boolean>>({});
  const toggleFocusArea = (key: string) => {
    setOpenFocusAreas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Uses Content Top-Level Accordion States (All Collapsed by default)
  const [usesOpenSections, setUsesOpenSections] = useState<Record<string, boolean>>({
    header: false,
    dailyStack: false,
    developmentStack: false,
    howIBuild: false,
    mySetup: false,
    currentlyExploring: false,
  });

  const toggleUsesSection = (key: string) => {
    setUsesOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllUsesSections = () => {
    const keys = ["header", "dailyStack", "developmentStack", "howIBuild", "mySetup", "currentlyExploring"];
    const allOpen = keys.every((k) => usesOpenSections[k]);
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    keys.forEach((k) => {
      updated[k] = nextState;
    });
    setUsesOpenSections(updated);
  };

  // Uses Nested Item Accordion States (All Collapsed by default)
  const [openDailyStackItems, setOpenDailyStackItems] = useState<Record<string, boolean>>({});
  const toggleDailyStackItem = (id: string) => {
    setOpenDailyStackItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [openDevStackItems, setOpenDevStackItems] = useState<Record<string, boolean>>({});
  const toggleDevStackItem = (id: string) => {
    setOpenDevStackItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [openBuildStepItems, setOpenBuildStepItems] = useState<Record<string, boolean>>({});
  const toggleBuildStepItem = (id: string) => {
    setOpenBuildStepItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [openMySetupItems, setOpenMySetupItems] = useState<Record<string, boolean>>({
    mainMachine: false,
    fuel: false,
    currentStatus: false,
  });
  const toggleMySetupItem = (key: string) => {
    setOpenMySetupItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [openExploringItems, setOpenExploringItems] = useState<Record<string, boolean>>({});
  const toggleExploringItem = (id: string) => {
    setOpenExploringItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Rawin Orbit Content Top-Level Accordion States (All Collapsed by default)
  const [orbitOpenSections, setOrbitOpenSections] = useState<Record<string, boolean>>({
    interface: false,
    prompts: false,
    verification: false,
  });

  const toggleOrbitSection = (key: string) => {
    setOrbitOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllOrbitSections = () => {
    const keys = ["interface", "prompts", "verification"];
    const allOpen = keys.every((k) => orbitOpenSections[k]);
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    keys.forEach((k) => {
      updated[k] = nextState;
    });
    setOrbitOpenSections(updated);
  };

  // Resume PDF & complex states
  const [resumePdfLoading, setResumePdfLoading] = useState<"upload" | "remove" | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [showPdfRemoveConfirm, setShowPdfRemoveConfirm] = useState(false);
  const [newSkillText, setNewSkillText] = useState<Record<string, string>>({});
  const [newBulletText, setNewBulletText] = useState<Record<string, string>>({});

  const handleFileSelect = (assetType: AssetKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFiles((prev) => ({ ...prev, [assetType]: file }));
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrls((prev) => ({ ...prev, [assetType]: objectUrl }));
  };

  const handleAssetUpload = async (assetType: AssetKey) => {
    const file = selectedFiles[assetType];
    if (!file) return;

    setAssetLoading(assetType + "-upload");
    setFeedback(null);

    const formData = new FormData();
    formData.append("assetType", assetType);
    formData.append("action", "upload");
    formData.append("file", file);
    formData.append("alt", assetAlts[assetType]);

    try {
      const res = await updateAssetAction(formData);
      setFeedback(res);
      if (res.success) {
        setSelectedFiles((prev) => ({ ...prev, [assetType]: null }));
        const newUrl = res.url || (res.fileId ? `/api/assets/${assetType}/${res.fileId}` : `/api/assets/${assetType}`);
        setPreviewUrls((prev) => ({ ...prev, [assetType]: null }));
        setAssetUrls((prev) => ({ ...prev, [assetType]: newUrl }));
        setContent((prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            [assetType]: {
              ...prev.assets[assetType],
              url: newUrl,
              alt: assetAlts[assetType],
            },
          },
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ error: msg });
    } finally {
      setAssetLoading(null);
    }
  };

  const handleAssetSaveMeta = async (assetType: AssetKey) => {
    setAssetLoading(assetType + "-meta");
    setFeedback(null);

    const formData = new FormData();
    formData.append("assetType", assetType);
    formData.append("action", "updateMeta");
    formData.append("url", assetUrls[assetType]);
    formData.append("alt", assetAlts[assetType]);

    try {
      const res = await updateAssetAction(formData);
      setFeedback(res);
      if (res.success) {
        setContent((prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            [assetType]: {
              ...prev.assets[assetType],
              url: assetUrls[assetType],
              alt: assetAlts[assetType],
            },
          },
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ error: msg });
    } finally {
      setAssetLoading(null);
    }
  };

  const handleAssetReset = async (assetType: AssetKey) => {
    setAssetLoading(assetType + "-reset");
    setFeedback(null);

    const formData = new FormData();
    formData.append("assetType", assetType);
    formData.append("action", "reset");

    try {
      const res = await updateAssetAction(formData);
      setFeedback(res);
      if (res.success) {
        setSelectedFiles((prev) => ({ ...prev, [assetType]: null }));
        setPreviewUrls((prev) => ({ ...prev, [assetType]: null }));
        const defaultUrls: Record<AssetKey, string> = {
          profilePhoto: "/images/profile.png",
          logo: "/images/logo.png",
          favicon: "/favicon.png",
        };
        const defUrl = defaultUrls[assetType];
        setAssetUrls((prev) => ({ ...prev, [assetType]: defUrl }));
        setContent((prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            [assetType]: {
              ...prev.assets[assetType],
              url: defUrl,
            },
          },
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ error: msg });
    } finally {
      setAssetLoading(null);
    }
  };

  const handleFieldChange = (section: ContentSectionKey, field: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleMySetupField = (
    field: "mainMachine" | "fuel" | "currentStatus",
    prop: "label" | "value" | "description",
    val: string
  ) => {
    setContent((prev) => {
      const currentSetup = prev.uses?.mySetup || {
        mainMachine: {
          label: "Main machine",
          value: "Windows PC",
          description: "Workstation configured for daily development.",
        },
        fuel: {
          label: "Fuel",
          value: "Passion to build something worth showing.",
          description: "Curiosity and focused craftsmanship driving every commit.",
        },
        currentStatus: {
          label: "Current status",
          value: "Probably coding.",
          description: "In editor tabs, components, or edge deployments.",
        },
      };
      return {
        ...prev,
        uses: {
          ...prev.uses,
          mySetup: {
            ...currentSetup,
            [field]: {
              ...currentSetup[field],
              [prop]: val,
            },
          },
        },
      };
    });
  };

  // Uses Daily Stack Handlers
  const handleAddDailyStackItem = () => {
    const newId = `tool-${Date.now()}`;
    setContent((prev) => {
      const currentList = prev.uses?.dailyStack || [];
      const nextOrder =
        currentList.length > 0
          ? Math.max(...currentList.map((i) => i.order || 0)) + 1
          : 1;
      return {
        ...prev,
        uses: {
          ...prev.uses,
          dailyStack: [
            ...currentList,
            {
              id: newId,
              name: "New Tool",
              category: "Tool",
              description: "Primary tool for everyday development.",
              icon: "terminal",
              order: nextOrder,
              enabled: true,
            },
          ],
        },
      };
    });
    setUsesOpenSections((prev) => ({ ...prev, dailyStack: true }));
    setOpenDailyStackItems((prev) => ({ ...prev, [newId]: true }));
  };

  const handleUpdateDailyStackItem = (
    index: number,
    field: keyof DailyStackItem,
    val: any
  ) => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.dailyStack || [])];
      if (!currentList[index]) return prev;
      currentList[index] = {
        ...currentList[index],
        [field]: val,
      };
      return {
        ...prev,
        uses: {
          ...prev.uses,
          dailyStack: currentList,
        },
      };
    });
  };

  const handleDeleteDailyStackItem = (index: number) => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.dailyStack || [])];
      currentList.splice(index, 1);
      const reindexed = currentList.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));
      return {
        ...prev,
        uses: {
          ...prev.uses,
          dailyStack: reindexed,
        },
      };
    });
  };

  const handleMoveDailyStackItem = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.dailyStack || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentList.length) return prev;
      const temp = currentList[index];
      currentList[index] = currentList[targetIndex];
      currentList[targetIndex] = temp;
      const reindexed = currentList.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));
      return {
        ...prev,
        uses: {
          ...prev.uses,
          dailyStack: reindexed,
        },
      };
    });
  };

  // Uses Development Stack Handlers
  const handleAddDevStackItem = () => {
    const newId = `tech-${Date.now()}`;
    setContent((prev) => {
      const currentList = prev.uses?.developmentStack || [];
      const nextOrder =
        currentList.length > 0
          ? Math.max(...currentList.map((i) => i.displayOrder || 0)) + 1
          : 1;
      return {
        ...prev,
        uses: {
          ...prev.uses,
          developmentStack: [
            ...currentList,
            {
              id: newId,
              name: "New Technology",
              description: "Technology role and architecture details.",
              category: "Framework",
              group: "Core Architecture",
              icon: "layers",
              displayOrder: nextOrder,
              enabled: true,
            },
          ],
        },
      };
    });
    setUsesOpenSections((prev) => ({ ...prev, developmentStack: true }));
    setOpenDevStackItems((prev) => ({ ...prev, [newId]: true }));
  };

  const handleUpdateDevStackItem = (
    index: number,
    field: keyof DevStackItem,
    val: any
  ) => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.developmentStack || [])];
      if (!currentList[index]) return prev;
      currentList[index] = {
        ...currentList[index],
        [field]: val,
      };
      return {
        ...prev,
        uses: {
          ...prev.uses,
          developmentStack: currentList,
        },
      };
    });
  };

  const handleDeleteDevStackItem = (index: number) => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.developmentStack || [])];
      currentList.splice(index, 1);
      const reindexed = currentList.map((item, idx) => ({
        ...item,
        displayOrder: idx + 1,
      }));
      return {
        ...prev,
        uses: {
          ...prev.uses,
          developmentStack: reindexed,
        },
      };
    });
  };

  const handleMoveDevStackItem = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.developmentStack || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentList.length) return prev;
      const temp = currentList[index];
      currentList[index] = currentList[targetIndex];
      currentList[targetIndex] = temp;
      const reindexed = currentList.map((item, idx) => ({
        ...item,
        displayOrder: idx + 1,
      }));
      return {
        ...prev,
        uses: {
          ...prev.uses,
          developmentStack: reindexed,
        },
      };
    });
  };

  // Uses How I Build Handlers
  const handleAddBuildStepItem = () => {
    const newId = `step-${Date.now()}`;
    setContent((prev) => {
      const currentList = prev.uses?.howIBuild || [];
      const nextOrder =
        currentList.length > 0
          ? Math.max(...currentList.map((i) => i.order || 0)) + 1
          : 1;
      const numStr = nextOrder < 10 ? `0${nextOrder}` : `${nextOrder}`;
      return {
        ...prev,
        uses: {
          ...prev.uses,
          howIBuild: [
            ...currentList,
            {
              id: newId,
              step: numStr,
              number: numStr,
              title: "New Phase",
              description: "Phase description and development methodology.",
              order: nextOrder,
              enabled: true,
            },
          ],
        },
      };
    });
    setUsesOpenSections((prev) => ({ ...prev, howIBuild: true }));
    setOpenBuildStepItems((prev) => ({ ...prev, [newId]: true }));
  };

  const handleUpdateBuildStepItem = (
    index: number,
    field: keyof BuildStepItem,
    val: any
  ) => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.howIBuild || [])];
      if (!currentList[index]) return prev;
      currentList[index] = {
        ...currentList[index],
        [field]: val,
      };
      return {
        ...prev,
        uses: {
          ...prev.uses,
          howIBuild: currentList,
        },
      };
    });
  };

  const handleDeleteBuildStepItem = (index: number) => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.howIBuild || [])];
      currentList.splice(index, 1);
      const reindexed = currentList.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));
      return {
        ...prev,
        uses: {
          ...prev.uses,
          howIBuild: reindexed,
        },
      };
    });
  };

  const handleMoveBuildStepItem = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.howIBuild || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentList.length) return prev;
      const temp = currentList[index];
      currentList[index] = currentList[targetIndex];
      currentList[targetIndex] = temp;
      const reindexed = currentList.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));
      return {
        ...prev,
        uses: {
          ...prev.uses,
          howIBuild: reindexed,
        },
      };
    });
  };

  const handleAddExploringItem = () => {
    const newId = `exp-${Date.now()}`;
    setContent((prev) => {
      const currentList = prev.uses?.currentlyExploring || [];
      const nextOrder =
        currentList.length > 0
          ? Math.max(...currentList.map((i) => i.displayOrder || 0)) + 1
          : 1;
      return {
        ...prev,
        uses: {
          ...prev.uses,
          currentlyExploring: [
            ...currentList,
            {
              id: newId,
              name: "New Topic",
              description: "Research notes and exploration objectives.",
              category: "Architecture",
              icon: "compass",
              displayOrder: nextOrder,
              enabled: true,
            },
          ],
        },
      };
    });
    setUsesOpenSections((prev) => ({ ...prev, currentlyExploring: true }));
    setOpenExploringItems((prev) => ({ ...prev, [newId]: true }));
  };

  const handleUpdateExploringItem = (
    index: number,
    field: keyof ExploringItem,
    val: any
  ) => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.currentlyExploring || [])];
      if (!currentList[index]) return prev;
      currentList[index] = {
        ...currentList[index],
        [field]: val,
      };
      return {
        ...prev,
        uses: {
          ...prev.uses,
          currentlyExploring: currentList,
        },
      };
    });
  };

  const handleDeleteExploringItem = (index: number) => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.currentlyExploring || [])];
      currentList.splice(index, 1);
      const reindexed = currentList.map((item, idx) => ({
        ...item,
        displayOrder: idx + 1,
      }));
      return {
        ...prev,
        uses: {
          ...prev.uses,
          currentlyExploring: reindexed,
        },
      };
    });
  };

  const handleMoveExploringItem = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const currentList = [...(prev.uses?.currentlyExploring || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentList.length) return prev;
      const temp = currentList[index];
      currentList[index] = currentList[targetIndex];
      currentList[targetIndex] = temp;
      const reindexed = currentList.map((item, idx) => ({
        ...item,
        displayOrder: idx + 1,
      }));
      return {
        ...prev,
        uses: {
          ...prev.uses,
          currentlyExploring: reindexed,
        },
      };
    });
  };

  // About Milestone Label Handlers
  const handleMilestoneLabelChange = (
    field: "milestone01" | "milestone02" | "milestone03" | "currentEra",
    val: string
  ) => {
    setContent((prev) => {
      const currentLabels = prev.about?.milestoneLabels || {
        milestone01: "2022 Milestone",
        milestone02: "2023 Milestone",
        milestone03: "2026 Milestone",
        currentEra: "CURRENT ERA",
      };
      return {
        ...prev,
        about: {
          ...prev.about,
          milestoneLabels: {
            ...currentLabels,
            [field]: val,
          },
        },
      };
    });
  };

  // About Evolution Handlers
  const handleAddMilestone = () => {
    setContent((prev) => {
      const current = [...(prev.about?.evolution || [])];
      const newMilestone: EvolutionMilestoneItem = {
        id: `milestone-${Date.now()}`,
        year: String(new Date().getFullYear()),
        label: "NEW MILESTONE",
        progression: "I am advancing.",
        title: "New Milestone",
        domain: "rawin.dev",
        description: "Description of this milestone.",
        technologies: ["Next.js", "TypeScript"],
        url: "",
        status: "archived",
        isCurrent: false,
        preview: "/images/evolution-2026.png",
        previewAlt: "New milestone preview",
        ctaText: "VIEW WEBSITE",
        displayOrder: current.length + 1,
      };
      return {
        ...prev,
        about: {
          ...prev.about,
          evolution: [...current, newMilestone],
        },
      };
    });
  };

  const handleUpdateMilestone = (
    index: number,
    field: keyof EvolutionMilestoneItem,
    value: any
  ) => {
    setContent((prev) => {
      const current = [...(prev.about?.evolution || [])];
      if (!current[index]) return prev;

      if (field === "isCurrent") {
        const isNowCurrent = Boolean(value);
        const updated = current.map((m, idx) => {
          if (idx === index) {
            return {
              ...m,
              isCurrent: isNowCurrent,
              status: isNowCurrent ? ("current" as const) : ("archived" as const),
              ctaText: isNowCurrent ? "YOU ARE HERE" : m.ctaText === "YOU ARE HERE" ? "VIEW WEBSITE" : m.ctaText,
            };
          } else if (isNowCurrent) {
            return {
              ...m,
              isCurrent: false,
              status: "archived" as const,
              ctaText: m.ctaText === "YOU ARE HERE" ? "VIEW WEBSITE" : m.ctaText,
            };
          }
          return m;
        });
        return {
          ...prev,
          about: {
            ...prev.about,
            evolution: updated,
          },
        };
      }

      current[index] = {
        ...current[index],
        [field]: value,
      };

      return {
        ...prev,
        about: {
          ...prev.about,
          evolution: current,
        },
      };
    });
  };

  const handleDeleteMilestone = (index: number) => {
    setContent((prev) => {
      const current = [...(prev.about?.evolution || [])];
      current.splice(index, 1);
      const reindexed = current.map((m, idx) => ({
        ...m,
        displayOrder: idx + 1,
      }));
      return {
        ...prev,
        about: {
          ...prev.about,
          evolution: reindexed,
        },
      };
    });
  };

  const handleMoveMilestone = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const current = [...(prev.about?.evolution || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return prev;
      const temp = current[index];
      current[index] = current[targetIndex];
      current[targetIndex] = temp;
      const reindexed = current.map((m, idx) => ({
        ...m,
        displayOrder: idx + 1,
      }));
      return {
        ...prev,
        about: {
          ...prev.about,
          evolution: reindexed,
        },
      };
    });
  };

  const handleUploadMilestoneImage = async (index: number, file: File) => {
    const milestone = content.about?.evolution?.[index];
    if (!milestone || !file) return;

    setMilestoneLoading(`milestone-${index}`);
    setFeedback(null);

    const formData = new FormData();
    formData.append("milestoneId", milestone.id || `m-${index}`);
    formData.append("file", file);

    try {
      const res = await uploadMilestoneImageAction(formData);
      if (res.error) {
        setFeedback({ error: res.error });
      } else if (res.url) {
        handleUpdateMilestone(index, "preview", res.url);
        setFeedback({ success: true, message: `Image uploaded for ${milestone.year} milestone.` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setFeedback({ error: msg });
    } finally {
      setMilestoneLoading(null);
    }
  };

  const handleResetMilestoneImage = (index: number) => {
    const milestone = content.about?.evolution?.[index];
    if (!milestone) return;
    const defaultImg = `/images/evolution-${milestone.year || "2026"}.png`;
    handleUpdateMilestone(index, "preview", defaultImg);
    setFeedback({ success: true, message: `Milestone preview reset to ${defaultImg}` });
  };

  // About Principles Handlers
  const handleAddPrinciple = () => {
    setContent((prev) => {
      const current = [...(prev.about?.principles || [])];
      const newPrinciple: AboutPrincipleItem = {
        id: `principle-${Date.now()}`,
        number: `0${current.length + 1}`,
        title: "NEW PRINCIPLE",
        statement: "Principle statement goes here.",
        icon: "layers",
        displayOrder: current.length + 1,
      };
      return {
        ...prev,
        about: {
          ...prev.about,
          principles: [...current, newPrinciple],
        },
      };
    });
  };

  const handleUpdatePrinciple = (
    index: number,
    field: keyof AboutPrincipleItem,
    value: any
  ) => {
    setContent((prev) => {
      const current = [...(prev.about?.principles || [])];
      if (!current[index]) return prev;
      current[index] = { ...current[index], [field]: value };
      return {
        ...prev,
        about: {
          ...prev.about,
          principles: current,
        },
      };
    });
  };

  const handleDeletePrinciple = (index: number) => {
    setContent((prev) => {
      const current = [...(prev.about?.principles || [])];
      current.splice(index, 1);
      const reindexed = current.map((p, idx) => ({ ...p, displayOrder: idx + 1 }));
      return {
        ...prev,
        about: {
          ...prev.about,
          principles: reindexed,
        },
      };
    });
  };

  const handleMovePrinciple = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const current = [...(prev.about?.principles || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return prev;
      const temp = current[index];
      current[index] = current[targetIndex];
      current[targetIndex] = temp;
      const reindexed = current.map((p, idx) => ({ ...p, displayOrder: idx + 1 }));
      return {
        ...prev,
        about: {
          ...prev.about,
          principles: reindexed,
        },
      };
    });
  };

  // About Focus Areas Handlers
  const handleAddFocusArea = () => {
    setContent((prev) => {
      const current = [...(prev.about?.focusAreas || [])];
      const newFocus: AboutFocusItem = {
        id: `focus-${Date.now()}`,
        title: "NEW FOCUS AREA",
        description: "Description of what you are building toward.",
        icon: "terminal",
        displayOrder: current.length + 1,
      };
      return {
        ...prev,
        about: {
          ...prev.about,
          focusAreas: [...current, newFocus],
        },
      };
    });
  };

  const handleUpdateFocusArea = (
    index: number,
    field: keyof AboutFocusItem,
    value: any
  ) => {
    setContent((prev) => {
      const current = [...(prev.about?.focusAreas || [])];
      if (!current[index]) return prev;
      current[index] = { ...current[index], [field]: value };
      return {
        ...prev,
        about: {
          ...prev.about,
          focusAreas: current,
        },
      };
    });
  };

  const handleDeleteFocusArea = (index: number) => {
    setContent((prev) => {
      const current = [...(prev.about?.focusAreas || [])];
      current.splice(index, 1);
      const reindexed = current.map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
      return {
        ...prev,
        about: {
          ...prev.about,
          focusAreas: reindexed,
        },
      };
    });
  };

  const handleMoveFocusArea = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const current = [...(prev.about?.focusAreas || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return prev;
      const temp = current[index];
      current[index] = current[targetIndex];
      current[targetIndex] = temp;
      const reindexed = current.map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
      return {
        ...prev,
        about: {
          ...prev.about,
          focusAreas: reindexed,
        },
      };
    });
  };

  // Hero Typing Phrases Handlers
  const handleAddHeroPhrase = () => {
    setContent((prev) => {
      const current = [...(prev.home?.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || [])];
      current.push("New Hero Phrase");
      return {
        ...prev,
        home: {
          ...prev.home,
          heroTypingPhrases: current,
        },
      };
    });
  };

  const handleUpdateHeroPhrase = (index: number, value: string) => {
    setContent((prev) => {
      const current = [...(prev.home?.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || [])];
      current[index] = value;
      return {
        ...prev,
        home: {
          ...prev.home,
          heroTypingPhrases: current,
        },
      };
    });
  };

  const handleDeleteHeroPhrase = (index: number) => {
    setContent((prev) => {
      const current = [...(prev.home?.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || [])];
      if (current.length <= 1) {
        setFeedback({ error: "At least one Hero typing phrase is required." });
        return prev;
      }
      current.splice(index, 1);
      return {
        ...prev,
        home: {
          ...prev.home,
          heroTypingPhrases: current,
        },
      };
    });
  };

  const handleMoveHeroPhrase = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const current = [...(prev.home?.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return prev;
      const temp = current[index];
      current[index] = current[targetIndex];
      current[targetIndex] = temp;
      return {
        ...prev,
        home: {
          ...prev.home,
          heroTypingPhrases: current,
        },
      };
    });
  };

  // Rawin Orbit Suggested Prompts Handlers
  const handleAddPrompt = () => {
    setContent((prev) => {
      const current = [...(prev.ai?.suggestedPrompts || [])];
      current.push("New suggested question or prompt");
      return {
        ...prev,
        ai: {
          ...prev.ai,
          suggestedPrompts: current,
        },
      };
    });
    setOrbitOpenSections((prev) => ({ ...prev, prompts: true }));
  };

  const handleUpdatePrompt = (index: number, value: string) => {
    setContent((prev) => {
      const current = [...(prev.ai?.suggestedPrompts || [])];
      current[index] = value;
      return {
        ...prev,
        ai: {
          ...prev.ai,
          suggestedPrompts: current,
        },
      };
    });
  };

  const handleDeletePrompt = (index: number) => {
    setContent((prev) => {
      const current = [...(prev.ai?.suggestedPrompts || [])];
      current.splice(index, 1);
      return {
        ...prev,
        ai: {
          ...prev.ai,
          suggestedPrompts: current,
        },
      };
    });
  };

  const handleMovePrompt = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const current = [...(prev.ai?.suggestedPrompts || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return prev;
      const temp = current[index];
      current[index] = current[targetIndex];
      current[targetIndex] = temp;
      return {
        ...prev,
        ai: {
          ...prev.ai,
          suggestedPrompts: current,
        },
      };
    });
  };

  // Resume CMS Handlers
  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFeedback({ error: "Only PDF files (.pdf) are allowed." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ error: "File size exceeds the 10MB limit." });
      return;
    }
    setSelectedPdfFile(file);
    setFeedback(null);
  };

  const handleUploadResumePdf = async () => {
    if (!selectedPdfFile) return;
    setResumePdfLoading("upload");
    setFeedback(null);

    const formData = new FormData();
    formData.append("file", selectedPdfFile);

    try {
      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        setFeedback({ error: data.error || "Failed to upload resume PDF." });
        return;
      }

      setFeedback({ success: data.message || "Resume PDF uploaded successfully." });
      setSelectedPdfFile(null);
      setContent((prev) => ({
        ...prev,
        resume: {
          ...prev.resume,
          pdf: data.pdf || {
            fileId: "uploaded",
            filename: selectedPdfFile.name,
            url: "/api/resume/download",
            size: selectedPdfFile.size,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload resume PDF.";
      setFeedback({ error: msg });
    } finally {
      setResumePdfLoading(null);
    }
  };

  const handleRemoveResumePdf = async () => {
    setResumePdfLoading("remove");
    setFeedback(null);
    try {
      const res = await removeResumePdfAction();
      setFeedback(res);
      if (res.success) {
        setShowPdfRemoveConfirm(false);
        setContent((prev) => ({
          ...prev,
          resume: {
            ...prev.resume,
            pdf: null,
          },
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove resume PDF.";
      setFeedback({ error: msg });
    } finally {
      setResumePdfLoading(null);
    }
  };

  const handleResumeContact = (field: "location" | "email" | "website", val: string) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        contact: {
          ...prev.resume.contact,
          [field]: val,
        },
      },
    }));
  };

  const handleContactSocial = (field: "github" | "linkedin" | "twitter" | "instagram", val: string) => {
    setContent((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        socials: {
          ...(prev.contact.socials || { github: "", linkedin: "", twitter: "", instagram: "" }),
          [field]: val,
        },
      },
    }));
  };

  const handleContactFormPlaceholder = (
    field: "namePlaceholder" | "emailPlaceholder" | "phonePlaceholder" | "subjectPlaceholder" | "messagePlaceholder",
    val: string
  ) => {
    setContent((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        form: {
          ...(prev.contact.form || {
            namePlaceholder: "",
            emailPlaceholder: "",
            phonePlaceholder: "",
            subjectPlaceholder: "",
            messagePlaceholder: "",
          }),
          [field]: val,
        },
      },
    }));
  };

  const handleResumeStatus = (field: "text" | "indicator", val: string) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        status: {
          ...prev.resume.status,
          [field]: val,
        },
      },
    }));
  };

  const handleResumeCta = (field: "heading" | "description" | "buttonText", val: string) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        cta: {
          ...prev.resume.cta,
          [field]: val,
        },
      },
    }));
  };

  const addSkillGroup = () => {
    setContent((prev) => {
      const current = prev.resume?.skills || [];
      const newGroup: ResumeSkillGroup = {
        id: "group-" + Date.now(),
        title: "New Category",
        skills: [],
        displayOrder: current.length + 1,
      };
      return {
        ...prev,
        resume: {
          ...prev.resume,
          skills: [...current, newGroup],
        },
      };
    });
  };

  const removeSkillGroup = (id: string) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        skills: (prev.resume?.skills || []).filter((g) => g.id !== id),
      },
    }));
  };

  const updateSkillGroupTitle = (id: string, title: string) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        skills: (prev.resume?.skills || []).map((g) => (g.id === id ? { ...g, title } : g)),
      },
    }));
  };

  const moveSkillGroup = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const list = [...(prev.resume?.skills || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      const reindexed = list.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
      return {
        ...prev,
        resume: {
          ...prev.resume,
          skills: reindexed,
        },
      };
    });
  };

  const addSkillToGroup = (groupId: string) => {
    const text = (newSkillText[groupId] || "").trim();
    if (!text) return;
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        skills: (prev.resume?.skills || []).map((g) =>
          g.id === groupId && !g.skills.includes(text) ? { ...g, skills: [...g.skills, text] } : g
        ),
      },
    }));
    setNewSkillText((prev) => ({ ...prev, [groupId]: "" }));
  };

  const removeSkillFromGroup = (groupId: string, skillIndex: number) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        skills: (prev.resume?.skills || []).map((g) =>
          g.id === groupId ? { ...g, skills: g.skills.filter((_, i) => i !== skillIndex) } : g
        ),
      },
    }));
  };

  const addExperienceItem = () => {
    setContent((prev) => {
      const current = prev.resume?.experience || [];
      const newItem: ResumeExperienceItem = {
        id: "exp-" + Date.now(),
        role: "Full Stack Developer",
        organization: "Company or Project",
        startDate: "2024",
        endDate: "",
        current: true,
        location: "Remote",
        bullets: ["Describe responsibilities and accomplishments."],
        displayOrder: current.length + 1,
      };
      return {
        ...prev,
        resume: {
          ...prev.resume,
          experience: [...current, newItem],
        },
      };
    });
  };

  const removeExperienceItem = (id: string) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        experience: (prev.resume?.experience || []).filter((e) => e.id !== id),
      },
    }));
  };

  const updateExperienceField = (id: string, field: string, val: any) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        experience: (prev.resume?.experience || []).map((e) =>
          e.id === id ? { ...e, [field]: val } : e
        ),
      },
    }));
  };

  const moveExperienceItem = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const list = [...(prev.resume?.experience || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      const reindexed = list.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
      return {
        ...prev,
        resume: {
          ...prev.resume,
          experience: reindexed,
        },
      };
    });
  };

  const addBulletToExperience = (expId: string) => {
    const text = (newBulletText[expId] || "").trim();
    if (!text) return;
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        experience: (prev.resume?.experience || []).map((e) =>
          e.id === expId ? { ...e, bullets: [...e.bullets, text] } : e
        ),
      },
    }));
    setNewBulletText((prev) => ({ ...prev, [expId]: "" }));
  };

  const removeBulletFromExperience = (expId: string, bulletIndex: number) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        experience: (prev.resume?.experience || []).map((e) =>
          e.id === expId ? { ...e, bullets: e.bullets.filter((_, i) => i !== bulletIndex) } : e
        ),
      },
    }));
  };

  const updateBulletInExperience = (expId: string, bulletIndex: number, text: string) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        experience: (prev.resume?.experience || []).map((e) => {
          if (e.id !== expId) return e;
          const bullets = [...e.bullets];
          bullets[bulletIndex] = text;
          return { ...e, bullets };
        }),
      },
    }));
  };

  const addEducationItem = () => {
    setContent((prev) => {
      const current = prev.resume?.education || [];
      const newItem: ResumeEducationItem = {
        id: "edu-" + Date.now(),
        degree: "Degree / Program",
        institution: "Institution / University",
        location: "City, Country",
        startDate: "2021",
        endDate: "2024",
        description: "",
        displayOrder: current.length + 1,
      };
      return {
        ...prev,
        resume: {
          ...prev.resume,
          education: [...current, newItem],
        },
      };
    });
  };

  const removeEducationItem = (id: string) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        education: (prev.resume?.education || []).filter((e) => e.id !== id),
      },
    }));
  };

  const updateEducationField = (id: string, field: string, val: any) => {
    setContent((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        education: (prev.resume?.education || []).map((e) =>
          e.id === id ? { ...e, [field]: val } : e
        ),
      },
    }));
  };

  const moveEducationItem = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const list = [...(prev.resume?.education || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      const reindexed = list.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
      return {
        ...prev,
        resume: {
          ...prev.resume,
          education: reindexed,
        },
      };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateSectionAction(activeTab as ContentSectionKey, null, formData);
      setFeedback(result);
    });
  };

  const currentSection = SECTIONS.find((s) => s.key === activeTab)!;

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      {/* Desktop Tab Selector Bar (>= sm) */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] w-full">
        {SECTIONS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setFeedback(null);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-pacific-cyan text-ink-black font-semibold shadow-[0_0_15px_rgba(24,155,173,0.3)]"
                  : "text-muted hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Smartphone Horizontal Scrolling Section Navigation (< sm) */}
      <div className="flex sm:hidden flex-col gap-2 w-full max-w-full">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted font-semibold">
            Content Sections
          </span>
          <span className="text-[10px] font-mono text-pacific-cyan">
            {currentSection.label} active
          </span>
        </div>

        <div className="w-full max-w-full overflow-x-auto flex-nowrap flex items-center gap-2 py-2.5 px-0.5 -my-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {SECTIONS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setFeedback(null);
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium shrink-0 transition-all cursor-pointer select-none whitespace-nowrap min-h-[42px] ${
                  isActive
                    ? "bg-pacific-cyan/15 text-pacific-cyan font-semibold border border-pacific-cyan/60 ring-1 ring-pacific-cyan/30 shadow-[0_0_8px_rgba(24,155,173,0.2)]"
                    : "text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]"
                }`}
              >
                <div
                  className={`p-1 rounded-lg shrink-0 ${
                    isActive
                      ? "bg-pacific-cyan/20 text-pacific-cyan"
                      : "bg-white/[0.04] text-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Feedback Notification */}
      {feedback?.success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-emerald-300 text-xs font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-400/70 hover:text-emerald-300 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {feedback?.error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-between gap-3 text-red-300 text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{feedback.error}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-red-400/70 hover:text-red-300 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Orbit Knowledge Base Manager */}
      {activeTab === "orbit-knowledge" ? (
        <OrbitKnowledgeManager initialItems={initialKnowledge || []} />
      ) : activeTab === "assets" ? (
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 text-pacific-cyan shrink-0">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="text-base sm:text-lg font-bold font-space text-foreground truncate">
                  Visual Identity &amp; Site Assets
                </h2>
                <span className="text-[10px] sm:text-xs font-mono text-muted truncate">
                  Brand imagery and icon management
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleAllAssetSections}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors cursor-pointer select-none shrink-0"
              title={
                (["profilePhoto", "logo", "favicon"] as AssetKey[]).every((k) => openAssetSections[k])
                  ? "Collapse all sections"
                  : "Expand all sections"
              }
              aria-label={
                (["profilePhoto", "logo", "favicon"] as AssetKey[]).every((k) => openAssetSections[k])
                  ? "Collapse all sections"
                  : "Expand all sections"
              }
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
              <span className="hidden sm:inline">
                {(["profilePhoto", "logo", "favicon"] as AssetKey[]).every((k) => openAssetSections[k])
                  ? "Collapse All"
                  : "Expand All"}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Accordion 1: Profile Photo */}
            <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
              <button
                type="button"
                onClick={() => toggleAssetSection("profilePhoto")}
                aria-expanded={Boolean(openAssetSections.profilePhoto)}
                aria-controls="asset-section-profilePhoto"
                className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-pacific-cyan" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                      Profile Photo
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                      Homepage · About · OpenGraph
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                    {openAssetSections.profilePhoto ? "Collapse" : "Expand"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform duration-200 ${
                      openAssetSections.profilePhoto ? "rotate-180 text-pacific-cyan" : ""
                    }`}
                  />
                </div>
              </button>

              <div
                id="asset-section-profilePhoto"
                role="region"
                aria-label="Profile Photo"
                className={
                  openAssetSections.profilePhoto
                    ? "block p-4 sm:p-6 pt-2 sm:pt-4 border-t border-white/[0.06] flex flex-col gap-5"
                    : "hidden"
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
                  {/* Preview */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-ink-black/40 border border-white/5 text-center gap-3">
                    <div className="relative group">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pacific-cyan/30 via-apricot-cream/20 to-pacific-cyan/30 blur-sm opacity-60"></div>
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-pacific-cyan/50 p-0.5 bg-surface/80 shadow-lg">
                        <img
                          src={previewUrls.profilePhoto || assetUrls.profilePhoto}
                          alt={assetAlts.profilePhoto}
                          className="w-full h-full object-cover rounded-full filter contrast-105"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-mono text-muted">Active Portrait Preview</span>
                      {selectedFiles.profilePhoto && (
                        <span className="text-[10px] font-mono text-emerald-400 break-all">
                          Selected: {selectedFiles.profilePhoto.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="md:col-span-8 flex flex-col gap-4">
                    {/* File Upload */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-muted uppercase font-semibold">
                        Upload
                      </label>
                      <span className="text-[10px] font-mono text-muted/60">
                        PNG · JPG · WEBP · MAX 5MB
                      </span>
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <input
                          id="upload-profilePhoto"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => handleFileSelect("profilePhoto", e)}
                          className="hidden"
                        />
                        <label
                          htmlFor="upload-profilePhoto"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer select-none"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose Image</span>
                        </label>

                        {selectedFiles.profilePhoto ? (
                          <button
                            type="button"
                            onClick={() => handleAssetUpload("profilePhoto")}
                            disabled={assetLoading === "profilePhoto-upload"}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_12px_rgba(24,155,173,0.25)] cursor-pointer disabled:opacity-50"
                          >
                            {assetLoading === "profilePhoto-upload" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>Upload Photo</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Accessible Alt Text */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-muted uppercase font-semibold">
                        Accessible Alt Text
                      </label>
                      <input
                        type="text"
                        value={assetAlts.profilePhoto}
                        onChange={(e) =>
                          setAssetAlts((prev) => ({ ...prev, profilePhoto: e.target.value }))
                        }
                        placeholder="Rushan Siddiqui : Full Stack Developer"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => handleAssetReset("profilePhoto")}
                        disabled={assetLoading === "profilePhoto-reset"}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono text-muted hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/[0.08] hover:border-red-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {assetLoading === "profilePhoto-reset" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        <span>Reset to Default</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAssetSaveMeta("profilePhoto")}
                        disabled={assetLoading === "profilePhoto-meta"}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer disabled:opacity-50"
                      >
                        {assetLoading === "profilePhoto-meta" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Save Alt Text</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion 2: Website Logo */}
            <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
              <button
                type="button"
                onClick={() => toggleAssetSection("logo")}
                aria-expanded={Boolean(openAssetSections.logo)}
                aria-controls="asset-section-logo"
                className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-pacific-cyan" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                      Website Logo
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                      Navbar · Footer · Admin · Login
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                    {openAssetSections.logo ? "Collapse" : "Expand"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform duration-200 ${
                      openAssetSections.logo ? "rotate-180 text-pacific-cyan" : ""
                    }`}
                  />
                </div>
              </button>

              <div
                id="asset-section-logo"
                role="region"
                aria-label="Website Logo"
                className={
                  openAssetSections.logo
                    ? "block p-4 sm:p-6 pt-2 sm:pt-4 border-t border-white/[0.06] flex flex-col gap-5"
                    : "hidden"
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
                  {/* Preview */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-ink-black/40 border border-white/5 text-center gap-3">
                    <div className="relative flex items-center justify-center p-3 sm:p-4 rounded-xl bg-surface/50 border border-white/10 w-full max-w-[200px] min-h-[56px]">
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-xl bg-pacific-cyan/20 blur-md opacity-30 pointer-events-none"
                      />
                      <img
                        src={previewUrls.logo || assetUrls.logo}
                        alt={assetAlts.logo}
                        className="relative h-6 sm:h-7 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(24,155,173,0.35)]"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-mono text-muted">Navbar Glow Simulation</span>
                      {selectedFiles.logo && (
                        <span className="text-[10px] font-mono text-emerald-400 break-all">
                          Selected: {selectedFiles.logo.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="md:col-span-8 flex flex-col gap-4">
                    {/* File Upload */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-muted uppercase font-semibold">
                        Upload
                      </label>
                      <span className="text-[10px] font-mono text-muted/60">
                        PNG · WEBP · MAX 2MB
                      </span>
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <input
                          id="upload-logo"
                          type="file"
                          accept="image/png,image/webp"
                          onChange={(e) => handleFileSelect("logo", e)}
                          className="hidden"
                        />
                        <label
                          htmlFor="upload-logo"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer select-none"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose Logo</span>
                        </label>

                        {selectedFiles.logo ? (
                          <button
                            type="button"
                            onClick={() => handleAssetUpload("logo")}
                            disabled={assetLoading === "logo-upload"}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_12px_rgba(24,155,173,0.25)] cursor-pointer disabled:opacity-50"
                          >
                            {assetLoading === "logo-upload" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>Upload Logo</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Logo Alt / Brand Label */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-muted uppercase font-semibold">
                        Logo Alt / Brand Label
                      </label>
                      <input
                        type="text"
                        value={assetAlts.logo}
                        onChange={(e) =>
                          setAssetAlts((prev) => ({ ...prev, logo: e.target.value }))
                        }
                        placeholder="RAWIN Logo"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => handleAssetReset("logo")}
                        disabled={assetLoading === "logo-reset"}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono text-muted hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/[0.08] hover:border-red-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {assetLoading === "logo-reset" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        <span>Reset to Default</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAssetSaveMeta("logo")}
                        disabled={assetLoading === "logo-meta"}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer disabled:opacity-50"
                      >
                        {assetLoading === "logo-meta" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Save Alt Text</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion 3: Website Favicon */}
            <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
              <button
                type="button"
                onClick={() => toggleAssetSection("favicon")}
                aria-expanded={Boolean(openAssetSections.favicon)}
                aria-controls="asset-section-favicon"
                className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-pacific-cyan" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                      Website Favicon
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                      Browser Tab · Bookmarks · Mobile
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                    {openAssetSections.favicon ? "Collapse" : "Expand"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform duration-200 ${
                      openAssetSections.favicon ? "rotate-180 text-pacific-cyan" : ""
                    }`}
                  />
                </div>
              </button>

              <div
                id="asset-section-favicon"
                role="region"
                aria-label="Website Favicon"
                className={
                  openAssetSections.favicon
                    ? "block p-4 sm:p-6 pt-2 sm:pt-4 border-t border-white/[0.06] flex flex-col gap-5"
                    : "hidden"
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
                  {/* Preview */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-ink-black/40 border border-white/5 text-center gap-3">
                    <div className="w-full max-w-[200px] flex flex-col gap-2">
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface/80 border border-white/10 w-full">
                        <img
                          src={previewUrls.favicon || assetUrls.favicon}
                          alt="Favicon"
                          className="w-4 h-4 object-contain rounded shrink-0"
                        />
                        <span className="text-[10px] font-medium text-foreground truncate">
                          RAWIN | Rushan
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <img
                            src={previewUrls.favicon || assetUrls.favicon}
                            alt="32px Favicon"
                            className="w-7 h-7 object-contain p-1 rounded-lg bg-surface border border-white/10"
                          />
                          <span className="text-[9px] font-mono text-muted">32px</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <img
                            src={previewUrls.favicon || assetUrls.favicon}
                            alt="48px Favicon"
                            className="w-10 h-10 object-contain p-1 rounded-xl bg-surface border border-white/10"
                          />
                          <span className="text-[9px] font-mono text-muted">48px</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-mono text-muted">Browser Tab Mockup</span>
                      {selectedFiles.favicon && (
                        <span className="text-[10px] font-mono text-emerald-400 break-all">
                          Selected: {selectedFiles.favicon.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="md:col-span-8 flex flex-col gap-4">
                    {/* File Upload */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono text-muted uppercase font-semibold">
                        Upload
                      </label>
                      <span className="text-[10px] font-mono text-muted/60">
                        PNG · ICO · WEBP · MAX 1MB
                      </span>
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <input
                          id="upload-favicon"
                          type="file"
                          accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/webp"
                          onChange={(e) => handleFileSelect("favicon", e)}
                          className="hidden"
                        />
                        <label
                          htmlFor="upload-favicon"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer select-none"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose Favicon</span>
                        </label>

                        {selectedFiles.favicon ? (
                          <button
                            type="button"
                            onClick={() => handleAssetUpload("favicon")}
                            disabled={assetLoading === "favicon-upload"}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_12px_rgba(24,155,173,0.25)] cursor-pointer disabled:opacity-50"
                          >
                            {assetLoading === "favicon-upload" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>Upload Favicon</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => handleAssetReset("favicon")}
                        disabled={assetLoading === "favicon-reset"}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono text-muted hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/[0.08] hover:border-red-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {assetLoading === "favicon-reset" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        <span>Reset to Default</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Editor Form Card */
        <form
          onSubmit={handleSubmit}
          className={
            activeTab === "global" || activeTab === "home"
              ? "flex flex-col sm:glass-card sm:rounded-2xl sm:p-8 sm:border sm:border-white/[0.08] gap-4 sm:gap-6"
              : activeTab === "about" || activeTab === "contact" || activeTab === "resume" || activeTab === "uses" || activeTab === "ai"
              ? "glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-6 lg:p-8 border border-white/[0.08] flex flex-col gap-4 sm:gap-6"
              : "glass-card rounded-2xl p-5 sm:p-8 border border-white/[0.08] flex flex-col gap-6"
          }
        >
          {/* Form Header: Hidden on mobile for Global and Home sections since mobile uses its own accordion and bottom save button */}
          <div
            className={`${
              activeTab === "global" || activeTab === "home" ? "hidden sm:flex" : "flex"
            } flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-white/[0.08]`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 text-pacific-cyan">
                <currentSection.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-space text-foreground">
                  {currentSection.label} Content
                </h2>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[40px] h-10 px-4 sm:px-6 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_16px_rgba(24,155,173,0.3)] disabled:opacity-50 cursor-pointer select-none whitespace-nowrap"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save {currentSection.label} Content</span>
                </>
              )}
            </button>
          </div>

          {/* Dynamic Fields Per Section */}
          {activeTab === "global" && (
            <>
              {/* Canonical Hidden Inputs for Reliable Cross-Device Form Submission */}
              <input type="hidden" name="brandName" value={content.global.brandName || ""} />
              <input type="hidden" name="siteTitle" value={content.global.siteTitle || ""} />
              <input type="hidden" name="shortBio" value={content.global.shortBio || ""} />
              <input type="hidden" name="footerAvailabilityBadge" value={content.global.footerAvailabilityBadge || content.global.availabilityBadge || ""} />
              <input type="hidden" name="footerAvailabilityColor" value={content.global.footerAvailabilityColor || content.global.availabilityStatusColor || "green"} />
              <input type="hidden" name="availabilityBadge" value={content.global.footerAvailabilityBadge || content.global.availabilityBadge || ""} />
              <input type="hidden" name="availabilityStatusColor" value={content.global.footerAvailabilityColor || content.global.availabilityStatusColor || "green"} />
              <input type="hidden" name="footerCopyright" value={content.global.footerCopyright || ""} />
              <input type="hidden" name="footerBulletNotification" value={content.global.footerBulletNotification || ""} />
              <input type="hidden" name="contactEmail" value={content.contact?.email || content.global.contactEmail || ""} />
              <input type="hidden" name="location" value={content.contact?.location || content.global.location || ""} />

              {/* Desktop Presentation (>= sm) */}
              <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Brand / Site Name</label>
                  <input
                    type="text"
                    value={content.global.brandName}
                    onChange={(e) => handleFieldChange("global", "brandName", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Site Meta Title</label>
                  <input
                    type="text"
                    value={content.global.siteTitle}
                    onChange={(e) => handleFieldChange("global", "siteTitle", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Footer Availability Badge</label>
                  <input
                    type="text"
                    value={content.global.footerAvailabilityBadge || content.global.availabilityBadge || ""}
                    onChange={(e) => {
                      handleFieldChange("global", "footerAvailabilityBadge", e.target.value);
                      handleFieldChange("global", "availabilityBadge", e.target.value);
                    }}
                    placeholder="Available for collaboration"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Footer Availability Color</label>
                  <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-ink-black/60 border border-white/[0.08]">
                    {(
                      [
                        { value: "green", label: "Green", dot: "bg-emerald-400" },
                        { value: "orange", label: "Orange", dot: "bg-amber-400" },
                        { value: "red", label: "Red", dot: "bg-rose-400" },
                      ] as const
                    ).map((opt) => {
                      const isSelected =
                        (content.global.footerAvailabilityColor ||
                          content.global.availabilityStatusColor ||
                          "green") === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            handleFieldChange("global", "footerAvailabilityColor", opt.value);
                            handleFieldChange("global", "availabilityStatusColor", opt.value);
                          }}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white/10 text-foreground border border-white/20 shadow-sm"
                              : "text-muted hover:text-foreground hover:bg-white/[0.04]"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${opt.dot} ${isSelected ? "ring-2 ring-white/30" : ""}`} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] sm:col-span-2">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Mail className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                    <span>Primary Email and Location are managed in the Contact &amp; Social section.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("contact")}
                    className="text-xs font-mono text-pacific-cyan hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <span>Edit Contact Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Footer Copyright Text</label>
                  <input
                    type="text"
                    value={content.global.footerCopyright}
                    onChange={(e) => handleFieldChange("global", "footerCopyright", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Footer Bullet Notification</label>
                  <input
                    type="text"
                    value={content.global.footerBulletNotification || ""}
                    onChange={(e) => handleFieldChange("global", "footerBulletNotification", e.target.value)}
                    placeholder="BUILDING WITH INTENT • CRAFTING DIGITAL EXPERIENCES • ALWAYS LEARNING"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                  <span className="text-[11px] font-mono text-muted/60">
                    Scrolling notification shown in the mobile footer.
                  </span>
                </div>
              </div>

              {/* Smartphone Presentation (< sm): Collapsible Accordion */}
              <div className="flex sm:hidden flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted font-semibold">
                    Global Content
                  </span>
                  <span className="text-[10px] font-mono text-pacific-cyan/80">
                    {isMobileGlobalOpen ? "Tap to collapse" : "Tap to expand"}
                  </span>
                </div>

                <div className="glass-card rounded-xl border border-white/[0.08] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsMobileGlobalOpen(!isMobileGlobalOpen)}
                    aria-expanded={isMobileGlobalOpen}
                    aria-controls="mobile-global-panel"
                    className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                          Global Content
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              (content.global.footerAvailabilityColor || content.global.availabilityStatusColor) === "red"
                                ? "bg-rose-400"
                                : (content.global.footerAvailabilityColor || content.global.availabilityStatusColor) === "orange"
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            }`}
                          />
                          <span className="text-[11px] font-mono text-muted truncate">
                            {content.global.brandName || "RAWIN"} · {content.global.footerAvailabilityBadge || content.global.availabilityBadge || "Available for collaboration"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted shrink-0">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isMobileGlobalOpen ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    id="mobile-global-panel"
                    role="region"
                    aria-label="Global Content Form"
                    className={isMobileGlobalOpen ? "p-4 sm:p-5 border-t border-white/[0.08] flex flex-col gap-5 bg-ink-black/25" : "hidden"}
                  >
                    {/* IDENTITY Sub-section */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                          Identity
                        </span>
                        <span className="text-[10px] font-mono text-muted/60">
                          Site naming &amp; SEO
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                          Brand
                        </label>
                        <input
                          type="text"
                          value={content.global.brandName}
                          onChange={(e) => handleFieldChange("global", "brandName", e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-base sm:text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                          placeholder="RAWIN"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          value={content.global.siteTitle}
                          onChange={(e) => handleFieldChange("global", "siteTitle", e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-base sm:text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                          placeholder="Site meta title"
                        />
                      </div>
                    </div>

                    {/* AVAILABILITY Sub-section */}
                    <div className="flex flex-col gap-3 pt-1">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                          Availability
                        </span>
                        <span className="text-[10px] font-mono text-muted/60">
                          Work status &amp; badge
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                          Footer Availability Badge
                        </label>
                        <input
                          type="text"
                          value={content.global.footerAvailabilityBadge || content.global.availabilityBadge || ""}
                          onChange={(e) => {
                            handleFieldChange("global", "footerAvailabilityBadge", e.target.value);
                            handleFieldChange("global", "availabilityBadge", e.target.value);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-base sm:text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                          placeholder="Available for collaboration"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                          Footer Availability Color
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-ink-black/80 border border-white/[0.08]">
                          {(
                            [
                              { value: "green", label: "Green", dot: "bg-emerald-400" },
                              { value: "orange", label: "Orange", dot: "bg-amber-400" },
                              { value: "red", label: "Red", dot: "bg-rose-400" },
                            ] as const
                          ).map((opt) => {
                            const isSelected =
                              (content.global.footerAvailabilityColor ||
                                content.global.availabilityStatusColor ||
                                "green") === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  handleFieldChange("global", "footerAvailabilityColor", opt.value);
                                  handleFieldChange("global", "availabilityStatusColor", opt.value);
                                }}
                                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer min-h-[38px] ${
                                  isSelected
                                    ? "bg-white/[0.12] text-foreground border border-white/20 shadow-sm font-semibold"
                                    : "text-muted hover:text-foreground hover:bg-white/[0.04]"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot} ${isSelected ? "ring-2 ring-white/30" : ""}`} />
                                <span className="truncate">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* CONTACT DETAILS Sub-section */}
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                          Contact Details
                        </span>
                        <span className="text-[10px] font-mono text-muted/60">
                          Centralized reference
                        </span>
                      </div>

                      <div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/[0.06] flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-pacific-cyan">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs font-mono font-medium text-foreground">
                            Primary contact details
                          </span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">
                          Email and location are managed in Contact &amp; Social.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("contact");
                            setFeedback(null);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-pacific-cyan hover:underline cursor-pointer self-start min-h-[36px] pt-0.5"
                        >
                          <span>Edit Contact Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* FOOTER Sub-section */}
                    <div className="flex flex-col gap-3 pt-1">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                          Footer
                        </span>
                        <span className="text-[10px] font-mono text-muted/60">
                          Copyright &amp; notice
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                          Copyright
                        </label>
                        <input
                          type="text"
                          value={content.global.footerCopyright}
                          onChange={(e) => handleFieldChange("global", "footerCopyright", e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-base sm:text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                          placeholder="RAWIN. All rights reserved."
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                          Mobile Notification
                        </label>
                        <input
                          type="text"
                          value={content.global.footerBulletNotification || ""}
                          onChange={(e) => handleFieldChange("global", "footerBulletNotification", e.target.value)}
                          placeholder="BUILDING WITH INTENT • CRAFTING DIGITAL EXPERIENCES • ALWAYS LEARNING"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-base sm:text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                        />
                        <span className="text-[10px] font-mono text-muted/60">
                          Ticker text displayed in the mobile footer.
                        </span>
                      </div>
                    </div>

                    {/* Mobile Save Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full min-h-[46px] py-3 px-4 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_24px_rgba(24,155,173,0.35)] disabled:opacity-50 cursor-pointer select-none flex items-center justify-center gap-2"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Global Content</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        {activeTab === "home" && (
          <>
            {/* Canonical Hidden Inputs for Reliable Cross-Device Form Submission */}
            <input type="hidden" name="heroStatus" value={content.home.heroStatus || ""} />
            <input type="hidden" name="heroBadge" value={content.home.heroBadge || ""} />
            <input type="hidden" name="heroStatusColor" value={content.home.heroStatusColor || "green"} />
            <input type="hidden" name="heroTitlePrefix" value={content.home.heroTitlePrefix || ""} />
            <input type="hidden" name="heroName" value={content.home.heroName || ""} />
            <input type="hidden" name="heroBio" value={content.home.heroBio || ""} />
            <input type="hidden" name="heroPrimaryCtaText" value={content.home.heroPrimaryCtaText || ""} />
            <input type="hidden" name="heroSecondaryCtaText" value={content.home.heroSecondaryCtaText || ""} />
            <input type="hidden" name="featuredHeading" value={content.home.featuredHeading || ""} />
            <input type="hidden" name="featuredDescription" value={content.home.featuredDescription || ""} />
            <input
              type="hidden"
              name="heroTypingPhrases"
              value={JSON.stringify(
                content.home.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || []
              )}
            />

            {/* Desktop Presentation (>= sm) */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Hero Availability Status</label>
                <input
                  type="text"
                  value={content.home.heroStatus}
                  onChange={(e) => handleFieldChange("home", "heroStatus", e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Hero Availability Badge</label>
                <input
                  type="text"
                  value={content.home.heroBadge}
                  onChange={(e) => handleFieldChange("home", "heroBadge", e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-mono text-muted uppercase">Hero Availability Color</label>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-ink-black/60 border border-white/[0.08] max-w-md">
                  {(
                    [
                      { value: "green", label: "Green", dot: "bg-emerald-400" },
                      { value: "orange", label: "Orange", dot: "bg-amber-400" },
                      { value: "red", label: "Red", dot: "bg-rose-400" },
                    ] as const
                  ).map((opt) => {
                    const isSelected = (content.home.heroStatusColor || "green") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleFieldChange("home", "heroStatusColor", opt.value)}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white/10 text-foreground border border-white/20 shadow-sm"
                            : "text-muted hover:text-foreground hover:bg-white/[0.04]"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${opt.dot} ${isSelected ? "ring-2 ring-white/30" : ""}`} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Hero Title Prefix</label>
                <input
                  type="text"
                  value={content.home.heroTitlePrefix}
                  onChange={(e) => handleFieldChange("home", "heroTitlePrefix", e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Hero Name Accent</label>
                <input
                  type="text"
                  value={content.home.heroName}
                  onChange={(e) => handleFieldChange("home", "heroName", e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-mono text-muted uppercase">Hero Introduction Bio</label>
                <textarea
                  rows={3}
                  value={content.home.heroBio}
                  onChange={(e) => handleFieldChange("home", "heroBio", e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Primary CTA Text</label>
                <input
                  type="text"
                  value={content.home.heroPrimaryCtaText}
                  onChange={(e) => handleFieldChange("home", "heroPrimaryCtaText", e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Secondary CTA Text</label>
                <input
                  type="text"
                  value={content.home.heroSecondaryCtaText}
                  onChange={(e) => handleFieldChange("home", "heroSecondaryCtaText", e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-mono text-muted uppercase">Featured Section Heading</label>
                <input
                  type="text"
                  value={content.home.featuredHeading}
                  onChange={(e) => handleFieldChange("home", "featuredHeading", e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-mono text-muted uppercase">Featured Section Description</label>
                <input
                  type="text"
                  value={content.home.featuredDescription || ""}
                  onChange={(e) => handleFieldChange("home", "featuredDescription", e.target.value)}
                  placeholder="Selected Work"
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                />
              </div>

              {/* Desktop Hero Typing Phrases */}
              <div className="flex flex-col gap-3 sm:col-span-2 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-mono text-muted uppercase">Hero Typing Phrases</label>
                    <span className="text-[10px] font-mono text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 px-2 py-0.5 rounded-full">
                      {(content.home.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || []).length} phrases
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddHeroPhrase}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 text-pacific-cyan border border-pacific-cyan/25 text-xs font-mono transition-colors cursor-pointer select-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Phrase</span>
                  </button>
                </div>
                <p className="text-[11px] font-mono text-muted/70">
                  Phrases cycled in the hero role typing animation. Sequentially typed and deleted with smooth timing.
                </p>

                <div className="flex flex-col gap-2.5">
                  {(content.home.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || []).map((phrase, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-3 rounded-xl bg-ink-black/40 border border-white/[0.06] flex items-center justify-between gap-3 group hover:border-white/[0.12] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] sm:text-[11px] font-mono text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 px-2 py-1 rounded shrink-0 font-medium">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={phrase}
                          onChange={(e) => handleUpdateHeroPhrase(idx, e.target.value)}
                          placeholder="e.g. Full Stack Developer"
                          className="flex-1 min-w-0 px-3 py-1.5 sm:py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveHeroPhrase(idx, "up")}
                          aria-label="Move phrase up"
                          title="Move phrase up"
                          className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted hover:text-foreground disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent cursor-pointer transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (content.home.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || []).length - 1}
                          onClick={() => handleMoveHeroPhrase(idx, "down")}
                          aria-label="Move phrase down"
                          title="Move phrase down"
                          className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted hover:text-foreground disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent cursor-pointer transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHeroPhrase(idx)}
                          aria-label="Delete phrase"
                          title="Delete phrase"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 transition-colors cursor-pointer ml-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Smartphone Presentation (< sm): Collapsible Accordion */}
            <div className="flex sm:hidden flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted font-semibold">
                  Home Content
                </span>
                <span className="text-[10px] font-mono text-pacific-cyan/80">
                  {isMobileHomeOpen ? "Tap to collapse" : "Tap to expand"}
                </span>
              </div>

              <div className="glass-card rounded-xl border border-white/[0.08] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileHomeOpen(!isMobileHomeOpen)}
                  aria-expanded={isMobileHomeOpen}
                  aria-controls="mobile-home-panel"
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Home className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Home Content
                      </span>
                      <span className="text-[11px] font-mono text-muted truncate">
                        Hero · Actions · Featured Work
                      </span>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted shrink-0">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isMobileHomeOpen ? "rotate-180 text-pacific-cyan" : ""
                      }`}
                    />
                  </div>
                </button>

                <div
                  id="mobile-home-panel"
                  role="region"
                  aria-label="Home Content Form"
                  className={
                    isMobileHomeOpen
                      ? "p-4 sm:p-5 border-t border-white/[0.08] flex flex-col gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  {/* HERO Sub-section */}
                  <div className="flex flex-col gap-3">
                    <div className="pb-1.5 border-b border-white/[0.08]">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                        Hero
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Hero Availability Status
                      </label>
                      <input
                        type="text"
                        value={content.home.heroStatus}
                        onChange={(e) => handleFieldChange("home", "heroStatus", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                        placeholder="Open to opportunities"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Hero Availability Badge
                      </label>
                      <input
                        type="text"
                        value={content.home.heroBadge}
                        onChange={(e) => handleFieldChange("home", "heroBadge", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                        placeholder="Available for hire"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Hero Availability Color
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-ink-black/80 border border-white/[0.08]">
                        {(
                          [
                            { value: "green", label: "Green", dot: "bg-emerald-400" },
                            { value: "orange", label: "Orange", dot: "bg-amber-400" },
                            { value: "red", label: "Red", dot: "bg-rose-400" },
                          ] as const
                        ).map((opt) => {
                          const isSelected = (content.home.heroStatusColor || "green") === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleFieldChange("home", "heroStatusColor", opt.value)}
                              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer min-h-[38px] ${
                                isSelected
                                  ? "bg-white/[0.12] text-foreground border border-white/20 shadow-sm font-semibold"
                                  : "text-muted hover:text-foreground hover:bg-white/[0.04]"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot} ${isSelected ? "ring-2 ring-white/30" : ""}`} />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Hero Title Prefix
                      </label>
                      <input
                        type="text"
                        value={content.home.heroTitlePrefix}
                        onChange={(e) => handleFieldChange("home", "heroTitlePrefix", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                        placeholder="Hi, I'm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Hero Name Accent
                      </label>
                      <input
                        type="text"
                        value={content.home.heroName}
                        onChange={(e) => handleFieldChange("home", "heroName", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                        placeholder="Rushan Siddiqui"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Hero Introduction Bio
                      </label>
                      <textarea
                        rows={4}
                        value={content.home.heroBio}
                        onChange={(e) => handleFieldChange("home", "heroBio", e.target.value)}
                        className="w-full min-h-[96px] sm:min-h-[110px] px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-sm text-foreground outline-none transition-all resize-y leading-relaxed font-sans placeholder:text-muted/40"
                        placeholder="Building fast, thoughtful web applications..."
                      />
                    </div>

                    {/* Hero Typing Phrases Mobile Sub-section */}
                    <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                            Typing Phrases
                          </label>
                          <span className="text-[9px] font-mono text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 px-1.5 py-0.5 rounded-full font-medium">
                            {(content.home.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || []).length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddHeroPhrase}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 text-pacific-cyan border border-pacific-cyan/25 text-[11px] font-mono transition-colors cursor-pointer select-none"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {(content.home.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || []).map((phrase, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-ink-black/60 border border-white/[0.06] flex items-center justify-between gap-2"
                          >
                            <span className="text-[10px] font-mono text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 px-1.5 py-0.5 rounded shrink-0 font-medium">
                              #{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={phrase}
                              onChange={(e) => handleUpdateHeroPhrase(idx, e.target.value)}
                              placeholder="e.g. Full Stack Developer"
                              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-ink-black/80 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveHeroPhrase(idx, "up")}
                                aria-label="Move phrase up"
                                className="p-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted hover:text-foreground disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (content.home.heroTypingPhrases || DEFAULT_HERO_TYPING_PHRASES || []).length - 1}
                                onClick={() => handleMoveHeroPhrase(idx, "down")}
                                aria-label="Move phrase down"
                                className="p-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted hover:text-foreground disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteHeroPhrase(idx)}
                                aria-label="Delete phrase"
                                className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS Sub-section */}
                  <div className="flex flex-col gap-3 pt-1">
                    <div className="pb-1.5 border-b border-white/[0.08]">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                        Actions
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Primary CTA Text
                      </label>
                      <input
                        type="text"
                        value={content.home.heroPrimaryCtaText}
                        onChange={(e) => handleFieldChange("home", "heroPrimaryCtaText", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                        placeholder="Explore Case Studies"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Secondary CTA Text
                      </label>
                      <input
                        type="text"
                        value={content.home.heroSecondaryCtaText}
                        onChange={(e) => handleFieldChange("home", "heroSecondaryCtaText", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                        placeholder="Let's Connect"
                      />
                    </div>
                  </div>

                  {/* FEATURED WORK Sub-section */}
                  <div className="flex flex-col gap-3 pt-1">
                    <div className="pb-1.5 border-b border-white/[0.08]">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                        Featured Work
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Featured Section Heading
                      </label>
                      <input
                        type="text"
                        value={content.home.featuredHeading}
                        onChange={(e) => handleFieldChange("home", "featuredHeading", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                        placeholder="Featured Case Studies"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Featured Section Description
                      </label>
                      <input
                        type="text"
                        value={content.home.featuredDescription || ""}
                        onChange={(e) => handleFieldChange("home", "featuredDescription", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan/60 focus:bg-ink-black/95 focus:ring-1 focus:ring-pacific-cyan/30 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 font-mono sm:font-sans"
                        placeholder="Selected Work"
                      />
                    </div>
                  </div>

                  {/* Mobile Save Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full min-h-[46px] py-3 px-4 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_24px_rgba(24,155,173,0.35)] disabled:opacity-50 cursor-pointer select-none flex items-center justify-center gap-2"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Home Content</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "about" && (
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Hidden JSON inputs for array fields */}
            <input
              type="hidden"
              name="evolution"
              value={JSON.stringify(content.about.evolution || [])}
            />
            <input
              type="hidden"
              name="principles"
              value={JSON.stringify(content.about.principles || [])}
            />
            <input
              type="hidden"
              name="focusAreas"
              value={JSON.stringify(content.about.focusAreas || [])}
            />
            <input
              type="hidden"
              name="milestoneLabels"
              value={JSON.stringify(
                content.about.milestoneLabels || {
                  milestone01: "2022 Milestone",
                  milestone02: "2023 Milestone",
                  milestone03: "2026 Milestone",
                  currentEra: "CURRENT ERA",
                }
              )}
            />

            {/* Top Toolbar: Section summary & Expand/Collapse All */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                  About Sections
                </span>
                <span className="text-[10px] font-mono text-muted/60">
                  (7 sections)
                </span>
              </div>
              <button
                type="button"
                onClick={toggleAllAboutSections}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors cursor-pointer select-none"
                title={
                  ["intro", "narrative", "evolution", "principles", "journey", "focus", "cta"].every(
                    (k) => aboutOpenSections[k]
                  )
                    ? "Collapse all sections"
                    : "Expand all sections"
                }
                aria-label={
                  ["intro", "narrative", "evolution", "principles", "journey", "focus", "cta"].every(
                    (k) => aboutOpenSections[k]
                  )
                    ? "Collapse all sections"
                    : "Expand all sections"
                }
              >
                <ChevronsUpDown className="w-3.5 h-3.5 text-pacific-cyan" />
                <span className="hidden sm:inline">
                  {["intro", "narrative", "evolution", "principles", "journey", "focus", "cta"].every(
                    (k) => aboutOpenSections[k]
                  )
                    ? "Collapse All"
                    : "Expand All"}
                </span>
              </button>
            </div>

            {/* Top-Level Accordion Stack */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* 1. INTRODUCTION */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleAboutSection("intro")}
                  aria-expanded={Boolean(aboutOpenSections.intro)}
                  aria-controls="about-section-intro"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Introduction
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Eyebrow badge, main heading, professional subtitle
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {aboutOpenSections.intro ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          aboutOpenSections.intro ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="about-section-intro"
                  role="region"
                  aria-label="Introduction"
                  className={
                    aboutOpenSections.intro
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Eyebrow Badge</label>
                      <input
                        type="text"
                        name="eyebrow"
                        value={content.about.eyebrow}
                        onChange={(e) => handleFieldChange("about", "eyebrow", e.target.value)}
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Main Heading</label>
                      <input
                        type="text"
                        name="title"
                        value={content.about.title}
                        onChange={(e) => handleFieldChange("about", "title", e.target.value)}
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Professional Subtitle</label>
                      <input
                        type="text"
                        name="subtitle"
                        value={content.about.subtitle}
                        onChange={(e) => handleFieldChange("about", "subtitle", e.target.value)}
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. ABOUT NARRATIVE */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleAboutSection("narrative")}
                  aria-expanded={Boolean(aboutOpenSections.narrative)}
                  aria-controls="about-section-narrative"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        About Narrative
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Primary statement, supporting story, progression, metadata
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {aboutOpenSections.narrative ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          aboutOpenSections.narrative ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="about-section-narrative"
                  role="region"
                  aria-label="About Narrative"
                  className={
                    aboutOpenSections.narrative
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Eyebrow</label>
                      <input
                        type="text"
                        name="narrativeEyebrow"
                        value={content.about.narrativeEyebrow || ""}
                        onChange={(e) => handleFieldChange("about", "narrativeEyebrow", e.target.value)}
                        placeholder="HOW I THINK"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Primary Statement</label>
                      <textarea
                        rows={2}
                        name="leadText"
                        value={content.about.leadText}
                        onChange={(e) => handleFieldChange("about", "leadText", e.target.value)}
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Supporting Narrative</label>
                      <textarea
                        rows={4}
                        name="narrativeText"
                        value={content.about.narrativeText}
                        onChange={(e) => handleFieldChange("about", "narrativeText", e.target.value)}
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Progression Item 1</label>
                      <input
                        type="text"
                        name="progressionItem1"
                        value={content.about.progressionItem1 || ""}
                        onChange={(e) => handleFieldChange("about", "progressionItem1", e.target.value)}
                        placeholder="INTERFACE"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Progression Item 2</label>
                      <input
                        type="text"
                        name="progressionItem2"
                        value={content.about.progressionItem2 || ""}
                        onChange={(e) => handleFieldChange("about", "progressionItem2", e.target.value)}
                        placeholder="PERFORMANCE"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Progression Item 3</label>
                      <input
                        type="text"
                        name="progressionItem3"
                        value={content.about.progressionItem3 || ""}
                        onChange={(e) => handleFieldChange("about", "progressionItem3", e.target.value)}
                        placeholder="SYSTEMS"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Metadata Item 1</label>
                      <input
                        type="text"
                        name="metadataItem1"
                        value={content.about.metadataItem1 || ""}
                        onChange={(e) => handleFieldChange("about", "metadataItem1", e.target.value)}
                        placeholder="UI"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Metadata Item 2</label>
                      <input
                        type="text"
                        name="metadataItem2"
                        value={content.about.metadataItem2 || ""}
                        onChange={(e) => handleFieldChange("about", "metadataItem2", e.target.value)}
                        placeholder="FRONTEND"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Metadata Item 3</label>
                      <input
                        type="text"
                        name="metadataItem3"
                        value={content.about.metadataItem3 || ""}
                        onChange={(e) => handleFieldChange("about", "metadataItem3", e.target.value)}
                        placeholder="BACKEND"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Metadata Item 4</label>
                      <input
                        type="text"
                        name="metadataItem4"
                        value={content.about.metadataItem4 || ""}
                        onChange={(e) => handleFieldChange("about", "metadataItem4", e.target.value)}
                        placeholder="ARCHITECTURE"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. RAWIN EVOLUTION */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleAboutSection("evolution")}
                  aria-expanded={Boolean(aboutOpenSections.evolution)}
                  aria-controls="about-section-evolution"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        RAWIN Evolution
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Milestone history, build record labels, evolution items ({content.about.evolution?.length || 0})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {aboutOpenSections.evolution ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          aboutOpenSections.evolution ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="about-section-evolution"
                  role="region"
                  aria-label="RAWIN Evolution"
                  className={
                    aboutOpenSections.evolution
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-5 sm:gap-6 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  {/* Section-level fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Section Eyebrow</label>
                      <input
                        type="text"
                        name="evolutionEyebrow"
                        value={content.about.evolutionEyebrow || ""}
                        onChange={(e) => handleFieldChange("about", "evolutionEyebrow", e.target.value)}
                        placeholder="RAWIN EVOLUTION"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Section Heading</label>
                      <input
                        type="text"
                        name="evolutionHeading"
                        value={content.about.evolutionHeading || ""}
                        onChange={(e) => handleFieldChange("about", "evolutionHeading", e.target.value)}
                        placeholder="A RECORD OF THE BUILD."
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Section Description</label>
                      <textarea
                        rows={2}
                        name="evolutionDescription"
                        value={content.about.evolutionDescription || ""}
                        onChange={(e) => handleFieldChange("about", "evolutionDescription", e.target.value)}
                        placeholder="Three generations of the digital workspace..."
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Record of the Build Labels */}
                  <div className="flex flex-col gap-3 p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-pacific-cyan" />
                      <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
                        Record of the Build Labels
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 pt-1">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-muted uppercase">Milestone 01 Label</label>
                        <input
                          type="text"
                          name="milestone01Label"
                          value={content.about.milestoneLabels?.milestone01 ?? "2022 Milestone"}
                          onChange={(e) => handleMilestoneLabelChange("milestone01", e.target.value)}
                          placeholder="2022 Milestone"
                          className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-muted uppercase">Milestone 02 Label</label>
                        <input
                          type="text"
                          name="milestone02Label"
                          value={content.about.milestoneLabels?.milestone02 ?? "2023 Milestone"}
                          onChange={(e) => handleMilestoneLabelChange("milestone02", e.target.value)}
                          placeholder="2023 Milestone"
                          className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-muted uppercase">Milestone 03 Label</label>
                        <input
                          type="text"
                          name="milestone03Label"
                          value={content.about.milestoneLabels?.milestone03 ?? "2026 Milestone"}
                          onChange={(e) => handleMilestoneLabelChange("milestone03", e.target.value)}
                          placeholder="2026 Milestone"
                          className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-muted uppercase">Current Era Label</label>
                        <input
                          type="text"
                          name="currentEraLabel"
                          value={content.about.milestoneLabels?.currentEra ?? "CURRENT ERA"}
                          onChange={(e) => handleMilestoneLabelChange("currentEra", e.target.value)}
                          placeholder="CURRENT ERA"
                          className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Milestones List Header */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
                        Milestones
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-pacific-cyan/15 text-pacific-cyan font-bold">
                        {content.about.evolution?.length || 0}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 text-pacific-cyan border border-pacific-cyan/25 text-xs font-mono transition-colors cursor-pointer select-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Milestone</span>
                    </button>
                  </div>

                  {/* Milestones Nested Accordion Stack */}
                  <div className="flex flex-col gap-3">
                    {(content.about.evolution || []).map((m, idx) => {
                      const mKey = m.id || `milestone-${idx}`;
                      const isOpen = Boolean(openMilestones[mKey]);
                      return (
                        <div
                          key={mKey}
                          className="glass-card rounded-xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleMilestone(mKey)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleMilestone(mKey);
                              }
                            }}
                            aria-expanded={isOpen}
                            aria-controls={`milestone-panel-${idx}`}
                            className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-pacific-cyan/15 text-pacific-cyan font-semibold shrink-0">
                                #{idx + 1} {m.year || "YEAR"}
                              </span>
                              <span className="text-xs font-medium text-foreground truncate">
                                {m.title || "Untitled Milestone"}
                              </span>
                              {m.isCurrent && (
                                <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono bg-electric-indigo/20 text-electric-indigo font-bold tracking-wider shrink-0">
                                  CURRENT
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveMilestone(idx, "up");
                                }}
                                aria-label={`Move milestone ${m.year || idx + 1} up`}
                                title="Move milestone up"
                                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-25 transition-colors cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (content.about.evolution || []).length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveMilestone(idx, "down");
                                }}
                                aria-label={`Move milestone ${m.year || idx + 1} down`}
                                title="Move milestone down"
                                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-25 transition-colors cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMilestone(idx);
                                }}
                                aria-label={`Delete milestone ${m.year || idx + 1}`}
                                title="Delete milestone"
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer ml-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="w-6 h-6 rounded flex items-center justify-center text-muted ml-0.5">
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    isOpen ? "rotate-180 text-pacific-cyan" : ""
                                  }`}
                                />
                              </div>
                            </div>
                          </div>

                          <div
                            id={`milestone-panel-${idx}`}
                            role="region"
                            aria-label={`Milestone ${idx + 1}`}
                            className={
                              isOpen
                                ? "p-3.5 sm:p-5 border-t border-white/[0.06] flex flex-col gap-4 bg-ink-black/20"
                                : "hidden"
                            }
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-mono text-muted uppercase">Year</label>
                                <input
                                  type="text"
                                  value={m.year}
                                  onChange={(e) => handleUpdateMilestone(idx, "year", e.target.value)}
                                  placeholder="2026"
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-mono text-muted uppercase">Eyebrow / Status</label>
                                <input
                                  type="text"
                                  value={m.eyebrow}
                                  onChange={(e) => handleUpdateMilestone(idx, "eyebrow", e.target.value)}
                                  placeholder="THE CURRENT ITERATION"
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-mono text-muted uppercase">Title</label>
                                <input
                                  type="text"
                                  value={m.title}
                                  onChange={(e) => handleUpdateMilestone(idx, "title", e.target.value)}
                                  placeholder="RAWIN 3.0"
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-mono text-muted uppercase">Domain / URL Display</label>
                                <input
                                  type="text"
                                  value={m.domain}
                                  onChange={(e) => handleUpdateMilestone(idx, "domain", e.target.value)}
                                  placeholder="rawin.dev"
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors font-mono"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-mono text-muted uppercase">Target URL</label>
                                <input
                                  type="text"
                                  value={m.url}
                                  onChange={(e) => handleUpdateMilestone(idx, "url", e.target.value)}
                                  placeholder="https://rawin.dev"
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors font-mono"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-mono text-muted uppercase">CTA Button Text</label>
                                <input
                                  type="text"
                                  value={m.ctaText}
                                  onChange={(e) => handleUpdateMilestone(idx, "ctaText", e.target.value)}
                                  placeholder="Current Website"
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <label className="text-[11px] font-mono text-muted uppercase">Progression Quote</label>
                                <input
                                  type="text"
                                  value={m.quote}
                                  onChange={(e) => handleUpdateMilestone(idx, "quote", e.target.value)}
                                  placeholder="Architectural leap to Next.js 15 App Router..."
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                                />
                              </div>
                              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                <div className="flex flex-col">
                                  <span className="text-[11px] sm:text-xs font-mono text-muted uppercase">Current Milestone</span>
                                  <span className="hidden sm:inline text-[10px] text-muted/60">Marks active site milestone</span>
                                </div>
                                <NeoToggle
                                  className="neo-compact-mobile"
                                  checked={Boolean(m.isCurrent)}
                                  onChange={(val) => handleUpdateMilestone(idx, "isCurrent", val)}
                                  ariaLabel={`Toggle current milestone for ${m.year}`}
                                />
                              </div>

                              <div className="flex flex-col gap-1.5 sm:col-span-3">
                                <label className="text-[11px] font-mono text-muted uppercase">Description</label>
                                <textarea
                                  rows={2}
                                  value={m.description}
                                  onChange={(e) => handleUpdateMilestone(idx, "description", e.target.value)}
                                  placeholder="Full narrative for this milestone..."
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors resize-y leading-relaxed"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5 sm:col-span-3">
                                <label className="text-[11px] font-mono text-muted uppercase">
                                  Technologies (comma-separated)
                                </label>
                                <input
                                  type="text"
                                  value={Array.isArray(m.technologies) ? m.technologies.join(", ") : ""}
                                  onChange={(e) => {
                                    const tags = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                                    handleUpdateMilestone(idx, "technologies", tags);
                                  }}
                                  placeholder="Next.js 15, React 19, TypeScript, Tailwind v4"
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors font-mono"
                                />
                              </div>

                              {/* Milestone Image Management: Technical URL/path hidden from UI */}
                              <div className="flex flex-col gap-3 sm:col-span-3 p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                <span className="text-[11px] font-mono text-muted uppercase font-semibold">
                                  Milestone Image
                                </span>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4">
                                  {/* Responsive Image Preview: Full width on mobile, thumbnail on desktop */}
                                  <div className="relative w-full sm:w-28 h-44 sm:h-18 rounded-lg overflow-hidden bg-ink-black/80 border border-white/[0.1] shrink-0 flex items-center justify-center p-1 sm:p-0">
                                    {m.preview ? (
                                      <img
                                        src={m.preview}
                                        alt={m.previewAlt || m.title || "Milestone preview"}
                                        className="w-full h-full object-contain sm:object-cover"
                                      />
                                    ) : (
                                      <ImageIcon className="w-6 h-6 text-muted/40" />
                                    )}
                                  </div>

                                  {/* Image Controls: Upload + Reset on same row, Alt text below */}
                                  <div className="flex-1 flex flex-col gap-2.5 w-full">
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                      <label className="flex-1 sm:flex-initial cursor-pointer inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/25 text-[11px] sm:text-xs font-mono text-pacific-cyan transition-colors select-none text-center whitespace-nowrap min-h-[38px] sm:min-h-0">
                                        <Upload className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                                        <span>
                                          {milestoneLoading === `milestone-${idx}` ? "Uploading..." : "Upload Image"}
                                        </span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          disabled={milestoneLoading === `milestone-${idx}`}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUploadMilestoneImage(idx, file);
                                          }}
                                          className="hidden"
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => handleResetMilestoneImage(idx)}
                                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg hover:bg-white/[0.06] border border-white/[0.06] text-[11px] sm:text-xs font-mono text-muted hover:text-foreground transition-colors cursor-pointer select-none text-center whitespace-nowrap min-h-[38px] sm:min-h-0"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                        <span className="sm:hidden">Reset</span>
                                        <span className="hidden sm:inline">Reset to Default</span>
                                      </button>
                                    </div>
                                    <div className="flex flex-col gap-1 w-full">
                                      <label className="text-[10px] font-mono text-muted uppercase">
                                        Alt Text / Caption
                                      </label>
                                      <input
                                        type="text"
                                        value={m.previewAlt || ""}
                                        onChange={(e) => handleUpdateMilestone(idx, "previewAlt", e.target.value)}
                                        placeholder="Milestone illustration alt text"
                                        className="w-full px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. HOW I BUILD (CORE PRINCIPLES) */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleAboutSection("principles")}
                  aria-expanded={Boolean(aboutOpenSections.principles)}
                  aria-controls="about-section-principles"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        How I Build (Core Principles)
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Philosophy, architectural tenets, build principles ({content.about.principles?.length || 0})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {aboutOpenSections.principles ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          aboutOpenSections.principles ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="about-section-principles"
                  role="region"
                  aria-label="How I Build (Core Principles)"
                  className={
                    aboutOpenSections.principles
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-5 sm:gap-6 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  {/* Section-level fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Section Eyebrow</label>
                      <input
                        type="text"
                        name="principlesEyebrow"
                        value={content.about.principlesEyebrow || ""}
                        onChange={(e) => handleFieldChange("about", "principlesEyebrow", e.target.value)}
                        placeholder="HOW I BUILD"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Section Heading</label>
                      <input
                        type="text"
                        name="principlesHeading"
                        value={content.about.principlesHeading || ""}
                        onChange={(e) => handleFieldChange("about", "principlesHeading", e.target.value)}
                        placeholder="ENGINEERING PHILOSOPHY"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Section Description</label>
                      <textarea
                        rows={2}
                        name="principlesDescription"
                        value={content.about.principlesDescription || ""}
                        onChange={(e) => handleFieldChange("about", "principlesDescription", e.target.value)}
                        placeholder="Core rules that govern every line of code..."
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Principles Header */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
                        Principles
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-pacific-cyan/15 text-pacific-cyan font-bold">
                        {content.about.principles?.length || 0}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPrinciple}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 text-pacific-cyan border border-pacific-cyan/25 text-xs font-mono transition-colors cursor-pointer select-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Principle</span>
                    </button>
                  </div>

                  {/* Principles Nested Accordions */}
                  <div className="flex flex-col gap-3">
                    {(content.about.principles || []).map((p, idx) => {
                      const pKey = p.id || `principle-${idx}`;
                      const isOpen = Boolean(openPrinciples[pKey]);
                      return (
                        <div
                          key={pKey}
                          className="glass-card rounded-xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => togglePrinciple(pKey)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                togglePrinciple(pKey);
                              }
                            }}
                            aria-expanded={isOpen}
                            aria-controls={`principle-panel-${idx}`}
                            className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono text-xs text-pacific-cyan font-bold shrink-0">
                                {p.number || `0${idx + 1}`}
                              </span>
                              <span className="text-xs font-medium text-foreground truncate">
                                {p.title || "Untitled Principle"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMovePrinciple(idx, "up");
                                }}
                                aria-label={`Move principle ${p.number || idx + 1} up`}
                                title="Move principle up"
                                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-25 transition-colors cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (content.about.principles || []).length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMovePrinciple(idx, "down");
                                }}
                                aria-label={`Move principle ${p.number || idx + 1} down`}
                                title="Move principle down"
                                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-25 transition-colors cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePrinciple(idx);
                                }}
                                aria-label={`Delete principle ${p.number || idx + 1}`}
                                title="Delete principle"
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer ml-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="w-6 h-6 rounded flex items-center justify-center text-muted ml-0.5">
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    isOpen ? "rotate-180 text-pacific-cyan" : ""
                                  }`}
                                />
                              </div>
                            </div>
                          </div>

                          <div
                            id={`principle-panel-${idx}`}
                            role="region"
                            aria-label={`Principle ${idx + 1}`}
                            className={
                              isOpen
                                ? "p-3.5 sm:p-5 border-t border-white/[0.06] flex flex-col gap-3.5 bg-ink-black/20"
                                : "hidden"
                            }
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-mono text-muted uppercase">Number</label>
                                <input
                                  type="text"
                                  value={p.number}
                                  onChange={(e) => handleUpdatePrinciple(idx, "number", e.target.value)}
                                  placeholder="01"
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors font-mono"
                                />
                              </div>
                              <div className="flex flex-col gap-1 sm:col-span-2">
                                <label className="text-[10px] font-mono text-muted uppercase">Title</label>
                                <input
                                  type="text"
                                  value={p.title}
                                  onChange={(e) => handleUpdatePrinciple(idx, "title", e.target.value)}
                                  placeholder="Speed as a Feature"
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-mono text-muted uppercase">Icon</label>
                                <RawinSelect
                                  name={`principle-icon-${idx}`}
                                  value={p.icon || "zap"}
                                  onChange={(val) => handleUpdatePrinciple(idx, "icon", val)}
                                  options={ICON_SELECT_OPTIONS}
                                  size="xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1 sm:col-span-4">
                                <label className="text-[10px] font-mono text-muted uppercase">Statement / Detail</label>
                                <input
                                  type="text"
                                  value={p.statement}
                                  onChange={(e) => handleUpdatePrinciple(idx, "statement", e.target.value)}
                                  placeholder="A slow interface is a broken interface..."
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 5. ENGINEERING JOURNEY */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleAboutSection("journey")}
                  aria-expanded={Boolean(aboutOpenSections.journey)}
                  aria-controls="about-section-journey"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Engineering Journey
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Timeline and journey milestone overview
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {aboutOpenSections.journey ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          aboutOpenSections.journey ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="about-section-journey"
                  role="region"
                  aria-label="Engineering Journey"
                  className={
                    aboutOpenSections.journey
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Section Eyebrow</label>
                      <input
                        type="text"
                        name="journeyEyebrow"
                        value={content.about.journeyEyebrow || ""}
                        onChange={(e) => handleFieldChange("about", "journeyEyebrow", e.target.value)}
                        placeholder="TIMELINE"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Section Heading</label>
                      <input
                        type="text"
                        name="journeyHeading"
                        value={content.about.journeyHeading || ""}
                        onChange={(e) => handleFieldChange("about", "journeyHeading", e.target.value)}
                        placeholder="ENGINEERING JOURNEY"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Section Description</label>
                      <textarea
                        rows={2}
                        name="journeyDescription"
                        value={content.about.journeyDescription || ""}
                        onChange={(e) => handleFieldChange("about", "journeyDescription", e.target.value)}
                        placeholder="Milestones along the way..."
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. CURRENT FOCUS AREAS */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleAboutSection("focus")}
                  aria-expanded={Boolean(aboutOpenSections.focus)}
                  aria-controls="about-section-focus"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Current Focus Areas
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Active research areas, architectures, and technologies ({content.about.focusAreas?.length || 0})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {aboutOpenSections.focus ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          aboutOpenSections.focus ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="about-section-focus"
                  role="region"
                  aria-label="Current Focus Areas"
                  className={
                    aboutOpenSections.focus
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-5 sm:gap-6 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  {/* Section-level fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Section Eyebrow</label>
                      <input
                        type="text"
                        name="focusEyebrow"
                        value={content.about.focusEyebrow || ""}
                        onChange={(e) => handleFieldChange("about", "focusEyebrow", e.target.value)}
                        placeholder="CURRENT FOCUS"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Section Heading</label>
                      <input
                        type="text"
                        name="focusHeading"
                        value={content.about.focusHeading || ""}
                        onChange={(e) => handleFieldChange("about", "focusHeading", e.target.value)}
                        placeholder="WHERE ATTENTION GOES"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Section Description</label>
                      <textarea
                        rows={2}
                        name="focusDescription"
                        value={content.about.focusDescription || ""}
                        onChange={(e) => handleFieldChange("about", "focusDescription", e.target.value)}
                        placeholder="Areas of active research and architectural exploration..."
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Focus Areas Header */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
                        Focus Areas
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-pacific-cyan/15 text-pacific-cyan font-bold">
                        {content.about.focusAreas?.length || 0}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFocusArea}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 text-pacific-cyan border border-pacific-cyan/25 text-xs font-mono transition-colors cursor-pointer select-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Focus Area</span>
                    </button>
                  </div>

                  {/* Focus Areas Nested Accordions */}
                  <div className="flex flex-col gap-3">
                    {(content.about.focusAreas || []).map((f, idx) => {
                      const fKey = f.id || `focus-${idx}`;
                      const isOpen = Boolean(openFocusAreas[fKey]);
                      return (
                        <div
                          key={fKey}
                          className="glass-card rounded-xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleFocusArea(fKey)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleFocusArea(fKey);
                              }
                            }}
                            aria-expanded={isOpen}
                            aria-controls={`focus-panel-${idx}`}
                            className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xs font-medium text-foreground truncate">
                                {f.title || "Untitled Focus Area"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveFocusArea(idx, "up");
                                }}
                                aria-label={`Move focus area ${idx + 1} up`}
                                title="Move focus area up"
                                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-25 transition-colors cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (content.about.focusAreas || []).length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveFocusArea(idx, "down");
                                }}
                                aria-label={`Move focus area ${idx + 1} down`}
                                title="Move focus area down"
                                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-25 transition-colors cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFocusArea(idx);
                                }}
                                aria-label={`Delete focus area ${idx + 1}`}
                                title="Delete focus area"
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer ml-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="w-6 h-6 rounded flex items-center justify-center text-muted ml-0.5">
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    isOpen ? "rotate-180 text-pacific-cyan" : ""
                                  }`}
                                />
                              </div>
                            </div>
                          </div>

                          <div
                            id={`focus-panel-${idx}`}
                            role="region"
                            aria-label={`Focus Area ${idx + 1}`}
                            className={
                              isOpen
                                ? "p-3.5 sm:p-5 border-t border-white/[0.06] flex flex-col gap-3.5 bg-ink-black/20"
                                : "hidden"
                            }
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                              <div className="flex flex-col gap-1 sm:col-span-3">
                                <label className="text-[10px] font-mono text-muted uppercase">Title</label>
                                <input
                                  type="text"
                                  value={f.title}
                                  onChange={(e) => handleUpdateFocusArea(idx, "title", e.target.value)}
                                  placeholder="Edge AI and Local Inference"
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-mono text-muted uppercase">Icon</label>
                                <RawinSelect
                                  name={`focus-icon-${idx}`}
                                  value={f.icon || "terminal"}
                                  onChange={(val) => handleUpdateFocusArea(idx, "icon", val)}
                                  options={ICON_SELECT_OPTIONS}
                                  size="xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1 sm:col-span-4">
                                <label className="text-[10px] font-mono text-muted uppercase">Description</label>
                                <input
                                  type="text"
                                  value={f.description}
                                  onChange={(e) => handleUpdateFocusArea(idx, "description", e.target.value)}
                                  placeholder="Investigating hybrid architectures..."
                                  className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 7. CALL TO ACTION (CTA) */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleAboutSection("cta")}
                  aria-expanded={Boolean(aboutOpenSections.cta)}
                  aria-controls="about-section-cta"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Call To Action (CTA)
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Next steps, resume download, contact button actions
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {aboutOpenSections.cta ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          aboutOpenSections.cta ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="about-section-cta"
                  role="region"
                  aria-label="Call To Action (CTA)"
                  className={
                    aboutOpenSections.cta
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">CTA Eyebrow</label>
                      <input
                        type="text"
                        name="ctaEyebrow"
                        value={content.about.ctaEyebrow || ""}
                        onChange={(e) => handleFieldChange("about", "ctaEyebrow", e.target.value)}
                        placeholder="NEXT STEP"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">CTA Heading</label>
                      <input
                        type="text"
                        name="ctaHeading"
                        value={content.about.ctaHeading || ""}
                        onChange={(e) => handleFieldChange("about", "ctaHeading", e.target.value)}
                        placeholder="WANT TO BUILD TOGETHER?"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">CTA Description</label>
                      <textarea
                        rows={2}
                        name="ctaDescription"
                        value={content.about.ctaDescription || ""}
                        onChange={(e) => handleFieldChange("about", "ctaDescription", e.target.value)}
                        placeholder="Whether you need a high-performance web application..."
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Resume Button Text</label>
                      <input
                        type="text"
                        name="ctaResumeText"
                        value={content.about.ctaResumeText || ""}
                        onChange={(e) => handleFieldChange("about", "ctaResumeText", e.target.value)}
                        placeholder="View Resume"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Contact Button Text</label>
                      <input
                        type="text"
                        name="ctaContactText"
                        value={content.about.ctaContactText || ""}
                        onChange={(e) => handleFieldChange("about", "ctaContactText", e.target.value)}
                        placeholder="Get In Touch"
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Action for About Content */}
            <div className="pt-2 sm:pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-6 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] disabled:opacity-50 cursor-pointer select-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save About Content</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Hidden JSON inputs for complex fields */}
            <input
              type="hidden"
              name="socials"
              value={JSON.stringify(content.contact.socials || { github: "", linkedin: "", twitter: "", instagram: "" })}
            />
            <input
              type="hidden"
              name="form"
              value={JSON.stringify(content.contact.form || {
                namePlaceholder: "Jane Doe",
                emailPlaceholder: "jane@example.com",
                phonePlaceholder: "+1 555 0192",
                subjectPlaceholder: "Project Inquiry / Job Opportunity",
                messagePlaceholder: "Describe your goals, project timeline, or questions...",
              })}
            />

            {/* Top Toolbar: Section summary and Expand/Collapse All */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                  Contact Sections
                </span>
                <span className="text-[10px] font-mono text-muted/60">
                  (4 sections)
                </span>
              </div>
              <button
                type="button"
                onClick={toggleAllContactSections}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors cursor-pointer select-none"
                title={
                  ["details", "socials", "form", "headings"].every((k) => contactOpenSections[k])
                    ? "Collapse all sections"
                    : "Expand all sections"
                }
                aria-label={
                  ["details", "socials", "form", "headings"].every((k) => contactOpenSections[k])
                    ? "Collapse all sections"
                    : "Expand all sections"
                }
              >
                <ChevronsUpDown className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                <span className="hidden sm:inline">
                  {["details", "socials", "form", "headings"].every((k) => contactOpenSections[k])
                    ? "Collapse All"
                    : "Expand All"}
                </span>
              </button>
            </div>

            {/* Top-Level Accordion Stack */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* 1. CONTACT DETAILS */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleContactSection("details")}
                  aria-expanded={Boolean(contactOpenSections.details)}
                  aria-controls="contact-section-details"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Contact Details
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Email, location, phone number and display toggle
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {contactOpenSections.details ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          contactOpenSections.details ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="contact-section-details"
                  role="region"
                  aria-label="Contact Details"
                  className={
                    contactOpenSections.details
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Primary Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={content.contact.email || ""}
                        onChange={(e) => handleFieldChange("contact", "email", e.target.value)}
                        placeholder="rushansiddiqui5262@gmail.com"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground font-mono outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Location / City / Country</label>
                      <input
                        type="text"
                        name="location"
                        value={content.contact.location || ""}
                        onChange={(e) => handleFieldChange("contact", "location", e.target.value)}
                        placeholder="Jaunpur, Uttar Pradesh, India"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        value={content.contact.phone || ""}
                        onChange={(e) => handleFieldChange("contact", "phone", e.target.value)}
                        placeholder="+91 79051 09292"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground font-mono outline-none transition-colors"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-mono text-muted uppercase font-medium truncate">
                          Show Phone Number
                        </span>
                        <span className="text-[11px] text-muted/70 hidden sm:inline truncate">
                          Display your phone number publicly.
                        </span>
                      </div>

                      <div className="flex items-center shrink-0">
                        <NeoToggle
                          className="neo-compact-mobile"
                          checked={Boolean(content.contact.showPhoneNumber)}
                          onChange={(checked) => handleFieldChange("contact", "showPhoneNumber", checked)}
                          ariaLabel="Toggle public phone number visibility"
                        />
                      </div>
                      <input
                        type="hidden"
                        name="showPhoneNumber"
                        value={content.contact.showPhoneNumber ? "true" : "false"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SOCIAL CHANNELS */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleContactSection("socials")}
                  aria-expanded={Boolean(contactOpenSections.socials)}
                  aria-controls="contact-section-socials"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Social Channels
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        GitHub, LinkedIn, X / Twitter, Instagram
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {contactOpenSections.socials ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          contactOpenSections.socials ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="contact-section-socials"
                  role="region"
                  aria-label="Social Channels"
                  className={
                    contactOpenSections.socials
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <p className="text-xs text-muted leading-relaxed">
                    Channels appear across the public Contact page and Footer. Leave any URL empty to hide that channel completely.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">GitHub Profile URL</label>
                      <input
                        type="text"
                        value={content.contact.socials?.github || ""}
                        onChange={(e) => handleContactSocial("github", e.target.value)}
                        placeholder="https://github.com/rush627"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground font-mono outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">LinkedIn Profile URL</label>
                      <input
                        type="text"
                        value={content.contact.socials?.linkedin || ""}
                        onChange={(e) => handleContactSocial("linkedin", e.target.value)}
                        placeholder="https://www.linkedin.com/in/..."
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground font-mono outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">X / Twitter URL</label>
                      <input
                        type="text"
                        value={content.contact.socials?.twitter || ""}
                        onChange={(e) => handleContactSocial("twitter", e.target.value)}
                        placeholder="https://x.com/sidd_rushan__"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground font-mono outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Instagram Profile URL</label>
                      <input
                        type="text"
                        value={content.contact.socials?.instagram || ""}
                        onChange={(e) => handleContactSocial("instagram", e.target.value)}
                        placeholder="https://www.instagram.com/..."
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground font-mono outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CONTACT FORM PLACEHOLDERS */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleContactSection("form")}
                  aria-expanded={Boolean(contactOpenSections.form)}
                  aria-controls="contact-section-form"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Contact Form Placeholders
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Input examples and placeholder copy
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {contactOpenSections.form ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          contactOpenSections.form ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="contact-section-form"
                  role="region"
                  aria-label="Contact Form Placeholders"
                  className={
                    contactOpenSections.form
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <p className="text-xs text-muted leading-relaxed">
                    Customise example placeholder text displayed inside public contact form fields.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Full Name Placeholder</label>
                      <input
                        type="text"
                        value={content.contact.form?.namePlaceholder || ""}
                        onChange={(e) => handleContactFormPlaceholder("namePlaceholder", e.target.value)}
                        placeholder="Jane Doe"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Email Address Placeholder</label>
                      <input
                        type="text"
                        value={content.contact.form?.emailPlaceholder || ""}
                        onChange={(e) => handleContactFormPlaceholder("emailPlaceholder", e.target.value)}
                        placeholder="jane@example.com"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Mobile Number Placeholder</label>
                      <input
                        type="text"
                        value={content.contact.form?.phonePlaceholder || ""}
                        onChange={(e) => handleContactFormPlaceholder("phonePlaceholder", e.target.value)}
                        placeholder="+1 555 0192"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Subject Placeholder</label>
                      <input
                        type="text"
                        value={content.contact.form?.subjectPlaceholder || ""}
                        onChange={(e) => handleContactFormPlaceholder("subjectPlaceholder", e.target.value)}
                        placeholder="Project Inquiry / Job Opportunity"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Message Placeholder</label>
                      <input
                        type="text"
                        value={content.contact.form?.messagePlaceholder || ""}
                        onChange={(e) => handleContactFormPlaceholder("messagePlaceholder", e.target.value)}
                        placeholder="Describe your goals, project timeline, or questions..."
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. PAGE HEADINGS & CONFIRMATIONS */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleContactSection("headings")}
                  aria-expanded={Boolean(contactOpenSections.headings)}
                  aria-controls="contact-section-headings"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Page Headings &amp; Confirmations
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Badges, titles, descriptions, and success modals
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {contactOpenSections.headings ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          contactOpenSections.headings ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="contact-section-headings"
                  role="region"
                  aria-label="Page Headings & Confirmations"
                  className={
                    contactOpenSections.headings
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Eyebrow Badge</label>
                      <input
                        type="text"
                        name="eyebrow"
                        value={content.contact.eyebrow}
                        onChange={(e) => handleFieldChange("contact", "eyebrow", e.target.value)}
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Page Heading</label>
                      <input
                        type="text"
                        name="title"
                        value={content.contact.title}
                        onChange={(e) => handleFieldChange("contact", "title", e.target.value)}
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Introduction Description</label>
                      <textarea
                        rows={3}
                        name="description"
                        value={content.contact.description}
                        onChange={(e) => handleFieldChange("contact", "description", e.target.value)}
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Success Modal Title</label>
                      <input
                        type="text"
                        name="successTitle"
                        value={content.contact.successTitle}
                        onChange={(e) => handleFieldChange("contact", "successTitle", e.target.value)}
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Success Message Confirmation</label>
                      <textarea
                        rows={2}
                        name="successMessage"
                        value={content.contact.successMessage}
                        onChange={(e) => handleFieldChange("contact", "successMessage", e.target.value)}
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Action for Contact Content */}
            <div className="pt-2 sm:pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-6 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] disabled:opacity-50 cursor-pointer select-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Contact &amp; Social Content</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === "resume" && (
          <div className="flex flex-col gap-10">
            {/* Hidden JSON inputs for complex fields */}
            <input
              type="hidden"
              name="contact"
              value={JSON.stringify({
                location: content.contact?.location || content.resume?.contact?.location || "",
                email: content.contact?.email || content.resume?.contact?.email || "",
                website: content.resume?.contact?.website || "",
              })}
            />
            <input
              type="hidden"
              name="status"
              value={JSON.stringify(content.resume?.status || { text: "", indicator: "green" })}
            />
            <input
              type="hidden"
              name="skills"
              value={JSON.stringify(content.resume?.skills || [])}
            />
            <input
              type="hidden"
              name="experience"
              value={JSON.stringify(content.resume?.experience || [])}
            />
            <input
              type="hidden"
              name="education"
              value={JSON.stringify(content.resume?.education || [])}
            />
            <input
              type="hidden"
              name="cta"
              value={JSON.stringify(content.resume?.cta || { heading: "", description: "", buttonText: "" })}
            />

            {/* Top Toolbar: Section summary and Expand/Collapse All */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                  Resume Sections
                </span>
                <span className="text-[10px] font-mono text-muted/60">
                  (7 sections)
                </span>
              </div>
              <button
                type="button"
                onClick={toggleAllResumeSections}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors cursor-pointer select-none"
                title={
                  ["hero", "contact", "status", "pdf", "skills", "experience", "education"].every(
                    (k) => resumeOpenSections[k]
                  )
                    ? "Collapse all sections"
                    : "Expand all sections"
                }
                aria-label={
                  ["hero", "contact", "status", "pdf", "skills", "experience", "education"].every(
                    (k) => resumeOpenSections[k]
                  )
                    ? "Collapse all sections"
                    : "Expand all sections"
                }
              >
                <ChevronsUpDown className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                <span className="hidden sm:inline">
                  {["hero", "contact", "status", "pdf", "skills", "experience", "education"].every(
                    (k) => resumeOpenSections[k]
                  )
                    ? "Collapse All"
                    : "Expand All"}
                </span>
              </button>
            </div>

            {/* Top-Level Accordion Stack */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* 1. HERO INFORMATION */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleResumeSection("hero")}
                  aria-expanded={Boolean(resumeOpenSections.hero)}
                  aria-controls="resume-section-hero"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Hero Information
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {[
                          content.resume?.eyebrow || "Eyebrow",
                          content.resume?.title || "Name",
                          content.resume?.subtitle ? "Subtitle" : "",
                          content.resume?.ctaText || "CTA",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {resumeOpenSections.hero ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          resumeOpenSections.hero ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="resume-section-hero"
                  role="region"
                  aria-label="Hero Information"
                  className={
                    resumeOpenSections.hero
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Eyebrow Badge</label>
                      <input
                        type="text"
                        name="eyebrow"
                        value={content.resume.eyebrow}
                        onChange={(e) => handleFieldChange("resume", "eyebrow", e.target.value)}
                        placeholder="RESUME / PROFILE · 2026"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Resume Header Name</label>
                      <input
                        type="text"
                        name="title"
                        value={content.resume.title}
                        onChange={(e) => handleFieldChange("resume", "title", e.target.value)}
                        placeholder="Rushan Siddiqui"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Professional Subtitle</label>
                      <input
                        type="text"
                        name="subtitle"
                        value={content.resume.subtitle}
                        onChange={(e) => handleFieldChange("resume", "subtitle", e.target.value)}
                        placeholder="Full Stack Developer · Web Craftsman"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Primary CTA Button Text</label>
                      <input
                        type="text"
                        name="ctaText"
                        value={content.resume.ctaText}
                        onChange={(e) => handleFieldChange("resume", "ctaText", e.target.value)}
                        placeholder="Hire Me"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. CONTACT INFORMATION */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleResumeSection("contact")}
                  aria-expanded={Boolean(resumeOpenSections.contact)}
                  aria-controls="resume-section-contact"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Contact Information
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {[
                          content.contact?.location || content.resume?.contact?.location || "Location",
                          content.contact?.email || content.resume?.contact?.email || "Email",
                          content.resume?.contact?.website ? "Website" : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {resumeOpenSections.contact ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          resumeOpenSections.contact ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="resume-section-contact"
                  role="region"
                  aria-label="Contact Information"
                  className={
                    resumeOpenSections.contact
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <span className="text-xs text-muted">
                      Connected to site-wide contact credentials.
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("contact")}
                      className="text-xs font-mono text-pacific-cyan hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Manage in Contact &amp; Social</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Location</label>
                      <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/40 border border-white/[0.06] text-xs sm:text-sm text-foreground/80 font-mono truncate">
                        {content.contact?.location || content.global?.location || "Not configured"}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Email Address</label>
                      <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/40 border border-white/[0.06] text-xs sm:text-sm text-foreground/80 font-mono truncate">
                        {content.contact?.email || content.global?.contactEmail || "Not configured"}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Website URL</label>
                      <input
                        type="url"
                        value={content.resume.contact?.website || ""}
                        onChange={(e) => handleResumeContact("website", e.target.value)}
                        placeholder="https://rawin.dev"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground font-mono outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. WORKING STATUS (WITH EXECUTIVE SUMMARY NESTED) */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleResumeSection("status")}
                  aria-expanded={Boolean(resumeOpenSections.status)}
                  aria-controls="resume-section-status"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Working Status
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {[
                          content.resume.status?.text || "Available for hire",
                          content.resume.status?.indicator || "green",
                        ].join(" · ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {resumeOpenSections.status ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          resumeOpenSections.status ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="resume-section-status"
                  role="region"
                  aria-label="Working Status"
                  className={
                    resumeOpenSections.status
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-5 sm:gap-6 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Status Text</label>
                      <input
                        type="text"
                        value={content.resume.status?.text || ""}
                        onChange={(e) => handleResumeStatus("text", e.target.value)}
                        placeholder="Available for hire"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Semantic Indicator Color</label>
                      <RawinSelect
                        name="statusIndicatorSelect"
                        value={content.resume.status?.indicator || "green"}
                        onChange={(val) => handleResumeStatus("indicator", val)}
                        options={STATUS_INDICATOR_OPTIONS}
                        fontMono
                      />
                    </div>
                  </div>

                  {/* Status Preview */}
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-ink-black/40 border border-white/[0.04] text-xs font-mono">
                    <span className="text-muted">Public Preview:</span>
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        (content.resume.status?.indicator || "green") === "green"
                          ? "bg-emerald-400"
                          : (content.resume.status?.indicator || "green") === "orange"
                          ? "bg-amber-400"
                          : (content.resume.status?.indicator || "green") === "cyan"
                          ? "bg-pacific-cyan"
                          : "bg-zinc-400"
                      }`}
                    />
                    <span className="text-foreground font-sans font-medium text-xs sm:text-sm">
                      {content.resume.status?.text || "Available for hire"}
                    </span>
                  </div>

                  {/* Divider and Executive Summary subsection */}
                  <div className="border-t border-white/[0.06] pt-5 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
                        Executive Summary
                      </span>
                      <span className="text-[11px] font-mono text-muted/70">
                        Profile overview displayed prominently at the top of the resume.
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      name="summary"
                      value={content.resume.summary}
                      onChange={(e) => handleFieldChange("resume", "summary", e.target.value)}
                      className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      placeholder="Concise overview of focus and principles..."
                    />
                  </div>
                </div>
              </div>

              {/* 4. RESUME PDF */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleResumeSection("pdf")}
                  aria-expanded={Boolean(resumeOpenSections.pdf)}
                  aria-controls="resume-section-pdf"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <FileDown className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Resume PDF
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {content.resume?.pdf
                          ? `PDF · ${content.resume.pdf.filename} · Active`
                          : "No PDF uploaded · Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {resumeOpenSections.pdf ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          resumeOpenSections.pdf ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="resume-section-pdf"
                  role="region"
                  aria-label="Resume PDF"
                  className={
                    resumeOpenSections.pdf
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">
                      Direct download asset for public /resume visitors.
                    </span>
                    <span className="text-[11px] font-mono text-muted/70 shrink-0">
                      Max size: 10MB · PDF only
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-ink-black/60 border border-white/[0.08] flex flex-col gap-4">
                    {content.resume?.pdf ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs sm:text-sm font-medium text-foreground break-all">
                                {content.resume.pdf.filename}
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                Active
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted">
                              {content.resume.pdf.size && (
                                <span>{(content.resume.pdf.size / (1024 * 1024)).toFixed(2)} MB</span>
                              )}
                              {content.resume.pdf.updatedAt && (
                                <>
                                  <span>·</span>
                                  <span>Updated {new Date(content.resume.pdf.updatedAt).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons row: grid on mobile, inline on desktop */}
                        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                          <a
                            href={content.resume?.pdf?.url || "/api/resume/download"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto min-h-[38px] h-9 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-foreground inline-flex items-center justify-center gap-1.5 transition-colors select-none"
                          >
                            <Eye className="w-3.5 h-3.5 text-pacific-cyan" />
                            <span>Open PDF</span>
                          </a>

                          <label
                            htmlFor="resume-pdf-replace"
                            className="w-full sm:w-auto min-h-[38px] h-9 px-3.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 text-xs font-mono text-pacific-cyan inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors select-none"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Replace PDF</span>
                          </label>
                          <input
                            id="resume-pdf-replace"
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={handlePdfSelect}
                          />

                          <button
                            type="button"
                            onClick={() => setShowPdfRemoveConfirm(true)}
                            className="w-full sm:w-auto min-h-[38px] h-9 px-3.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-mono text-rose-400 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.01] text-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-muted">
                          <FileDown className="w-6 h-6 text-pacific-cyan/60" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-foreground">No resume PDF uploaded</p>
                          <p className="text-xs text-muted">Upload a PDF to activate the public download button on /resume.</p>
                        </div>
                        <label
                          htmlFor="resume-pdf-upload"
                          className="mt-2 w-full sm:w-auto px-4 py-2 rounded-xl bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 text-xs font-mono text-pacific-cyan inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Resume PDF</span>
                        </label>
                        <input
                          id="resume-pdf-upload"
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={handlePdfSelect}
                        />
                      </div>
                    )}

                    {/* Staged PDF file ready to upload */}
                    {selectedPdfFile && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-pacific-cyan/[0.06] border border-pacific-cyan/30">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="w-5 h-5 text-pacific-cyan shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-medium text-foreground break-all">
                              {selectedPdfFile.name}
                            </span>
                            <span className="text-[11px] font-mono text-muted">
                              {(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB (staged)
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
                          <button
                            type="button"
                            onClick={handleUploadResumePdf}
                            disabled={resumePdfLoading === "upload"}
                            className="w-full sm:w-auto min-h-[38px] h-9 px-4 rounded-lg bg-pacific-cyan text-ink-black font-semibold text-xs inline-flex items-center justify-center gap-1.5 hover:bg-pacific-cyan/90 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {resumePdfLoading === "upload" ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Confirm &amp; Upload</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedPdfFile(null)}
                            disabled={resumePdfLoading === "upload"}
                            className="w-full sm:w-auto min-h-[38px] h-9 px-3 rounded-lg bg-white/[0.04] text-xs font-mono text-muted hover:text-foreground inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Removal Confirmation Dialog */}
                    {showPdfRemoveConfirm && (
                      <div className="p-3.5 sm:p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-xs text-rose-300">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>Remove active Resume PDF? The public download button on /resume will be hidden immediately.</span>
                        </div>
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
                          <button
                            type="button"
                            onClick={handleRemoveResumePdf}
                            disabled={resumePdfLoading === "remove"}
                            className="w-full sm:w-auto min-h-[38px] h-9 px-3.5 rounded-lg bg-rose-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1 hover:bg-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {resumePdfLoading === "remove" ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Removing...</span>
                              </>
                            ) : (
                              "Confirm Remove"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPdfRemoveConfirm(false)}
                            className="w-full sm:w-auto min-h-[38px] h-9 px-3 rounded-lg bg-white/[0.06] text-xs font-mono text-foreground hover:bg-white/[0.1] inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. TECHNICAL SKILLS */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleResumeSection("skills")}
                  aria-expanded={Boolean(resumeOpenSections.skills)}
                  aria-controls="resume-section-skills"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Technical Skills
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {`${(content.resume?.skills || []).length} groups · ${(content.resume?.skills || []).reduce(
                          (acc, g) => acc + (g.skills?.length || 0),
                          0
                        )} skills`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {resumeOpenSections.skills ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          resumeOpenSections.skills ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="resume-section-skills"
                  role="region"
                  aria-label="Technical Skills"
                  className={
                    resumeOpenSections.skills
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <span className="text-xs text-muted">
                      Organize skills into categories for the technical matrix.
                    </span>
                    <button
                      type="button"
                      onClick={addSkillGroup}
                      className="px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 text-xs font-mono text-pacific-cyan inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Skill Group</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {(content.resume?.skills || []).map((group, groupIdx) => {
                      const isGroupOpen = Boolean(openSkillGroups[group.id]);
                      return (
                        <div
                          key={group.id || groupIdx}
                          className="rounded-xl border border-white/[0.08] bg-ink-black/50 overflow-hidden transition-colors hover:border-white/[0.12]"
                        >
                          {/* Nested Skill Group Accordion Trigger */}
                          <button
                            type="button"
                            onClick={() => toggleSkillGroup(group.id)}
                            aria-expanded={isGroupOpen}
                            aria-controls={`skill-group-${group.id}`}
                            className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-2 text-left hover:bg-white/[0.02] cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-mono text-muted shrink-0">#{groupIdx + 1}</span>
                              <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                                {group.title || "Untitled Group"}
                              </span>
                              <span className="text-[11px] font-mono text-muted/60 shrink-0">
                                ({group.skills?.length || 0} skills)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                                {isGroupOpen ? "Collapse" : "Expand"}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                                  isGroupOpen ? "rotate-180 text-pacific-cyan" : ""
                                }`}
                              />
                            </div>
                          </button>

                          {/* Nested Skill Group Content */}
                          <div
                            id={`skill-group-${group.id}`}
                            role="region"
                            aria-label={group.title || `Skill Group #${groupIdx + 1}`}
                            className={
                              isGroupOpen
                                ? "p-3.5 sm:p-4 border-t border-white/[0.06] flex flex-col gap-3 bg-white/[0.01]"
                                : "hidden"
                            }
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <label className="text-xs font-mono text-muted uppercase shrink-0">Title</label>
                                <input
                                  type="text"
                                  value={group.title}
                                  onChange={(e) => updateSkillGroupTitle(group.id, e.target.value)}
                                  placeholder="Group Title (e.g. Frontend)"
                                  className="px-3 py-1.5 rounded-lg bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm font-medium text-foreground outline-none transition-colors w-full max-w-xs"
                                />
                              </div>

                              <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveSkillGroup(groupIdx, "up")}
                                  disabled={groupIdx === 0}
                                  aria-label="Move skill group up"
                                  className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSkillGroup(groupIdx, "down")}
                                  disabled={groupIdx === (content.resume?.skills?.length || 1) - 1}
                                  aria-label="Move skill group down"
                                  className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSkillGroup(group.id)}
                                  aria-label="Delete skill group"
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors ml-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Skill chips */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {group.skills.map((skill, skillIdx) => (
                                <span
                                  key={skillIdx}
                                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-foreground inline-flex items-center gap-1.5"
                                >
                                  <span>{skill}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeSkillFromGroup(group.id, skillIdx)}
                                    aria-label={`Remove ${skill}`}
                                    className="text-muted hover:text-rose-400 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                              {group.skills.length === 0 && (
                                <span className="text-xs font-mono text-muted italic">No skills added yet.</span>
                              )}
                            </div>

                            {/* Add skill input & button */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={newSkillText[group.id] || ""}
                                onChange={(e) =>
                                  setNewSkillText((prev) => ({ ...prev, [group.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addSkillToGroup(group.id);
                                  }
                                }}
                                placeholder="Add skill (e.g. Next.js)..."
                                className="px-3 py-1.5 rounded-lg bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors flex-1 max-w-sm"
                              />
                              <button
                                type="button"
                                onClick={() => addSkillToGroup(group.id)}
                                className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 6. PROFESSIONAL EXPERIENCE */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleResumeSection("experience")}
                  aria-expanded={Boolean(resumeOpenSections.experience)}
                  aria-controls="resume-section-experience"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Professional Experience
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {`${(content.resume?.experience || []).length} positions`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {resumeOpenSections.experience ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          resumeOpenSections.experience ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="resume-section-experience"
                  role="region"
                  aria-label="Professional Experience"
                  className={
                    resumeOpenSections.experience
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <span className="text-xs text-muted">
                      Chronological positions and career timeline.
                    </span>
                    <button
                      type="button"
                      onClick={addExperienceItem}
                      className="px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 text-xs font-mono text-pacific-cyan inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Position</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 sm:gap-4">
                    {(content.resume?.experience || []).map((exp, expIdx) => {
                      const isExpOpen = Boolean(openExperienceRecords[exp.id]);
                      return (
                        <div
                          key={exp.id || expIdx}
                          className="rounded-xl sm:rounded-2xl border border-white/[0.08] bg-ink-black/50 overflow-hidden transition-colors hover:border-white/[0.12]"
                        >
                          {/* Nested Experience Accordion Trigger */}
                          <button
                            type="button"
                            onClick={() => toggleExperienceRecord(exp.id)}
                            aria-expanded={isExpOpen}
                            aria-controls={`exp-record-${exp.id}`}
                            className="w-full p-3 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] cursor-pointer select-none"
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted shrink-0">#{expIdx + 1}</span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                  {exp.role || "Role"}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-muted/70 truncate pl-6">
                                {exp.organization || "Organization"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-mono text-pacific-cyan/80 hidden sm:inline">
                                {exp.startDate || ""} {exp.current ? "(Present)" : exp.endDate ? `-> ${exp.endDate}` : ""}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                                  isExpOpen ? "rotate-180 text-pacific-cyan" : ""
                                }`}
                              />
                            </div>
                          </button>

                          {/* Nested Experience Content */}
                          <div
                            id={`exp-record-${exp.id}`}
                            role="region"
                            aria-label={`${exp.role || "Position"} at ${exp.organization || "Organization"}`}
                            className={
                              isExpOpen
                                ? "p-4 sm:p-5 border-t border-white/[0.06] flex flex-col gap-4 bg-white/[0.01]"
                                : "hidden"
                            }
                          >
                            {/* Card Header & Controls (Mobile Safe!) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-xs font-mono text-muted shrink-0">#{expIdx + 1}</span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground break-words">
                                  {exp.role || "Role"}
                                </span>
                                <span className="text-xs text-muted shrink-0">at</span>
                                <span className="text-xs sm:text-sm text-foreground/90 break-words">
                                  {exp.organization || "Organization"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveExperienceItem(expIdx, "up")}
                                  disabled={expIdx === 0}
                                  aria-label="Move position up"
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveExperienceItem(expIdx, "down")}
                                  disabled={expIdx === (content.resume?.experience?.length || 1) - 1}
                                  aria-label="Move position down"
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExperienceItem(exp.id)}
                                  aria-label="Delete position"
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors ml-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono text-muted uppercase">Role Title</label>
                                <input
                                  type="text"
                                  value={exp.role}
                                  onChange={(e) => updateExperienceField(exp.id, "role", e.target.value)}
                                  placeholder="e.g. Full Stack Developer"
                                  className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono text-muted uppercase">Organization / Project</label>
                                <input
                                  type="text"
                                  value={exp.organization}
                                  onChange={(e) => updateExperienceField(exp.id, "organization", e.target.value)}
                                  placeholder="e.g. RAWIN / Independent Projects"
                                  className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono text-muted uppercase">Start Date</label>
                                <input
                                  type="text"
                                  value={exp.startDate}
                                  onChange={(e) => updateExperienceField(exp.id, "startDate", e.target.value)}
                                  placeholder="e.g. 2024"
                                  className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono text-muted uppercase">End Date</label>
                                <input
                                  type="text"
                                  value={exp.endDate || ""}
                                  disabled={exp.current}
                                  onChange={(e) => updateExperienceField(exp.id, "endDate", e.target.value)}
                                  placeholder={exp.current ? "Present" : "e.g. 2025"}
                                  className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors disabled:opacity-40"
                                />
                              </div>

                              <div className="pt-2 sm:pt-6">
                                <label
                                  htmlFor={`curr-${exp.id}`}
                                  className="flex items-center gap-2.5 cursor-pointer group select-none"
                                >
                                  <div className="relative flex items-center justify-center">
                                    <input
                                      id={`curr-${exp.id}`}
                                      type="checkbox"
                                      checked={exp.current || false}
                                      onChange={(e) => updateExperienceField(exp.id, "current", e.target.checked)}
                                      className="peer sr-only"
                                    />
                                    <div
                                      className={`w-4 h-4 rounded-[5px] border transition-all flex items-center justify-center ${
                                        exp.current
                                          ? "bg-pacific-cyan border-pacific-cyan text-ink-black shadow-[0_0_10px_rgba(24,155,173,0.35)]"
                                          : "bg-ink-black/70 border-white/[0.18] group-hover:border-white/30"
                                      } peer-focus-visible:ring-2 peer-focus-visible:ring-pacific-cyan/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink-black`}
                                    >
                                      <Check
                                        className={`w-3 h-3 stroke-[3] transition-opacity duration-150 ${
                                          exp.current ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-xs font-mono text-foreground/90 group-hover:text-foreground transition-colors">
                                    Current Position (Present)
                                  </span>
                                </label>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-mono text-muted uppercase">Location (optional)</label>
                              <input
                                type="text"
                                value={exp.location || ""}
                                onChange={(e) => updateExperienceField(exp.id, "location", e.target.value)}
                                placeholder="e.g. Remote or Bengaluru, India"
                                className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                              />
                            </div>

                            {/* Bullets */}
                            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
                              <label className="text-xs font-mono text-muted uppercase">Key Responsibilities / Impact</label>
                              <div className="flex flex-col gap-2">
                                {exp.bullets.map((bullet, bulletIdx) => (
                                  <div key={bulletIdx} className="flex items-start gap-2">
                                    <span className="text-pacific-cyan mt-2 text-xs">●</span>
                                    <textarea
                                      rows={2}
                                      value={bullet}
                                      onChange={(e) => updateBulletInExperience(exp.id, bulletIdx, e.target.value)}
                                      className="px-3 py-1.5 rounded-lg bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors flex-1 resize-y leading-relaxed"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeBulletFromExperience(exp.id, bulletIdx)}
                                      aria-label="Remove bullet"
                                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors mt-1"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="w-full max-w-full flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={newBulletText[exp.id] || ""}
                                  onChange={(e) =>
                                    setNewBulletText((prev) => ({ ...prev, [exp.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addBulletToExperience(exp.id);
                                    }
                                  }}
                                  placeholder="Add bullet point..."
                                  className="flex-1 min-w-0 h-9 sm:h-[34px] px-3 py-1.5 rounded-lg bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                />
                                <button
                                  type="button"
                                  onClick={() => addBulletToExperience(exp.id)}
                                  aria-label="Add bullet"
                                  title="Add bullet"
                                  className="w-9 sm:w-auto h-9 sm:h-[34px] px-0 sm:px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-foreground inline-flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5 shrink-0" />
                                  <span className="hidden sm:inline">Add Bullet</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 7. EDUCATION */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleResumeSection("education")}
                  aria-expanded={Boolean(resumeOpenSections.education)}
                  aria-controls="resume-section-education"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Education
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {`${(content.resume?.education || []).length} records`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {resumeOpenSections.education ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          resumeOpenSections.education ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="resume-section-education"
                  role="region"
                  aria-label="Education"
                  className={
                    resumeOpenSections.education
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <span className="text-xs text-muted">
                      Academic degrees, institutions, and coursework.
                    </span>
                    <button
                      type="button"
                      onClick={addEducationItem}
                      className="px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 text-xs font-mono text-pacific-cyan inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Education</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 sm:gap-4">
                    {(content.resume?.education || []).map((edu, eduIdx) => {
                      const isEduOpen = Boolean(openEducationRecords[edu.id]);
                      return (
                        <div
                          key={edu.id || eduIdx}
                          className="rounded-xl sm:rounded-2xl border border-white/[0.08] bg-ink-black/50 overflow-hidden transition-colors hover:border-white/[0.12]"
                        >
                          {/* Nested Education Accordion Trigger */}
                          <button
                            type="button"
                            onClick={() => toggleEducationRecord(edu.id)}
                            aria-expanded={isEduOpen}
                            aria-controls={`edu-record-${edu.id}`}
                            className="w-full p-3 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] cursor-pointer select-none"
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted shrink-0">#{eduIdx + 1}</span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                  {edu.degree || "Degree"}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-muted/70 truncate pl-6">
                                {edu.institution || "Institution"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-mono text-pacific-cyan/80 hidden sm:inline">
                                {edu.startDate || ""} {edu.endDate ? `-> ${edu.endDate}` : ""}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                                  isEduOpen ? "rotate-180 text-pacific-cyan" : ""
                                }`}
                              />
                            </div>
                          </button>

                          {/* Nested Education Content */}
                          <div
                            id={`edu-record-${edu.id}`}
                            role="region"
                            aria-label={`${edu.degree || "Degree"} at ${edu.institution || "Institution"}`}
                            className={
                              isEduOpen
                                ? "p-4 sm:p-5 border-t border-white/[0.06] flex flex-col gap-4 bg-white/[0.01]"
                                : "hidden"
                            }
                          >
                            {/* Card Header & Controls (Mobile Safe!) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-xs font-mono text-muted shrink-0">#{eduIdx + 1}</span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground break-words">
                                  {edu.degree || "Degree"}
                                </span>
                                <span className="text-xs text-muted shrink-0">at</span>
                                <span className="text-xs sm:text-sm text-foreground/90 break-words">
                                  {edu.institution || "Institution"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveEducationItem(eduIdx, "up")}
                                  disabled={eduIdx === 0}
                                  aria-label="Move education record up"
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveEducationItem(eduIdx, "down")}
                                  disabled={eduIdx === (content.resume?.education?.length || 1) - 1}
                                  aria-label="Move education record down"
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeEducationItem(edu.id)}
                                  aria-label="Delete education record"
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors ml-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono text-muted uppercase">Degree / Program</label>
                                <input
                                  type="text"
                                  value={edu.degree}
                                  onChange={(e) => updateEducationField(edu.id, "degree", e.target.value)}
                                  placeholder="e.g. Bachelor of Technology in Computer Science"
                                  className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono text-muted uppercase">Institution</label>
                                <input
                                  type="text"
                                  value={edu.institution}
                                  onChange={(e) => updateEducationField(edu.id, "institution", e.target.value)}
                                  placeholder="e.g. University / College"
                                  className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono text-muted uppercase">Location</label>
                                <input
                                  type="text"
                                  value={edu.location || ""}
                                  onChange={(e) => updateEducationField(edu.id, "location", e.target.value)}
                                  placeholder="e.g. Bengaluru, India"
                                  className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono text-muted uppercase">Start Date (optional)</label>
                                <input
                                  type="text"
                                  value={edu.startDate || ""}
                                  onChange={(e) => updateEducationField(edu.id, "startDate", e.target.value)}
                                  placeholder="e.g. 2020"
                                  className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono text-muted uppercase">End Date (optional)</label>
                                <input
                                  type="text"
                                  value={edu.endDate || ""}
                                  onChange={(e) => updateEducationField(edu.id, "endDate", e.target.value)}
                                  placeholder="e.g. 2024"
                                  className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-mono text-muted uppercase">Description / Focus (optional)</label>
                              <textarea
                                rows={2}
                                value={edu.description || ""}
                                onChange={(e) => updateEducationField(edu.id, "description", e.target.value)}
                                placeholder="Relevant coursework, focus areas, or honors..."
                                className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors resize-y leading-relaxed"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Action for Resume Content */}
            <div className="pt-2 sm:pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-6 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] disabled:opacity-50 cursor-pointer select-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Resume Content</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === "uses" && (
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* Hidden JSON inputs for complex fields */}
            <input
              type="hidden"
              name="dailyStack"
              value={JSON.stringify(content.uses?.dailyStack || [])}
            />
            <input
              type="hidden"
              name="howIBuild"
              value={JSON.stringify(content.uses?.howIBuild || [])}
            />
            <input
              type="hidden"
              name="developmentStack"
              value={JSON.stringify(content.uses?.developmentStack || [])}
            />
            <input
              type="hidden"
              name="currentlyExploring"
              value={JSON.stringify(content.uses?.currentlyExploring || [])}
            />
            <input
              type="hidden"
              name="mySetup"
              value={JSON.stringify(content.uses?.mySetup || {})}
            />
            <input
              type="hidden"
              name="updatedYear"
              value={content.uses?.updatedYear || "2026"}
            />

            {/* Top Toolbar: Section summary and Expand/Collapse All */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan font-bold">
                  Uses Sections
                </span>
                <span className="text-[10px] font-mono text-muted/60">
                  (6 sections)
                </span>
              </div>
              <button
                type="button"
                onClick={toggleAllUsesSections}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors cursor-pointer select-none"
                title={
                  ["header", "dailyStack", "developmentStack", "howIBuild", "mySetup", "currentlyExploring"].every(
                    (k) => usesOpenSections[k]
                  )
                    ? "Collapse all sections"
                    : "Expand all sections"
                }
                aria-label={
                  ["header", "dailyStack", "developmentStack", "howIBuild", "mySetup", "currentlyExploring"].every(
                    (k) => usesOpenSections[k]
                  )
                    ? "Collapse all sections"
                    : "Expand all sections"
                }
              >
                <ChevronsUpDown className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                <span className="hidden sm:inline">
                  {["header", "dailyStack", "developmentStack", "howIBuild", "mySetup", "currentlyExploring"].every(
                    (k) => usesOpenSections[k]
                  )
                    ? "Collapse All"
                    : "Expand All"}
                </span>
              </button>
            </div>

            {/* Top-Level Accordion Stack */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* 1. PAGE HEADER */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleUsesSection("header")}
                  aria-expanded={Boolean(usesOpenSections.header)}
                  aria-controls="uses-section-header"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Page Header
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {[
                          content.uses?.eyebrow || "TOOLS & HARDWARE",
                          content.uses?.title || "What I Use",
                        ].join(" · ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {usesOpenSections.header ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          usesOpenSections.header ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="uses-section-header"
                  role="region"
                  aria-label="Page Header"
                  className={
                    usesOpenSections.header
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Eyebrow Badge</label>
                      <input
                        type="text"
                        name="eyebrow"
                        placeholder="TOOLS & HARDWARE"
                        value={content.uses?.eyebrow || ""}
                        onChange={(e) => handleFieldChange("uses", "eyebrow", e.target.value)}
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Update Label</label>
                      <input
                        type="text"
                        name="updateLabel"
                        placeholder="UPDATED REGULARLY · 2026"
                        value={content.uses?.updateLabel || "UPDATED REGULARLY · 2026"}
                        onChange={(e) => handleFieldChange("uses", "updateLabel", e.target.value)}
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Page Heading</label>
                      <input
                        type="text"
                        name="title"
                        placeholder="What I Use"
                        value={content.uses?.title || ""}
                        onChange={(e) => handleFieldChange("uses", "title", e.target.value)}
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Page Description</label>
                      <textarea
                        rows={3}
                        name="description"
                        placeholder="The tools, software, and workflows I actually reach for when building, designing, debugging, and shipping."
                        value={content.uses?.description || ""}
                        onChange={(e) => handleFieldChange("uses", "description", e.target.value)}
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DAILY STACK */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <div className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 border-b border-transparent">
                  <button
                    type="button"
                    onClick={() => toggleUsesSection("dailyStack")}
                    aria-expanded={Boolean(usesOpenSections.dailyStack)}
                    aria-controls="uses-section-daily-stack"
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer select-none group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate group-hover:text-pacific-cyan transition-colors">
                          Daily Stack
                        </span>
                        <span className="text-[10px] sm:text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 px-1.5 py-0.5 rounded border border-pacific-cyan/20 font-medium">
                          {(content.uses?.dailyStack || []).length}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {(content.uses?.dailyStack || []).length} tools in inventory
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleAddDailyStackItem}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer select-none"
                      title="Add Tool"
                      aria-label="Add Tool"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden xs:inline font-medium">Add Tool</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleUsesSection("dailyStack")}
                      aria-label={usesOpenSections.dailyStack ? "Collapse Daily Stack section" : "Expand Daily Stack section"}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          usesOpenSections.dailyStack ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div
                  id="uses-section-daily-stack"
                  role="region"
                  aria-label="Daily Stack"
                  className={
                    usesOpenSections.dailyStack
                      ? "p-3.5 sm:p-6 border-t border-white/[0.08] flex flex-col gap-3.5 sm:gap-4 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  {(content.uses?.dailyStack || []).length === 0 ? (
                    <div className="p-6 rounded-xl bg-ink-black/40 border border-dashed border-white/[0.08] text-center flex flex-col items-center gap-2">
                      <span className="text-xs font-mono text-muted">No tools added to daily stack yet.</span>
                      <button
                        type="button"
                        onClick={handleAddDailyStackItem}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Tool</span>
                      </button>
                    </div>
                  ) : (
                    (content.uses?.dailyStack || []).map((tool, idx) => {
                      const toolId = tool.id || `tool-${idx}`;
                      const isOpen = Boolean(openDailyStackItems[toolId]);
                      return (
                        <div
                          key={toolId}
                          data-item-card="true"
                          className={`rounded-xl border ${
                            tool.enabled === false
                              ? "bg-ink-black/30 border-white/[0.04] opacity-75"
                              : "bg-ink-black/50 border-white/[0.07] hover:border-white/[0.12]"
                          } overflow-hidden transition-colors`}
                        >
                          <UsesItemHeader
                            index={idx}
                            totalCount={(content.uses?.dailyStack || []).length}
                            title={tool.name}
                            badge={idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`}
                            metaBadge={tool.category}
                            enabled={tool.enabled !== false}
                            isOpen={isOpen}
                            onToggle={() => toggleDailyStackItem(toolId)}
                            onToggleVisibility={() => handleUpdateDailyStackItem(idx, "enabled", tool.enabled === false ? true : false)}
                            onMoveUp={() => handleMoveDailyStackItem(idx, "up")}
                            onMoveDown={() => handleMoveDailyStackItem(idx, "down")}
                            onDelete={() => handleDeleteDailyStackItem(idx)}
                            itemTypeLabel="Tool"
                            ariaControlsId={`daily-stack-item-${toolId}`}
                          />

                          {isOpen && (
                            <div
                              id={`daily-stack-item-${toolId}`}
                              role="region"
                              aria-label={tool.name || "Tool details"}
                              className="p-3.5 sm:p-5 border-t border-white/[0.06] bg-ink-black/30 flex flex-col gap-3.5 sm:gap-4"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Name</label>
                                  <input
                                    type="text"
                                    value={tool.name}
                                    onChange={(e) => handleUpdateDailyStackItem(idx, "name", e.target.value)}
                                    placeholder="VS Code"
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Category</label>
                                  <input
                                    type="text"
                                    placeholder="Editor / Terminal / Browser"
                                    value={tool.category || ""}
                                    onChange={(e) => handleUpdateDailyStackItem(idx, "category", e.target.value)}
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Icon</label>
                                  <RawinSelect
                                    name={`daily-stack-icon-${idx}`}
                                    value={tool.icon || "terminal"}
                                    onChange={(val) => handleUpdateDailyStackItem(idx, "icon", val)}
                                    options={ICON_SELECT_OPTIONS}
                                    size="sm"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5 sm:col-span-3">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Description</label>
                                  <input
                                    type="text"
                                    value={tool.description}
                                    onChange={(e) => handleUpdateDailyStackItem(idx, "description", e.target.value)}
                                    placeholder="Tool description and everyday usage context..."
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 3. DEVELOPMENT STACK */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <div className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 border-b border-transparent">
                  <button
                    type="button"
                    onClick={() => toggleUsesSection("developmentStack")}
                    aria-expanded={Boolean(usesOpenSections.developmentStack)}
                    aria-controls="uses-section-development-stack"
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer select-none group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate group-hover:text-pacific-cyan transition-colors">
                          Development Stack
                        </span>
                        <span className="text-[10px] sm:text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 px-1.5 py-0.5 rounded border border-pacific-cyan/20 font-medium">
                          {(content.uses?.developmentStack || []).length}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {(content.uses?.developmentStack || []).length} technologies mapped
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleAddDevStackItem}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer select-none"
                      title="Add Technology"
                      aria-label="Add Technology"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden xs:inline font-medium">Add Technology</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleUsesSection("developmentStack")}
                      aria-label={usesOpenSections.developmentStack ? "Collapse Development Stack section" : "Expand Development Stack section"}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          usesOpenSections.developmentStack ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div
                  id="uses-section-development-stack"
                  role="region"
                  aria-label="Development Stack"
                  className={
                    usesOpenSections.developmentStack
                      ? "p-3.5 sm:p-6 border-t border-white/[0.08] flex flex-col gap-3.5 sm:gap-4 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  {(content.uses?.developmentStack || []).length === 0 ? (
                    <div className="p-6 rounded-xl bg-ink-black/40 border border-dashed border-white/[0.08] text-center flex flex-col items-center gap-2">
                      <span className="text-xs font-mono text-muted">No technologies added to development stack yet.</span>
                      <button
                        type="button"
                        onClick={handleAddDevStackItem}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Technology</span>
                      </button>
                    </div>
                  ) : (
                    (content.uses?.developmentStack || []).map((tech, idx) => {
                      const techId = tech.id || `tech-${idx}`;
                      const isOpen = Boolean(openDevStackItems[techId]);
                      return (
                        <div
                          key={techId}
                          data-item-card="true"
                          className={`rounded-xl border ${
                            tech.enabled === false
                              ? "bg-ink-black/30 border-white/[0.04] opacity-75"
                              : "bg-ink-black/50 border-white/[0.07] hover:border-white/[0.12]"
                          } overflow-hidden transition-colors`}
                        >
                          <UsesItemHeader
                            index={idx}
                            totalCount={(content.uses?.developmentStack || []).length}
                            title={tech.name}
                            badge={`#${idx + 1}`}
                            metaBadge={tech.group || tech.category}
                            enabled={tech.enabled !== false}
                            isOpen={isOpen}
                            onToggle={() => toggleDevStackItem(techId)}
                            onToggleVisibility={() => handleUpdateDevStackItem(idx, "enabled", tech.enabled === false ? true : false)}
                            onMoveUp={() => handleMoveDevStackItem(idx, "up")}
                            onMoveDown={() => handleMoveDevStackItem(idx, "down")}
                            onDelete={() => handleDeleteDevStackItem(idx)}
                            itemTypeLabel="Technology"
                            ariaControlsId={`dev-stack-item-${techId}`}
                          />

                          {isOpen && (
                            <div
                              id={`dev-stack-item-${techId}`}
                              role="region"
                              aria-label={tech.name || "Technology details"}
                              className="p-3.5 sm:p-5 border-t border-white/[0.06] bg-ink-black/30 flex flex-col gap-3.5 sm:gap-4"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 sm:gap-4">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Name</label>
                                  <input
                                    type="text"
                                    value={tech.name}
                                    onChange={(e) => handleUpdateDevStackItem(idx, "name", e.target.value)}
                                    placeholder="Next.js"
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Group</label>
                                  <input
                                    type="text"
                                    placeholder="Core Architecture"
                                    value={tech.group || "Core Architecture"}
                                    onChange={(e) => handleUpdateDevStackItem(idx, "group", e.target.value)}
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Category</label>
                                  <input
                                    type="text"
                                    value={tech.category || ""}
                                    placeholder="Framework / Database"
                                    onChange={(e) => handleUpdateDevStackItem(idx, "category", e.target.value)}
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Icon</label>
                                  <RawinSelect
                                    name={`dev-stack-icon-${idx}`}
                                    value={tech.icon || "layers"}
                                    onChange={(val) => handleUpdateDevStackItem(idx, "icon", val)}
                                    options={ICON_SELECT_OPTIONS}
                                    size="sm"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5 sm:col-span-4">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Description</label>
                                  <input
                                    type="text"
                                    value={tech.description}
                                    onChange={(e) => handleUpdateDevStackItem(idx, "description", e.target.value)}
                                    placeholder="Application architecture, routing, and deployment details..."
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 4. HOW I BUILD */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <div className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 border-b border-transparent">
                  <button
                    type="button"
                    onClick={() => toggleUsesSection("howIBuild")}
                    aria-expanded={Boolean(usesOpenSections.howIBuild)}
                    aria-controls="uses-section-how-i-build"
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer select-none group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate group-hover:text-pacific-cyan transition-colors">
                          How I Build
                        </span>
                        <span className="text-[10px] sm:text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 px-1.5 py-0.5 rounded border border-pacific-cyan/20 font-medium">
                          {(content.uses?.howIBuild || []).length}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {(content.uses?.howIBuild || []).length} workflow steps
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleAddBuildStepItem}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer select-none"
                      title="Add Step"
                      aria-label="Add Step"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden xs:inline font-medium">Add Step</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleUsesSection("howIBuild")}
                      aria-label={usesOpenSections.howIBuild ? "Collapse How I Build section" : "Expand How I Build section"}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          usesOpenSections.howIBuild ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div
                  id="uses-section-how-i-build"
                  role="region"
                  aria-label="How I Build"
                  className={
                    usesOpenSections.howIBuild
                      ? "p-3.5 sm:p-6 border-t border-white/[0.08] flex flex-col gap-3.5 sm:gap-4 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  {(content.uses?.howIBuild || []).length === 0 ? (
                    <div className="p-6 rounded-xl bg-ink-black/40 border border-dashed border-white/[0.08] text-center flex flex-col items-center gap-2">
                      <span className="text-xs font-mono text-muted">No workflow steps added yet.</span>
                      <button
                        type="button"
                        onClick={handleAddBuildStepItem}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Step</span>
                      </button>
                    </div>
                  ) : (
                    (content.uses?.howIBuild || []).map((step, idx) => {
                      const stepId = step.id || `step-${idx}`;
                      const isOpen = Boolean(openBuildStepItems[stepId]);
                      const numBadge = step.number || step.step || (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`);
                      return (
                        <div
                          key={stepId}
                          data-item-card="true"
                          className={`rounded-xl border ${
                            step.enabled === false
                              ? "bg-ink-black/30 border-white/[0.04] opacity-75"
                              : "bg-ink-black/50 border-white/[0.07] hover:border-white/[0.12]"
                          } overflow-hidden transition-colors`}
                        >
                          <UsesItemHeader
                            index={idx}
                            totalCount={(content.uses?.howIBuild || []).length}
                            title={step.title}
                            badge={numBadge}
                            enabled={step.enabled !== false}
                            isOpen={isOpen}
                            onToggle={() => toggleBuildStepItem(stepId)}
                            onToggleVisibility={() => handleUpdateBuildStepItem(idx, "enabled", step.enabled === false ? true : false)}
                            onMoveUp={() => handleMoveBuildStepItem(idx, "up")}
                            onMoveDown={() => handleMoveBuildStepItem(idx, "down")}
                            onDelete={() => handleDeleteBuildStepItem(idx)}
                            itemTypeLabel="Step"
                            ariaControlsId={`build-step-item-${stepId}`}
                          />

                          {isOpen && (
                            <div
                              id={`build-step-item-${stepId}`}
                              role="region"
                              aria-label={step.title || "Step details"}
                              className="p-3.5 sm:p-5 border-t border-white/[0.06] bg-ink-black/30 flex flex-col gap-3.5 sm:gap-4"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 sm:gap-4">
                                <div className="flex flex-col gap-1.5 sm:col-span-1">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Number</label>
                                  <input
                                    type="text"
                                    value={step.number || step.step || ""}
                                    placeholder="01"
                                    onChange={(e) => {
                                      handleUpdateBuildStepItem(idx, "number", e.target.value);
                                      handleUpdateBuildStepItem(idx, "step", e.target.value);
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors font-mono"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5 sm:col-span-3">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Title</label>
                                  <input
                                    type="text"
                                    value={step.title}
                                    placeholder="Explore / Design / Build"
                                    onChange={(e) => handleUpdateBuildStepItem(idx, "title", e.target.value)}
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5 sm:col-span-4">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Description</label>
                                  <input
                                    type="text"
                                    value={step.description}
                                    onChange={(e) => handleUpdateBuildStepItem(idx, "description", e.target.value)}
                                    placeholder="Workflow phase details and deliverables..."
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 5. MY SETUP */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleUsesSection("mySetup")}
                  aria-expanded={Boolean(usesOpenSections.mySetup)}
                  aria-controls="uses-section-my-setup"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        My Setup
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {[
                          content.uses?.mySetup?.mainMachine?.value || "Main machine",
                          content.uses?.mySetup?.fuel?.value || "Fuel",
                          content.uses?.mySetup?.currentStatus?.value || "Current status",
                        ].join(" · ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {usesOpenSections.mySetup ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          usesOpenSections.mySetup ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="uses-section-my-setup"
                  role="region"
                  aria-label="My Setup"
                  className={
                    usesOpenSections.mySetup
                      ? "p-3.5 sm:p-6 border-t border-white/[0.08] flex flex-col gap-3.5 sm:gap-4 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  {/* Setup Item 1: Main Machine */}
                  <div className="rounded-xl border border-white/[0.07] bg-ink-black/50 overflow-hidden hover:border-white/[0.12] transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleMySetupItem("mainMachine")}
                      aria-expanded={Boolean(openMySetupItems.mainMachine)}
                      aria-controls="my-setup-main-machine"
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                          <Laptop className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-bold font-space text-foreground truncate group-hover:text-pacific-cyan transition-colors">
                            {content.uses?.mySetup?.mainMachine?.label || "Main machine"}
                          </span>
                          <span className="text-[11px] font-mono text-muted/70 truncate">
                            {content.uses?.mySetup?.mainMachine?.value || "Windows PC"}
                          </span>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            openMySetupItems.mainMachine ? "rotate-180 text-pacific-cyan" : "text-muted"
                          }`}
                        />
                      </div>
                    </button>

                    {openMySetupItems.mainMachine && (
                      <div
                        id="my-setup-main-machine"
                        role="region"
                        aria-label="Main Machine details"
                        className="p-3.5 sm:p-5 border-t border-white/[0.06] bg-ink-black/30 flex flex-col gap-3.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-mono text-muted uppercase font-medium">Label</label>
                            <input
                              type="text"
                              value={content.uses?.mySetup?.mainMachine?.label || "Main machine"}
                              onChange={(e) => handleMySetupField("mainMachine", "label", e.target.value)}
                              className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-mono text-muted uppercase font-medium">Value</label>
                            <input
                              type="text"
                              value={content.uses?.mySetup?.mainMachine?.value || "Windows PC"}
                              onChange={(e) => handleMySetupField("mainMachine", "value", e.target.value)}
                              className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-mono text-muted uppercase font-medium">Description</label>
                          <textarea
                            rows={2}
                            value={content.uses?.mySetup?.mainMachine?.description || ""}
                            onChange={(e) => handleMySetupField("mainMachine", "description", e.target.value)}
                            placeholder="Hardware, workstation details, and environment context..."
                            className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Setup Item 2: Fuel */}
                  <div className="rounded-xl border border-white/[0.07] bg-ink-black/50 overflow-hidden hover:border-white/[0.12] transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleMySetupItem("fuel")}
                      aria-expanded={Boolean(openMySetupItems.fuel)}
                      aria-controls="my-setup-fuel"
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-apricot-cream/10 border border-apricot-cream/20 flex items-center justify-center text-apricot-cream shrink-0">
                          <Flame className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-bold font-space text-foreground truncate group-hover:text-pacific-cyan transition-colors">
                            {content.uses?.mySetup?.fuel?.label || "Fuel"}
                          </span>
                          <span className="text-[11px] font-mono text-muted/70 truncate">
                            {content.uses?.mySetup?.fuel?.value || "Passion to build something worth showing."}
                          </span>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            openMySetupItems.fuel ? "rotate-180 text-pacific-cyan" : "text-muted"
                          }`}
                        />
                      </div>
                    </button>

                    {openMySetupItems.fuel && (
                      <div
                        id="my-setup-fuel"
                        role="region"
                        aria-label="Fuel details"
                        className="p-3.5 sm:p-5 border-t border-white/[0.06] bg-ink-black/30 flex flex-col gap-3.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-mono text-muted uppercase font-medium">Label</label>
                            <input
                              type="text"
                              value={content.uses?.mySetup?.fuel?.label || "Fuel"}
                              onChange={(e) => handleMySetupField("fuel", "label", e.target.value)}
                              className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-mono text-muted uppercase font-medium">Value</label>
                            <input
                              type="text"
                              value={content.uses?.mySetup?.fuel?.value || "Passion to build something worth showing."}
                              onChange={(e) => handleMySetupField("fuel", "value", e.target.value)}
                              className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-mono text-muted uppercase font-medium">Description</label>
                          <textarea
                            rows={2}
                            value={content.uses?.mySetup?.fuel?.description || ""}
                            onChange={(e) => handleMySetupField("fuel", "description", e.target.value)}
                            placeholder="Motivation, mindset, and creative drive..."
                            className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Setup Item 3: Current Status */}
                  <div className="rounded-xl border border-white/[0.07] bg-ink-black/50 overflow-hidden hover:border-white/[0.12] transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleMySetupItem("currentStatus")}
                      aria-expanded={Boolean(openMySetupItems.currentStatus)}
                      aria-controls="my-setup-current-status"
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Radio className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-bold font-space text-foreground truncate group-hover:text-pacific-cyan transition-colors">
                            {content.uses?.mySetup?.currentStatus?.label || "Current status"}
                          </span>
                          <span className="text-[11px] font-mono text-muted/70 truncate">
                            {content.uses?.mySetup?.currentStatus?.value || "Probably coding."}
                          </span>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            openMySetupItems.currentStatus ? "rotate-180 text-pacific-cyan" : "text-muted"
                          }`}
                        />
                      </div>
                    </button>

                    {openMySetupItems.currentStatus && (
                      <div
                        id="my-setup-current-status"
                        role="region"
                        aria-label="Current Status details"
                        className="p-3.5 sm:p-5 border-t border-white/[0.06] bg-ink-black/30 flex flex-col gap-3.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-mono text-muted uppercase font-medium">Label</label>
                            <input
                              type="text"
                              value={content.uses?.mySetup?.currentStatus?.label || "Current status"}
                              onChange={(e) => handleMySetupField("currentStatus", "label", e.target.value)}
                              className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-mono text-muted uppercase font-medium">Value</label>
                            <input
                              type="text"
                              value={content.uses?.mySetup?.currentStatus?.value || "Probably coding."}
                              onChange={(e) => handleMySetupField("currentStatus", "value", e.target.value)}
                              className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-mono text-muted uppercase font-medium">Description</label>
                          <textarea
                            rows={2}
                            value={content.uses?.mySetup?.currentStatus?.description || ""}
                            onChange={(e) => handleMySetupField("currentStatus", "description", e.target.value)}
                            placeholder="Current day-to-day focus and work state..."
                            className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. CURRENTLY EXPLORING */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <div className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 border-b border-transparent">
                  <button
                    type="button"
                    onClick={() => toggleUsesSection("currentlyExploring")}
                    aria-expanded={Boolean(usesOpenSections.currentlyExploring)}
                    aria-controls="uses-section-currently-exploring"
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer select-none group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate group-hover:text-pacific-cyan transition-colors">
                          Currently Exploring
                        </span>
                        <span className="text-[10px] sm:text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 px-1.5 py-0.5 rounded border border-pacific-cyan/20 font-medium">
                          {(content.uses?.currentlyExploring || []).length}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {(content.uses?.currentlyExploring || []).length} research topics
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleAddExploringItem}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer select-none"
                      title="Add Topic"
                      aria-label="Add Topic"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden xs:inline font-medium">Add Topic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleUsesSection("currentlyExploring")}
                      aria-label={usesOpenSections.currentlyExploring ? "Collapse Currently Exploring section" : "Expand Currently Exploring section"}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          usesOpenSections.currentlyExploring ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div
                  id="uses-section-currently-exploring"
                  role="region"
                  aria-label="Currently Exploring"
                  className={
                    usesOpenSections.currentlyExploring
                      ? "p-3.5 sm:p-6 border-t border-white/[0.08] flex flex-col gap-3.5 sm:gap-4 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  {(content.uses?.currentlyExploring || []).length === 0 ? (
                    <div className="p-6 rounded-xl bg-ink-black/40 border border-dashed border-white/[0.08] text-center flex flex-col items-center gap-2">
                      <span className="text-xs font-mono text-muted">No research topics added yet.</span>
                      <button
                        type="button"
                        onClick={handleAddExploringItem}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Topic</span>
                      </button>
                    </div>
                  ) : (
                    (content.uses?.currentlyExploring || []).map((topic, idx) => {
                      const topicId = topic.id || `exp-${idx}`;
                      const isOpen = Boolean(openExploringItems[topicId]);
                      return (
                        <div
                          key={topicId}
                          data-item-card="true"
                          className={`rounded-xl border ${
                            topic.enabled === false
                              ? "bg-ink-black/30 border-white/[0.04] opacity-75"
                              : "bg-ink-black/50 border-white/[0.07] hover:border-white/[0.12]"
                          } overflow-hidden transition-colors`}
                        >
                          <UsesItemHeader
                            index={idx}
                            totalCount={(content.uses?.currentlyExploring || []).length}
                            title={topic.name}
                            badge={`#${idx + 1}`}
                            metaBadge={topic.category}
                            enabled={topic.enabled !== false}
                            isOpen={isOpen}
                            onToggle={() => toggleExploringItem(topicId)}
                            onToggleVisibility={() => handleUpdateExploringItem(idx, "enabled", topic.enabled === false ? true : false)}
                            onMoveUp={() => handleMoveExploringItem(idx, "up")}
                            onMoveDown={() => handleMoveExploringItem(idx, "down")}
                            onDelete={() => handleDeleteExploringItem(idx)}
                            itemTypeLabel="Topic"
                            ariaControlsId={`exploring-item-${topicId}`}
                          />

                          {isOpen && (
                            <div
                              id={`exploring-item-${topicId}`}
                              role="region"
                              aria-label={topic.name || "Topic details"}
                              className="p-3.5 sm:p-5 border-t border-white/[0.06] bg-ink-black/30 flex flex-col gap-3.5 sm:gap-4"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Topic Name</label>
                                  <input
                                    type="text"
                                    value={topic.name}
                                    onChange={(e) => handleUpdateExploringItem(idx, "name", e.target.value)}
                                    placeholder="Edge AI"
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Category</label>
                                  <input
                                    type="text"
                                    value={topic.category || ""}
                                    placeholder="AI / Performance / Graphics"
                                    onChange={(e) => handleUpdateExploringItem(idx, "category", e.target.value)}
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Icon</label>
                                  <RawinSelect
                                    name={`exploring-icon-${idx}`}
                                    value={topic.icon || "compass"}
                                    onChange={(val) => handleUpdateExploringItem(idx, "icon", val)}
                                    options={ICON_SELECT_OPTIONS}
                                    size="sm"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5 sm:col-span-3">
                                  <label className="text-[11px] font-mono text-muted uppercase font-medium">Description</label>
                                  <input
                                    type="text"
                                    value={topic.description}
                                    onChange={(e) => handleUpdateExploringItem(idx, "description", e.target.value)}
                                    placeholder="Research focus, experiments, and technical goals..."
                                    className="px-3.5 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Save Action for Uses Content */}
            <div className="pt-2 sm:pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-6 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] disabled:opacity-50 cursor-pointer select-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Uses Content</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Hidden JSON inputs for array fields */}
            <input
              type="hidden"
              name="suggestedPrompts"
              value={JSON.stringify(content.ai.suggestedPrompts || [])}
            />

            {/* Orbit Accordions Toolbar */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted uppercase tracking-wider">
                  Orbit Sections
                </span>
                <span className="text-[10px] font-mono text-muted/60">
                  (3 sections)
                </span>
              </div>
              <button
                type="button"
                onClick={toggleAllOrbitSections}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors cursor-pointer select-none"
                title={
                  ["interface", "prompts", "verification"].every((k) => orbitOpenSections[k])
                    ? "Collapse all sections"
                    : "Expand all sections"
                }
                aria-label={
                  ["interface", "prompts", "verification"].every((k) => orbitOpenSections[k])
                    ? "Collapse all sections"
                    : "Expand all sections"
                }
              >
                <ChevronsUpDown className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                <span className="hidden sm:inline">
                  {["interface", "prompts", "verification"].every((k) => orbitOpenSections[k])
                    ? "Collapse All"
                    : "Expand All"}
                </span>
              </button>
            </div>

            {/* Top-Level Accordion Stack */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* 1. RAWIN ORBIT INTERFACE */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleOrbitSection("interface")}
                  aria-expanded={Boolean(orbitOpenSections.interface)}
                  aria-controls="orbit-section-interface"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                        Rawin Orbit Interface
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {[
                          content.ai?.eyebrow || "RAWIN ORBIT",
                          content.ai?.title || "Rawin Orbit",
                        ].join(" · ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {orbitOpenSections.interface ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          orbitOpenSections.interface ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="orbit-section-interface"
                  role="region"
                  aria-label="Rawin Orbit Interface"
                  className={
                    orbitOpenSections.interface
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Eyebrow Badge</label>
                      <input
                        type="text"
                        name="eyebrow"
                        value={content.ai.eyebrow}
                        onChange={(e) => handleFieldChange("ai", "eyebrow", e.target.value)}
                        placeholder="RAWIN ORBIT"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Orbit Title</label>
                      <input
                        type="text"
                        name="title"
                        value={content.ai.title}
                        onChange={(e) => handleFieldChange("ai", "title", e.target.value)}
                        placeholder="Rawin Orbit"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Page Description</label>
                      <textarea
                        rows={2}
                        name="description"
                        value={content.ai.description}
                        onChange={(e) => handleFieldChange("ai", "description", e.target.value)}
                        placeholder="Interactive intelligence core powered by Cloudflare Workers AI..."
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Initial Greeting Message</label>
                      <textarea
                        rows={3}
                        name="greetingMessage"
                        value={content.ai.greetingMessage}
                        onChange={(e) => handleFieldChange("ai", "greetingMessage", e.target.value)}
                        placeholder="Greetings. I am Rawin Orbit, an intelligent cognitive interface..."
                        className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Mobile Composer Placeholder</label>
                      <input
                        type="text"
                        name="mobileComposerPlaceholder"
                        value={content.ai.mobileComposerPlaceholder || ""}
                        onChange={(e) => handleFieldChange("ai", "mobileComposerPlaceholder", e.target.value)}
                        placeholder="Ask Orbit"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-muted uppercase">Desktop Composer Placeholder</label>
                      <input
                        type="text"
                        name="desktopComposerPlaceholder"
                        value={content.ai.desktopComposerPlaceholder || ""}
                        onChange={(e) => handleFieldChange("ai", "desktopComposerPlaceholder", e.target.value)}
                        placeholder="Only Ask Orbit"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-muted uppercase">Suggested Prompts Section Label</label>
                      <input
                        type="text"
                        name="suggestedPromptsLabel"
                        value={content.ai.suggestedPromptsLabel || ""}
                        onChange={(e) => handleFieldChange("ai", "suggestedPromptsLabel", e.target.value)}
                        placeholder="SUGGESTED PROMPTS"
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-xs sm:text-sm text-foreground outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SUGGESTED PROMPTS */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <div className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 border-b border-transparent">
                  <button
                    type="button"
                    onClick={() => toggleOrbitSection("prompts")}
                    aria-expanded={Boolean(orbitOpenSections.prompts)}
                    aria-controls="orbit-section-prompts"
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer select-none group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate group-hover:text-pacific-cyan transition-colors">
                          Suggested Prompts
                        </span>
                        <span className="text-[10px] sm:text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 px-1.5 py-0.5 rounded border border-pacific-cyan/20 font-medium">
                          {(content.ai?.suggestedPrompts || []).length}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        {(content.ai?.suggestedPrompts || []).length} prompts configured
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPrompt();
                      }}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer select-none"
                      title="Add Prompt"
                      aria-label="Add Prompt"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden xs:inline font-medium">Add Prompt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleOrbitSection("prompts")}
                      aria-label={orbitOpenSections.prompts ? "Collapse Suggested Prompts section" : "Expand Suggested Prompts section"}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          orbitOpenSections.prompts ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div
                  id="orbit-section-prompts"
                  role="region"
                  aria-label="Suggested Prompts"
                  className={
                    orbitOpenSections.prompts
                      ? "p-3.5 sm:p-6 border-t border-white/[0.08] flex flex-col gap-3 sm:gap-3.5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  {(content.ai?.suggestedPrompts || []).length === 0 ? (
                    <div className="p-6 rounded-xl bg-ink-black/40 border border-dashed border-white/[0.08] text-center flex flex-col items-center gap-2">
                      <span className="text-xs font-mono text-muted">No suggested prompts added yet.</span>
                      <button
                        type="button"
                        onClick={handleAddPrompt}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Prompt</span>
                      </button>
                    </div>
                  ) : (
                    (content.ai?.suggestedPrompts || []).map((prompt, idx) => (
                      <div
                        key={idx}
                        data-item-card="true"
                        className="p-2.5 sm:p-3 rounded-xl bg-ink-black/50 border border-white/[0.07] hover:border-white/[0.12] transition-colors flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-[10px] sm:text-[11px] font-mono text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 px-2 py-1 rounded shrink-0 font-medium">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={prompt}
                            onChange={(e) => handleUpdatePrompt(idx, e.target.value)}
                            placeholder="e.g. What is RAWIN?"
                            className="flex-1 min-w-0 px-3 py-1.5 sm:py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground outline-none transition-colors"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t border-white/[0.03] sm:border-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMovePrompt(idx, "up")}
                            aria-label="Move prompt up"
                            title="Move prompt up"
                            className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted hover:text-foreground disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent cursor-pointer transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (content.ai.suggestedPrompts || []).length - 1}
                            onClick={() => handleMovePrompt(idx, "down")}
                            aria-label="Move prompt down"
                            title="Move prompt down"
                            className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted hover:text-foreground disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent cursor-pointer transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePrompt(idx)}
                            aria-label="Delete prompt"
                            title="Delete prompt"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 transition-colors cursor-pointer ml-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. OWNER VERIFICATION */}
              <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => toggleOrbitSection("verification")}
                  aria-expanded={Boolean(orbitOpenSections.verification)}
                  aria-controls="orbit-section-verification"
                  className="w-full p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                          Owner Verification
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20 shrink-0 font-medium">
                          Security Setting
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                        Passcode configuration and administrative lock
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                      {orbitOpenSections.verification ? "Collapse" : "Expand"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          orbitOpenSections.verification ? "rotate-180 text-pacific-cyan" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  id="orbit-section-verification"
                  role="region"
                  aria-label="Owner Verification"
                  className={
                    orbitOpenSections.verification
                      ? "p-4 sm:p-6 border-t border-white/[0.08] flex flex-col gap-4 sm:gap-5 bg-ink-black/25"
                      : "hidden"
                  }
                >
                  <div className="p-4 sm:p-5 rounded-xl bg-ink-black/50 border border-white/[0.06] flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-muted uppercase">New Verification Code</label>
                        <div className="relative">
                          <input
                            type={showNewCode ? "text" : "password"}
                            value={newVerificationCode}
                            onChange={(e) => setNewVerificationCode(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm font-mono text-foreground outline-none transition-colors pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewCode(!showNewCode)}
                            aria-label={showNewCode ? "Hide verification code" : "Show verification code"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                          >
                            {showNewCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-muted/60">
                          Between 4 and 32 characters.
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-muted uppercase">Confirm New Code</label>
                        <div className="relative">
                          <input
                            type={showConfirmCode ? "text" : "password"}
                            value={confirmVerificationCode}
                            onChange={(e) => setConfirmVerificationCode(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm font-mono text-foreground outline-none transition-colors pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmCode(!showConfirmCode)}
                            aria-label={showConfirmCode ? "Hide confirmation code" : "Show confirmation code"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                          >
                            {showConfirmCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-muted/60">
                          Must match new verification code.
                        </span>
                      </div>
                    </div>

                    {verificationMsg && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                          verificationMsg.success
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        }`}
                      >
                        {verificationMsg.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{verificationMsg.message || verificationMsg.error}</span>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveVerificationCode}
                        disabled={isSavingCode || !newVerificationCode.trim()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pacific-cyan hover:bg-pacific-cyan/90 text-ink-black text-xs font-mono font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(24,155,173,0.3)] cursor-pointer"
                      >
                        {isSavingCode ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        <span>Save Verification Code</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Primary Save Button */}
            <div className="pt-2 sm:pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[40px] h-10 px-5 sm:px-6 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_16px_rgba(24,155,173,0.3)] disabled:opacity-50 cursor-pointer select-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Rawin Orbit Content</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
      )}
    </div>
  );
}
