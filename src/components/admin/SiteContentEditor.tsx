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
} from "lucide-react";
import RawinSelect, { type RawinSelectOption } from "./RawinSelect";
import NeoToggle from "@/components/NeoToggle";
import OrbitKnowledgeManager from "./OrbitKnowledgeManager";
import type { OrbitKnowledgeItem } from "@/lib/orbit-knowledge";
import type {
  SiteContent,
  ContentSectionKey,
  AssetKey,
  DevStackItem,
  ExploringItem,
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
} from "@/app/admin/content/actions";

const ICON_OPTIONS = [
  { value: "layers", label: "Layers" },
  { value: "code", label: "Code" },
  { value: "cpu", label: "CPU" },
  { value: "palette", label: "Palette" },
  { value: "database", label: "Database" },
  { value: "zap", label: "Zap" },
  { value: "activity", label: "Activity" },
  { value: "compass", label: "Compass" },
  { value: "git", label: "Git" },
  { value: "terminal", label: "Terminal" },
  { value: "bot", label: "Bot" },
  { value: "globe", label: "Globe" },
  { value: "sparkles", label: "Sparkles" },
  { value: "radio", label: "Radio" },
  { value: "flame", label: "Flame" },
  { value: "laptop", label: "Laptop" },
  { value: "workflow", label: "Workflow" },
  { value: "eye", label: "Eye" },
  { value: "boxes", label: "Boxes" },
  { value: "target", label: "Target" },
  { value: "send", label: "Send" },
  { value: "download", label: "Download" },
  { value: "history", label: "History" },
];

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
    key: "contact",
    label: "Contact & Social",
    icon: Mail,
    description: "Centralized contact details, social links, form placeholders, and page copy.",
  },
  {
    key: "resume",
    label: "Resume",
    icon: FileText,
    description: "Curriculum vitae subtitles, executive summary, and action labels.",
  },
  {
    key: "uses",
    label: "Uses",
    icon: Wrench,
    description: "Tools, setup, and hardware showcase overview.",
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

export default function SiteContentEditor({ initialContent, initialKnowledge = [] }: SiteContentEditorProps) {
  const [activeTab, setActiveTab] = useState<AdminTabKey>("global");
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ContentActionState | null>(null);

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
        const cacheBustUrl = `/api/assets/${assetType}?v=${Date.now()}`;
        setPreviewUrls((prev) => ({ ...prev, [assetType]: null }));
        setAssetUrls((prev) => ({ ...prev, [assetType]: cacheBustUrl }));
        setContent((prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            [assetType]: {
              ...prev.assets[assetType],
              url: cacheBustUrl,
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

  const handleAddDevStackItem = () => {
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
              name: "New Technology",
              description: "Technology role and architecture details.",
              category: "Framework",
              icon: "layers",
              displayOrder: nextOrder,
            },
          ],
        },
      };
    });
  };

  const handleUpdateDevStackItem = (
    index: number,
    field: keyof DevStackItem,
    val: string | number
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

  const handleAddExploringItem = () => {
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
              name: "New Topic",
              description: "Research notes and exploration objectives.",
              category: "Architecture",
              icon: "compass",
              displayOrder: nextOrder,
            },
          ],
        },
      };
    });
  };

  const handleUpdateExploringItem = (
    index: number,
    field: keyof ExploringItem,
    val: string | number
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
            url: `/api/resume/download?v=${Date.now()}`,
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

  const handleContactSocial = (field: "github" | "linkedin" | "twitter", val: string) => {
    setContent((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        socials: {
          ...(prev.contact.socials || { github: "", linkedin: "", twitter: "" }),
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
        role: "Software Engineer",
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
    <div className="flex flex-col gap-8">
      {/* Tab Selector Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] w-full">
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
        <div className="flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 text-pacific-cyan">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-space text-foreground">
                  Visual Identity &amp; Site Assets
                </h2>
              </div>
            </div>
          </div>

          {/* Card 1: Profile Photo */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-pacific-cyan"></span>
                <h3 className="text-base font-bold font-space text-foreground">Profile Photo</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
                  Homepage, About, OpenGraph
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAssetReset("profilePhoto")}
                disabled={assetLoading === "profilePhoto-reset"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-muted hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 cursor-pointer disabled:opacity-50"
              >
                {assetLoading === "profilePhoto-reset" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                <span>Reset to Default</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* Preview */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-ink-black/40 border border-white/5 text-center gap-3">
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pacific-cyan/40 via-apricot-cream/30 to-pacific-cyan/40 blur-md opacity-70"></div>
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-pacific-cyan/50 p-1 bg-surface/80 shadow-2xl">
                    <img
                      src={previewUrls.profilePhoto || assetUrls.profilePhoto}
                      alt={assetAlts.profilePhoto}
                      className="w-full h-full object-cover rounded-full filter contrast-105"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-muted">Active Portrait Preview</span>
                  {selectedFiles.profilePhoto && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      New file selected: {selectedFiles.profilePhoto.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="md:col-span-2 flex flex-col gap-5">
                {/* File Upload Trigger */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">
                    Upload New Image File (Max 5MB • PNG, JPG, WebP)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="upload-profilePhoto"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFileSelect("profilePhoto", e)}
                      className="hidden"
                    />
                    <label
                      htmlFor="upload-profilePhoto"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose New Image</span>
                    </label>

                    {selectedFiles.profilePhoto ? (
                      <button
                        type="button"
                        onClick={() => handleAssetUpload("profilePhoto")}
                        disabled={assetLoading === "profilePhoto-upload"}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_15px_rgba(24,155,173,0.3)] cursor-pointer disabled:opacity-50"
                      >
                        {assetLoading === "profilePhoto-upload" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Upload &amp; Save Photo</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Alt Text */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">
                    Accessible Alt Text
                  </label>
                  <input
                    type="text"
                    value={assetAlts.profilePhoto}
                    onChange={(e) =>
                      setAssetAlts((prev) => ({ ...prev, profilePhoto: e.target.value }))
                    }
                    placeholder="Rushan Siddiqui : Full Stack Developer"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                {/* Direct URL Override */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">
                    Asset URL Reference (GridFS Stream or Static Path)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={assetUrls.profilePhoto}
                      onChange={(e) =>
                        setAssetUrls((prev) => ({ ...prev, profilePhoto: e.target.value }))
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAssetSaveMeta("profilePhoto")}
                      disabled={assetLoading === "profilePhoto-meta"}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer disabled:opacity-50"
                    >
                      {assetLoading === "profilePhoto-meta" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save URL &amp; Alt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Website Logo */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-pacific-cyan"></span>
                <h3 className="text-base font-bold font-space text-foreground">Website Logo</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
                  Navbar (Unified Glow), Footer, Admin, Login
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAssetReset("logo")}
                disabled={assetLoading === "logo-reset"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-muted hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 cursor-pointer disabled:opacity-50"
              >
                {assetLoading === "logo-reset" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Reset to Default</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* Preview with atmospheric glow simulation */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-ink-black/40 border border-white/5 text-center gap-4">
                <div className="relative flex items-center justify-center p-4 rounded-xl bg-surface/50 border border-white/10 w-full max-w-[220px]">
                  {/* Atmospheric Glow simulation */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-xl bg-pacific-cyan/20 blur-lg opacity-40 pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-1 rounded-lg bg-gradient-to-r from-pacific-cyan/15 via-apricot-cream/10 to-pacific-cyan/15 blur-sm opacity-50 pointer-events-none"
                  />
                  <img
                    src={previewUrls.logo || assetUrls.logo}
                    alt={assetAlts.logo}
                    className="relative h-8 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(24,155,173,0.35)]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-muted">Navbar Glow Simulation</span>
                  {selectedFiles.logo && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      New file selected: {selectedFiles.logo.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="md:col-span-2 flex flex-col gap-5">
                {/* File Upload Trigger */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">
                    Upload New Logo File (Max 2MB • PNG, WebP)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="upload-logo"
                      type="file"
                      accept="image/png,image/webp"
                      onChange={(e) => handleFileSelect("logo", e)}
                      className="hidden"
                    />
                    <label
                      htmlFor="upload-logo"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose New Logo</span>
                    </label>

                    {selectedFiles.logo ? (
                      <button
                        type="button"
                        onClick={() => handleAssetUpload("logo")}
                        disabled={assetLoading === "logo-upload"}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_15px_rgba(24,155,173,0.3)] cursor-pointer disabled:opacity-50"
                      >
                        {assetLoading === "logo-upload" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Upload &amp; Save Logo</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Alt Text */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">
                    Logo Alt / Brand Label
                  </label>
                  <input
                    type="text"
                    value={assetAlts.logo}
                    onChange={(e) =>
                      setAssetAlts((prev) => ({ ...prev, logo: e.target.value }))
                    }
                    placeholder="RAWIN Logo"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                {/* Direct URL Override */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">
                    Logo URL Reference (GridFS Stream or Static Path)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={assetUrls.logo}
                      onChange={(e) =>
                        setAssetUrls((prev) => ({ ...prev, logo: e.target.value }))
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAssetSaveMeta("logo")}
                      disabled={assetLoading === "logo-meta"}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer disabled:opacity-50"
                    >
                      {assetLoading === "logo-meta" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save URL &amp; Alt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Website Favicon */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-pacific-cyan"></span>
                <h3 className="text-base font-bold font-space text-foreground">Website Favicon</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
                  Browser Tab, Bookmarks, Mobile Shortcut
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAssetReset("favicon")}
                disabled={assetLoading === "favicon-reset"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-muted hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 cursor-pointer disabled:opacity-50"
              >
                {assetLoading === "favicon-reset" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                <span>Reset to Default</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* Preview with simulated browser tab */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-ink-black/40 border border-white/5 text-center gap-4">
                {/* Simulated browser tab */}
                <div className="w-full flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/80 border border-white/10 w-full">
                    <img
                      src={previewUrls.favicon || assetUrls.favicon}
                      alt="Favicon"
                      className="w-4 h-4 object-contain rounded"
                    />
                    <span className="text-[11px] font-medium text-foreground truncate">
                      RAWIN | Rushan Siddiqui
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={previewUrls.favicon || assetUrls.favicon}
                        alt="32px Favicon"
                        className="w-8 h-8 object-contain p-1 rounded-lg bg-surface border border-white/10"
                      />
                      <span className="text-[9px] font-mono text-muted">32px</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={previewUrls.favicon || assetUrls.favicon}
                        alt="48px Favicon"
                        className="w-12 h-12 object-contain p-1.5 rounded-xl bg-surface border border-white/10"
                      />
                      <span className="text-[9px] font-mono text-muted">48px</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-muted">Browser Tab Mockup</span>
                  {selectedFiles.favicon && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      New file selected: {selectedFiles.favicon.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="md:col-span-2 flex flex-col gap-5">
                {/* File Upload Trigger */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">
                    Upload New Favicon (Max 1MB • PNG, ICO, WebP)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="upload-favicon"
                      type="file"
                      accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/webp"
                      onChange={(e) => handleFileSelect("favicon", e)}
                      className="hidden"
                    />
                    <label
                      htmlFor="upload-favicon"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose New Favicon</span>
                    </label>

                    {selectedFiles.favicon ? (
                      <button
                        type="button"
                        onClick={() => handleAssetUpload("favicon")}
                        disabled={assetLoading === "favicon-upload"}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_15px_rgba(24,155,173,0.3)] cursor-pointer disabled:opacity-50"
                      >
                        {assetLoading === "favicon-upload" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Upload &amp; Save Favicon</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Direct URL Override */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">
                    Favicon URL Reference (GridFS Stream or Static Path)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={assetUrls.favicon}
                      onChange={(e) =>
                        setAssetUrls((prev) => ({ ...prev, favicon: e.target.value }))
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAssetSaveMeta("favicon")}
                      disabled={assetLoading === "favicon-meta"}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-medium glass-card hover:border-pacific-cyan/40 hover:text-pacific-cyan transition-all cursor-pointer disabled:opacity-50"
                    >
                      {assetLoading === "favicon-meta" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save URL</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Editor Form Card */
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-6">
          {/* Form Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 text-pacific-cyan">
                <currentSection.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-space text-foreground">
                  {currentSection.label} Content
                </h2>
              </div>
            </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] disabled:opacity-50 cursor-pointer select-none whitespace-nowrap self-start sm:self-auto"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Brand / Site Name</label>
              <input
                type="text"
                name="brandName"
                value={content.global.brandName}
                onChange={(e) => handleFieldChange("global", "brandName", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-mono text-muted uppercase">Site Meta Title</label>
              <input
                type="text"
                name="siteTitle"
                value={content.global.siteTitle}
                onChange={(e) => handleFieldChange("global", "siteTitle", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Availability Status</label>
              <input
                type="text"
                name="availabilityStatus"
                value={content.global.availabilityStatus}
                onChange={(e) => handleFieldChange("global", "availabilityStatus", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Availability Badge Accent</label>
              <input
                type="text"
                name="availabilityBadge"
                value={content.global.availabilityBadge}
                onChange={(e) => handleFieldChange("global", "availabilityBadge", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Availability Status Color</label>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-ink-black/60 border border-white/[0.08]">
                {(
                  [
                    { value: "green", label: "Green", dot: "bg-emerald-400" },
                    { value: "orange", label: "Orange", dot: "bg-amber-400" },
                    { value: "red", label: "Red", dot: "bg-rose-400" },
                  ] as const
                ).map((opt) => {
                  const isSelected = (content.global.availabilityStatusColor || "green") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleFieldChange("global", "availabilityStatusColor", opt.value)}
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
              <input
                type="hidden"
                name="availabilityStatusColor"
                value={content.global.availabilityStatusColor || "green"}
              />
            </div>

            {/* Hidden sync inputs for backward compatibility */}
            <input
              type="hidden"
              name="location"
              value={content.contact?.location || content.global.location}
            />
            <input
              type="hidden"
              name="contactEmail"
              value={content.contact?.email || content.global.contactEmail}
            />

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
                name="footerCopyright"
                value={content.global.footerCopyright}
                onChange={(e) => handleFieldChange("global", "footerCopyright", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-mono text-muted uppercase">Footer Bullet Notification</label>
              <input
                type="text"
                name="footerBulletNotification"
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
        )}

        {activeTab === "home" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Hero Eyebrow Status</label>
              <input
                type="text"
                name="heroStatus"
                value={content.home.heroStatus}
                onChange={(e) => handleFieldChange("home", "heroStatus", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Hero Eyebrow Badge</label>
              <input
                type="text"
                name="heroBadge"
                value={content.home.heroBadge}
                onChange={(e) => handleFieldChange("home", "heroBadge", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Hero Title Prefix</label>
              <input
                type="text"
                name="heroTitlePrefix"
                value={content.home.heroTitlePrefix}
                onChange={(e) => handleFieldChange("home", "heroTitlePrefix", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Hero Name Accent</label>
              <input
                type="text"
                name="heroName"
                value={content.home.heroName}
                onChange={(e) => handleFieldChange("home", "heroName", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-mono text-muted uppercase">Hero Introduction Bio</label>
              <textarea
                rows={3}
                name="heroBio"
                value={content.home.heroBio}
                onChange={(e) => handleFieldChange("home", "heroBio", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Primary CTA Text</label>
              <input
                type="text"
                name="heroPrimaryCtaText"
                value={content.home.heroPrimaryCtaText}
                onChange={(e) => handleFieldChange("home", "heroPrimaryCtaText", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Secondary CTA Text</label>
              <input
                type="text"
                name="heroSecondaryCtaText"
                value={content.home.heroSecondaryCtaText}
                onChange={(e) => handleFieldChange("home", "heroSecondaryCtaText", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Featured Section Eyebrow</label>
              <input
                type="text"
                name="featuredDescription"
                value={content.home.featuredDescription}
                onChange={(e) => handleFieldChange("home", "featuredDescription", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Featured Section Heading</label>
              <input
                type="text"
                name="featuredHeading"
                value={content.home.featuredHeading}
                onChange={(e) => handleFieldChange("home", "featuredHeading", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="flex flex-col gap-10">
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

            {/* 1. Identity & Narrative */}
            <div className="flex flex-col gap-4 pb-8 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Introduction & Narrative
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Eyebrow Badge</label>
                  <input
                    type="text"
                    name="eyebrow"
                    value={content.about.eyebrow}
                    onChange={(e) => handleFieldChange("about", "eyebrow", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Main Heading</label>
                  <input
                    type="text"
                    name="title"
                    value={content.about.title}
                    onChange={(e) => handleFieldChange("about", "title", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Professional Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={content.about.subtitle}
                    onChange={(e) => handleFieldChange("about", "subtitle", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Lead Introduction</label>
                  <textarea
                    rows={2}
                    name="leadText"
                    value={content.about.leadText}
                    onChange={(e) => handleFieldChange("about", "leadText", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Narrative Text</label>
                  <textarea
                    rows={4}
                    name="narrativeText"
                    value={content.about.narrativeText}
                    onChange={(e) => handleFieldChange("about", "narrativeText", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 2. RAWIN EVOLUTION / A RECORD OF THE BUILD */}
            <div className="flex flex-col gap-4 pb-8 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                    RAWIN Evolution
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 text-pacific-cyan border border-pacific-cyan/20 text-xs font-mono transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Milestone
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Eyebrow</label>
                  <input
                    type="text"
                    name="evolutionEyebrow"
                    value={content.about.evolutionEyebrow || ""}
                    onChange={(e) => handleFieldChange("about", "evolutionEyebrow", e.target.value)}
                    placeholder="RAWIN EVOLUTION"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Heading</label>
                  <input
                    type="text"
                    name="evolutionHeading"
                    value={content.about.evolutionHeading || ""}
                    onChange={(e) => handleFieldChange("about", "evolutionHeading", e.target.value)}
                    placeholder="A RECORD OF THE BUILD."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Description</label>
                  <textarea
                    rows={2}
                    name="evolutionDescription"
                    value={content.about.evolutionDescription || ""}
                    onChange={(e) => handleFieldChange("about", "evolutionDescription", e.target.value)}
                    placeholder="Three generations of the digital workspace..."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>

              {/* Record of the Build Milestone & Era Labels */}
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-pacific-cyan" />
                  <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
                    Record of the Build Labels
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
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

              {/* Milestones List */}
              <div className="flex flex-col gap-4 mt-2">
                {(content.about.evolution || []).map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="flex flex-col gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] relative"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-pacific-cyan/15 text-pacific-cyan font-semibold">
                          #{idx + 1} {m.year || "YEAR"}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {m.title || "Untitled Milestone"}
                        </span>
                        {m.isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-electric-indigo/20 text-electric-indigo font-bold tracking-wider">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveMilestone(idx, "up")}
                          aria-label="Move milestone up"
                          className="p-1 rounded hover:bg-white/[0.06] text-muted disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (content.about.evolution || []).length - 1}
                          onClick={() => handleMoveMilestone(idx, "down")}
                          aria-label="Move milestone down"
                          className="p-1 rounded hover:bg-white/[0.06] text-muted disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(idx)}
                          aria-label="Delete milestone"
                          className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-muted uppercase">Current Milestone</span>
                          <span className="text-[10px] text-muted/60">Marks active site milestone</span>
                        </div>
                        <NeoToggle
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
                        <label className="text-[11px] font-mono text-muted uppercase">Technologies (comma-separated)</label>
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

                      {/* Milestone Image Management */}
                      <div className="flex flex-col gap-3 sm:col-span-3 p-3 rounded-lg bg-white/[0.01] border border-white/[0.05]">
                        <span className="text-[11px] font-mono text-muted uppercase font-semibold">Milestone Image</span>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="relative w-28 h-18 rounded-md overflow-hidden bg-ink-black/80 border border-white/[0.1] shrink-0 flex items-center justify-center">
                            {m.preview ? (
                              <img
                                src={m.preview}
                                alt={m.previewAlt || m.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-muted/40" />
                            )}
                          </div>
                          <div className="flex-1 flex flex-col gap-2 w-full">
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono text-foreground transition-colors">
                                <Upload className="w-3.5 h-3.5 text-pacific-cyan" />
                                <span>{milestoneLoading === `milestone-${idx}` ? "Uploading..." : "Upload Image"}</span>
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-white/[0.05] text-xs font-mono text-muted transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset to Default
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={m.preview}
                                onChange={(e) => handleUpdateMilestone(idx, "preview", e.target.value)}
                                placeholder="Image URL / Path"
                                className="px-2.5 py-1.5 rounded-md bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors font-mono"
                              />
                              <input
                                type="text"
                                value={m.previewAlt}
                                onChange={(e) => handleUpdateMilestone(idx, "previewAlt", e.target.value)}
                                placeholder="Alt text"
                                className="px-2.5 py-1.5 rounded-md bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. HOW I BUILD / CORE PRINCIPLES */}
            <div className="flex flex-col gap-4 pb-8 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                    How I Build (Core Principles)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddPrinciple}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 text-pacific-cyan border border-pacific-cyan/20 text-xs font-mono transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Principle
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Eyebrow</label>
                  <input
                    type="text"
                    name="principlesEyebrow"
                    value={content.about.principlesEyebrow || ""}
                    onChange={(e) => handleFieldChange("about", "principlesEyebrow", e.target.value)}
                    placeholder="HOW I BUILD"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Heading</label>
                  <input
                    type="text"
                    name="principlesHeading"
                    value={content.about.principlesHeading || ""}
                    onChange={(e) => handleFieldChange("about", "principlesHeading", e.target.value)}
                    placeholder="ENGINEERING PHILOSOPHY"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Description</label>
                  <textarea
                    rows={2}
                    name="principlesDescription"
                    value={content.about.principlesDescription || ""}
                    onChange={(e) => handleFieldChange("about", "principlesDescription", e.target.value)}
                    placeholder="Core rules that govern every line of code..."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>

              {/* Principles List */}
              <div className="flex flex-col gap-3 mt-2">
                {(content.about.principles || []).map((p, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-pacific-cyan font-bold">
                          {p.number || `0${idx + 1}`}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {p.title || "Untitled Principle"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMovePrinciple(idx, "up")}
                          aria-label="Move principle up"
                          className="p-1 rounded hover:bg-white/[0.06] text-muted disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (content.about.principles || []).length - 1}
                          onClick={() => handleMovePrinciple(idx, "down")}
                          aria-label="Move principle down"
                          className="p-1 rounded hover:bg-white/[0.06] text-muted disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePrinciple(idx)}
                          aria-label="Delete principle"
                          className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-muted uppercase">Number</label>
                        <input
                          type="text"
                          value={p.number}
                          onChange={(e) => handleUpdatePrinciple(idx, "number", e.target.value)}
                          placeholder="01"
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[10px] font-mono text-muted uppercase">Title</label>
                        <input
                          type="text"
                          value={p.title}
                          onChange={(e) => handleUpdatePrinciple(idx, "title", e.target.value)}
                          placeholder="Speed as a Feature"
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-muted uppercase">Icon</label>
                        <select
                          value={p.icon || "zap"}
                          onChange={(e) => handleUpdatePrinciple(idx, "icon", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        >
                          {ICON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-ink-black text-foreground">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-4">
                        <label className="text-[10px] font-mono text-muted uppercase">Statement / Detail</label>
                        <input
                          type="text"
                          value={p.statement}
                          onChange={(e) => handleUpdatePrinciple(idx, "statement", e.target.value)}
                          placeholder="A slow interface is a broken interface..."
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. ENGINEERING JOURNEY */}
            <div className="flex flex-col gap-4 pb-8 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Engineering Journey Section
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Eyebrow</label>
                  <input
                    type="text"
                    name="journeyEyebrow"
                    value={content.about.journeyEyebrow || ""}
                    onChange={(e) => handleFieldChange("about", "journeyEyebrow", e.target.value)}
                    placeholder="TIMELINE"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Heading</label>
                  <input
                    type="text"
                    name="journeyHeading"
                    value={content.about.journeyHeading || ""}
                    onChange={(e) => handleFieldChange("about", "journeyHeading", e.target.value)}
                    placeholder="ENGINEERING JOURNEY"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Description</label>
                  <textarea
                    rows={2}
                    name="journeyDescription"
                    value={content.about.journeyDescription || ""}
                    onChange={(e) => handleFieldChange("about", "journeyDescription", e.target.value)}
                    placeholder="Milestones along the way..."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 5. CURRENT FOCUS */}
            <div className="flex flex-col gap-4 pb-8 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                    Current Focus Areas
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddFocusArea}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 text-pacific-cyan border border-pacific-cyan/20 text-xs font-mono transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Focus Area
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Eyebrow</label>
                  <input
                    type="text"
                    name="focusEyebrow"
                    value={content.about.focusEyebrow || ""}
                    onChange={(e) => handleFieldChange("about", "focusEyebrow", e.target.value)}
                    placeholder="CURRENT FOCUS"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Heading</label>
                  <input
                    type="text"
                    name="focusHeading"
                    value={content.about.focusHeading || ""}
                    onChange={(e) => handleFieldChange("about", "focusHeading", e.target.value)}
                    placeholder="WHERE ATTENTION GOES"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Section Description</label>
                  <textarea
                    rows={2}
                    name="focusDescription"
                    value={content.about.focusDescription || ""}
                    onChange={(e) => handleFieldChange("about", "focusDescription", e.target.value)}
                    placeholder="Areas of active research and architectural exploration..."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>

              {/* Focus Areas List */}
              <div className="flex flex-col gap-3 mt-2">
                {(content.about.focusAreas || []).map((f, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                      <span className="text-xs font-medium text-foreground">
                        {f.title || "Untitled Focus Area"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveFocusArea(idx, "up")}
                          aria-label="Move focus area up"
                          className="p-1 rounded hover:bg-white/[0.06] text-muted disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (content.about.focusAreas || []).length - 1}
                          onClick={() => handleMoveFocusArea(idx, "down")}
                          aria-label="Move focus area down"
                          className="p-1 rounded hover:bg-white/[0.06] text-muted disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFocusArea(idx)}
                          aria-label="Delete focus area"
                          className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1 sm:col-span-3">
                        <label className="text-[10px] font-mono text-muted uppercase">Title</label>
                        <input
                          type="text"
                          value={f.title}
                          onChange={(e) => handleUpdateFocusArea(idx, "title", e.target.value)}
                          placeholder="Edge AI and Local Inference"
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-muted uppercase">Icon</label>
                        <select
                          value={f.icon || "terminal"}
                          onChange={(e) => handleUpdateFocusArea(idx, "icon", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        >
                          {ICON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-ink-black text-foreground">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-4">
                        <label className="text-[10px] font-mono text-muted uppercase">Description</label>
                        <input
                          type="text"
                          value={f.description}
                          onChange={(e) => handleUpdateFocusArea(idx, "description", e.target.value)}
                          placeholder="Investigating hybrid architectures combining local and edge LLMs..."
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. ABOUT CTA */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Call to Action (CTA)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">CTA Eyebrow</label>
                  <input
                    type="text"
                    name="ctaEyebrow"
                    value={content.about.ctaEyebrow || ""}
                    onChange={(e) => handleFieldChange("about", "ctaEyebrow", e.target.value)}
                    placeholder="NEXT STEP"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">CTA Heading</label>
                  <input
                    type="text"
                    name="ctaHeading"
                    value={content.about.ctaHeading || ""}
                    onChange={(e) => handleFieldChange("about", "ctaHeading", e.target.value)}
                    placeholder="WANT TO BUILD TOGETHER?"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">CTA Description</label>
                  <textarea
                    rows={2}
                    name="ctaDescription"
                    value={content.about.ctaDescription || ""}
                    onChange={(e) => handleFieldChange("about", "ctaDescription", e.target.value)}
                    placeholder="Whether you need a high-performance web application..."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Resume Button Text</label>
                  <input
                    type="text"
                    name="ctaResumeText"
                    value={content.about.ctaResumeText || ""}
                    onChange={(e) => handleFieldChange("about", "ctaResumeText", e.target.value)}
                    placeholder="View Resume"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Contact Button Text</label>
                  <input
                    type="text"
                    name="ctaContactText"
                    value={content.about.ctaContactText || ""}
                    onChange={(e) => handleFieldChange("about", "ctaContactText", e.target.value)}
                    placeholder="Get In Touch"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="flex flex-col gap-8">
            {/* Hidden JSON inputs for complex fields */}
            <input
              type="hidden"
              name="socials"
              value={JSON.stringify(content.contact.socials || { github: "", linkedin: "", twitter: "" })}
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

            {/* 1. Contact Details */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Contact Details
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Primary Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={content.contact.email || ""}
                    onChange={(e) => handleFieldChange("contact", "email", e.target.value)}
                    placeholder="rushansiddiqui5262@gmail.com"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground font-mono outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Location / City / Country</label>
                  <input
                    type="text"
                    name="location"
                    value={content.contact.location || ""}
                    onChange={(e) => handleFieldChange("contact", "location", e.target.value)}
                    placeholder="Jaunpur, Uttar Pradesh, India"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={content.contact.phone || ""}
                    onChange={(e) => handleFieldChange("contact", "phone", e.target.value)}
                    placeholder="+91 79051 09292"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground font-mono outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col justify-between gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-mono text-muted uppercase font-medium">Show Phone Number</span>
                      <span className="text-[11px] text-muted/70">Display your phone number publicly.</span>
                    </div>

                    <div className="flex items-center">
                      <NeoToggle
                        checked={Boolean(content.contact.showPhoneNumber)}
                        onChange={(checked) => handleFieldChange("contact", "showPhoneNumber", checked)}
                        ariaLabel="Toggle public phone number visibility"
                      />
                    </div>
                  </div>
                  <input
                    type="hidden"
                    name="showPhoneNumber"
                    value={content.contact.showPhoneNumber ? "true" : "false"}
                  />
                </div>
              </div>
            </div>

            {/* 2. Social Channels */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Social Channels
                </h3>
              </div>
              <p className="text-xs text-muted">
                Links are used on the Contact page, Footer, and across the site. Leave a channel URL empty to hide that social icon from public display.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">GitHub Profile URL</label>
                  <input
                    type="text"
                    value={content.contact.socials?.github || ""}
                    onChange={(e) => handleContactSocial("github", e.target.value)}
                    placeholder="https://github.com/rush627"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground font-mono outline-none transition-colors text-xs"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={content.contact.socials?.linkedin || ""}
                    onChange={(e) => handleContactSocial("linkedin", e.target.value)}
                    placeholder="https://www.linkedin.com/in/..."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground font-mono outline-none transition-colors text-xs"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">X / Twitter URL</label>
                  <input
                    type="text"
                    value={content.contact.socials?.twitter || ""}
                    onChange={(e) => handleContactSocial("twitter", e.target.value)}
                    placeholder="https://x.com/sidd_rushan__"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground font-mono outline-none transition-colors text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Contact Form Placeholders */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Contact Form Placeholders
                </h3>
              </div>
              <p className="text-xs text-muted">
                Control the dynamic example placeholder text shown inside the public Contact form inputs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Full Name Placeholder</label>
                  <input
                    type="text"
                    value={content.contact.form?.namePlaceholder || ""}
                    onChange={(e) => handleContactFormPlaceholder("namePlaceholder", e.target.value)}
                    placeholder="Jane Doe"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Email Address Placeholder</label>
                  <input
                    type="text"
                    value={content.contact.form?.emailPlaceholder || ""}
                    onChange={(e) => handleContactFormPlaceholder("emailPlaceholder", e.target.value)}
                    placeholder="jane@example.com"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Mobile Number Placeholder</label>
                  <input
                    type="text"
                    value={content.contact.form?.phonePlaceholder || ""}
                    onChange={(e) => handleContactFormPlaceholder("phonePlaceholder", e.target.value)}
                    placeholder="+1 555 0192"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Subject Placeholder</label>
                  <input
                    type="text"
                    value={content.contact.form?.subjectPlaceholder || ""}
                    onChange={(e) => handleContactFormPlaceholder("subjectPlaceholder", e.target.value)}
                    placeholder="Project Inquiry / Job Opportunity"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Message Placeholder</label>
                  <input
                    type="text"
                    value={content.contact.form?.messagePlaceholder || ""}
                    onChange={(e) => handleContactFormPlaceholder("messagePlaceholder", e.target.value)}
                    placeholder="Describe your goals, project timeline, or questions..."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 4. Page Headings & Confirmations */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Page Headings &amp; Confirmations
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Eyebrow Badge</label>
                  <input
                    type="text"
                    name="eyebrow"
                    value={content.contact.eyebrow}
                    onChange={(e) => handleFieldChange("contact", "eyebrow", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Page Heading</label>
                  <input
                    type="text"
                    name="title"
                    value={content.contact.title}
                    onChange={(e) => handleFieldChange("contact", "title", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Introduction Description</label>
                  <textarea
                    rows={3}
                    name="description"
                    value={content.contact.description}
                    onChange={(e) => handleFieldChange("contact", "description", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Success Modal Title</label>
                  <input
                    type="text"
                    name="successTitle"
                    value={content.contact.successTitle}
                    onChange={(e) => handleFieldChange("contact", "successTitle", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Success Message Confirmation</label>
                  <textarea
                    rows={2}
                    name="successMessage"
                    value={content.contact.successMessage}
                    onChange={(e) => handleFieldChange("contact", "successMessage", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>
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

            {/* 1. Header & Hero Settings */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">Hero Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Eyebrow Badge</label>
                  <input
                    type="text"
                    name="eyebrow"
                    value={content.resume.eyebrow}
                    onChange={(e) => handleFieldChange("resume", "eyebrow", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Resume Header Name</label>
                  <input
                    type="text"
                    name="title"
                    value={content.resume.title}
                    onChange={(e) => handleFieldChange("resume", "title", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Professional Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={content.resume.subtitle}
                    onChange={(e) => handleFieldChange("resume", "subtitle", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Primary CTA Button Text</label>
                  <input
                    type="text"
                    name="ctaText"
                    value={content.resume.ctaText}
                    onChange={(e) => handleFieldChange("resume", "ctaText", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 2. Contact Information */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">Contact Information</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("contact")}
                  className="text-xs font-mono text-pacific-cyan hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <span>Manage in Contact &amp; Social</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Location</label>
                  <div className="px-4 py-2.5 rounded-xl bg-ink-black/40 border border-white/[0.06] text-sm text-foreground/80 font-mono">
                    {content.contact?.location || content.global?.location || "Not configured"}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Email Address</label>
                  <div className="px-4 py-2.5 rounded-xl bg-ink-black/40 border border-white/[0.06] text-sm text-foreground/80 font-mono truncate">
                    {content.contact?.email || content.global?.contactEmail || "Not configured"}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Website URL</label>
                  <input
                    type="url"
                    value={content.resume.contact?.website || ""}
                    onChange={(e) => handleResumeContact("website", e.target.value)}
                    placeholder="https://rawin.dev"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground font-mono outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 3. Working Status */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">Working Status</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Status Text</label>
                  <input
                    type="text"
                    value={content.resume.status?.text || ""}
                    onChange={(e) => handleResumeStatus("text", e.target.value)}
                    placeholder="Available for hire"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Semantic Indicator Color</label>
                  <RawinSelect
                    name="statusIndicator"
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
                <span className="text-foreground font-sans font-medium text-sm">
                  {content.resume.status?.text || "Available for hire"}
                </span>
              </div>
            </div>

            {/* 4. Executive Summary */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <label className="text-xs font-mono text-muted uppercase">Executive Summary</label>
              <textarea
                rows={4}
                name="summary"
                value={content.resume.summary}
                onChange={(e) => handleFieldChange("resume", "summary", e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                placeholder="Concise overview of engineering focus and principles..."
              />
            </div>

            {/* 5. Resume PDF Management (GridFS) */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">Resume PDF Asset (GridFS)</h3>
                </div>
                <span className="text-xs font-mono text-muted">Max size: 10MB (PDF only)</span>
              </div>

              <div className="p-5 rounded-2xl bg-ink-black/60 border border-white/[0.08] flex flex-col gap-4">
                {content.resume?.pdf ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{content.resume.pdf.filename}</span>
                          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono text-muted">
                          {content.resume.pdf.size && (
                            <span>{(content.resume.pdf.size / (1024 * 1024)).toFixed(2)} MB</span>
                          )}
                          {content.resume.pdf.updatedAt && (
                            <span>Updated {new Date(content.resume.pdf.updatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                      <a
                        href="/api/resume/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-foreground inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-pacific-cyan" />
                        Open PDF
                      </a>

                      <label
                        htmlFor="resume-pdf-replace"
                        className="px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 text-xs font-mono text-pacific-cyan inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Replace PDF
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
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-mono text-rose-400 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.01] text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-muted">
                      <FileDown className="w-6 h-6 text-pacific-cyan/60" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">No resume PDF uploaded</p>
                      <p className="text-xs text-muted">Upload a PDF to activate the public download button on /resume.</p>
                    </div>
                    <label
                      htmlFor="resume-pdf-upload"
                      className="mt-2 px-4 py-2 rounded-xl bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 text-xs font-mono text-pacific-cyan inline-flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Resume PDF
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-pacific-cyan/[0.06] border border-pacific-cyan/30">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-pacific-cyan shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{selectedPdfFile.name}</span>
                        <span className="text-xs font-mono text-muted">{(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB (staged)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleUploadResumePdf}
                        disabled={resumePdfLoading === "upload"}
                        className="px-4 py-1.5 rounded-lg bg-pacific-cyan text-ink-black font-medium text-xs inline-flex items-center gap-1.5 hover:bg-pacific-cyan/90 transition-colors disabled:opacity-50"
                      >
                        {resumePdfLoading === "upload" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            Confirm & Upload PDF
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPdfFile(null)}
                        disabled={resumePdfLoading === "upload"}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs font-mono text-muted hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Removal Confirmation Dialog */}
                {showPdfRemoveConfirm && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-rose-300">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>Remove active Resume PDF? The public download button on /resume will be hidden immediately.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRemoveResumePdf}
                        disabled={resumePdfLoading === "remove"}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-medium inline-flex items-center gap-1 hover:bg-rose-600 transition-colors disabled:opacity-50"
                      >
                        {resumePdfLoading === "remove" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          "Confirm Remove"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPdfRemoveConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs font-mono text-foreground hover:bg-white/[0.1] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Technical Skills Groups */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">Technical Skills Groups</h3>
                </div>
                <button
                  type="button"
                  onClick={addSkillGroup}
                  className="px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 text-xs font-mono text-pacific-cyan inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Skill Group
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {(content.resume?.skills || []).map((group, groupIdx) => (
                  <div
                    key={group.id || groupIdx}
                    className="p-5 rounded-2xl bg-ink-black/60 border border-white/[0.08] flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-mono text-muted">#{groupIdx + 1}</span>
                        <input
                          type="text"
                          value={group.title}
                          onChange={(e) => updateSkillGroupTitle(group.id, e.target.value)}
                          placeholder="Group Title (e.g. Frontend)"
                          className="px-3 py-1.5 rounded-lg bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm font-medium text-foreground outline-none transition-colors w-full max-w-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSkillGroup(groupIdx, "up")}
                          disabled={groupIdx === 0}
                          className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSkillGroup(groupIdx, "down")}
                          disabled={groupIdx === (content.resume?.skills?.length || 1) - 1}
                          className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSkillGroup(group.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Skill items badges */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {group.skills.map((skill, skillIdx) => (
                        <span
                          key={skillIdx}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-foreground inline-flex items-center gap-1.5"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkillFromGroup(group.id, skillIdx)}
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

                    {/* Add skill to this group */}
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
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-foreground inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Professional Experience */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">Professional Experience</h3>
                </div>
                <button
                  type="button"
                  onClick={addExperienceItem}
                  className="px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 text-xs font-mono text-pacific-cyan inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Position
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {(content.resume?.experience || []).map((exp, expIdx) => (
                  <div
                    key={exp.id || expIdx}
                    className="p-5 rounded-2xl bg-ink-black/60 border border-white/[0.08] flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted">#{expIdx + 1}</span>
                        <span className="text-sm font-medium text-foreground">{exp.role || "Role"}</span>
                        <span className="text-xs text-muted">at</span>
                        <span className="text-sm text-foreground">{exp.organization || "Organization"}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveExperienceItem(expIdx, "up")}
                          disabled={expIdx === 0}
                          className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExperienceItem(expIdx, "down")}
                          disabled={expIdx === (content.resume?.experience?.length || 1) - 1}
                          className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExperienceItem(exp.id)}
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
                          placeholder="e.g. Full Stack Engineer"
                          className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-muted uppercase">Organization / Project</label>
                        <input
                          type="text"
                          value={exp.organization}
                          onChange={(e) => updateExperienceField(exp.id, "organization", e.target.value)}
                          placeholder="e.g. RAWIN / Independent Projects"
                          className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
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
                          className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
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
                          className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors disabled:opacity-40"
                        />
                      </div>

                      <div className="pt-6">
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
                        className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
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
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors mt-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
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
                          className="px-3 py-1.5 rounded-lg bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => addBulletToExperience(exp.id)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-foreground inline-flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add Bullet
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. Education */}
            <div className="flex flex-col gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">Education</h3>
                </div>
                <button
                  type="button"
                  onClick={addEducationItem}
                  className="px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 text-xs font-mono text-pacific-cyan inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Education
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {(content.resume?.education || []).map((edu, eduIdx) => (
                  <div
                    key={edu.id || eduIdx}
                    className="p-5 rounded-2xl bg-ink-black/60 border border-white/[0.08] flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted">#{eduIdx + 1}</span>
                        <span className="text-sm font-medium text-foreground">{edu.degree || "Degree"}</span>
                        <span className="text-xs text-muted">at</span>
                        <span className="text-sm text-foreground">{edu.institution || "Institution"}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveEducationItem(eduIdx, "up")}
                          disabled={eduIdx === 0}
                          className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveEducationItem(eduIdx, "down")}
                          disabled={eduIdx === (content.resume?.education?.length || 1) - 1}
                          className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEducationItem(edu.id)}
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
                          className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-muted uppercase">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducationField(edu.id, "institution", e.target.value)}
                          placeholder="e.g. University / College"
                          className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
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
                          className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-muted uppercase">Start Date (optional)</label>
                        <input
                          type="text"
                          value={edu.startDate || ""}
                          onChange={(e) => updateEducationField(edu.id, "startDate", e.target.value)}
                          placeholder="e.g. 2020"
                          className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-muted uppercase">End Date (optional)</label>
                        <input
                          type="text"
                          value={edu.endDate || ""}
                          onChange={(e) => updateEducationField(edu.id, "endDate", e.target.value)}
                          placeholder="e.g. 2024"
                          className="px-3.5 py-2 rounded-xl bg-ink-black/40 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
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
                ))}
              </div>
            </div>

            {/* 9. Final Resume CTA */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">Bottom Call To Action</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">CTA Heading</label>
                  <input
                    type="text"
                    value={content.resume.cta?.heading || ""}
                    onChange={(e) => handleResumeCta("heading", e.target.value)}
                    placeholder="Let's build something enduring."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">CTA Button Text</label>
                  <input
                    type="text"
                    value={content.resume.cta?.buttonText || ""}
                    onChange={(e) => handleResumeCta("buttonText", e.target.value)}
                    placeholder="Get In Touch"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">CTA Description</label>
                  <textarea
                    rows={2}
                    value={content.resume.cta?.description || ""}
                    onChange={(e) => handleResumeCta("description", e.target.value)}
                    placeholder="Available for full-time roles and high-impact engineering opportunities."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "uses" && (
          <div className="flex flex-col gap-8">
            {/* Hidden JSON inputs for complex fields */}
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

            {/* Block 1: General Info */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-xs font-mono font-semibold uppercase text-foreground">
                    General Settings
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-muted/60">
                  Hero metadata &amp; headings
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">
                    Updated Year (4 Digits)
                  </label>
                  <input
                    type="text"
                    name="updatedYear"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder="2026"
                    value={content.uses?.updatedYear || "2026"}
                    onChange={(e) => handleFieldChange("uses", "updatedYear", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors font-mono"
                  />
                  <span className="text-[10px] font-mono text-muted/60">
                    Rendered as: &ldquo;Updated regularly · {content.uses?.updatedYear || "2026"}&rdquo;
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Eyebrow Badge</label>
                  <input
                    type="text"
                    name="eyebrow"
                    value={content.uses?.eyebrow || ""}
                    onChange={(e) => handleFieldChange("uses", "eyebrow", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Page Heading</label>
                  <input
                    type="text"
                    name="title"
                    value={content.uses?.title || ""}
                    onChange={(e) => handleFieldChange("uses", "title", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Page Introduction</label>
                  <textarea
                    rows={3}
                    name="description"
                    value={content.uses?.description || ""}
                    onChange={(e) => handleFieldChange("uses", "description", e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Block 2: My Setup */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-xs font-mono font-semibold uppercase text-foreground">
                    My Setup
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-muted/60">
                  Workstation context
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Main Machine */}
                <div className="p-4 rounded-xl bg-ink-black/40 border border-white/[0.06] flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-pacific-cyan text-xs font-mono uppercase">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Main Machine</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-muted/80">Label</label>
                    <input
                      type="text"
                      value={content.uses?.mySetup?.mainMachine?.label || "Main machine"}
                      onChange={(e) => handleMySetupField("mainMachine", "label", e.target.value)}
                      className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-muted/80">Value</label>
                    <input
                      type="text"
                      value={content.uses?.mySetup?.mainMachine?.value || "Windows PC"}
                      onChange={(e) => handleMySetupField("mainMachine", "value", e.target.value)}
                      className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-muted/80">Description</label>
                    <textarea
                      rows={2}
                      value={content.uses?.mySetup?.mainMachine?.description || ""}
                      onChange={(e) => handleMySetupField("mainMachine", "description", e.target.value)}
                      className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors resize-y leading-relaxed"
                    />
                  </div>
                </div>

                {/* Fuel */}
                <div className="p-4 rounded-xl bg-ink-black/40 border border-white/[0.06] flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-apricot-cream text-xs font-mono uppercase">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Fuel</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-muted/80">Label</label>
                    <input
                      type="text"
                      value={content.uses?.mySetup?.fuel?.label || "Fuel"}
                      onChange={(e) => handleMySetupField("fuel", "label", e.target.value)}
                      className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-muted/80">Value</label>
                    <input
                      type="text"
                      value={content.uses?.mySetup?.fuel?.value || "Passion to build something worth showing."}
                      onChange={(e) => handleMySetupField("fuel", "value", e.target.value)}
                      className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-muted/80">Description</label>
                    <textarea
                      rows={2}
                      value={content.uses?.mySetup?.fuel?.description || ""}
                      onChange={(e) => handleMySetupField("fuel", "description", e.target.value)}
                      className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors resize-y leading-relaxed"
                    />
                  </div>
                </div>

                {/* Current Status */}
                <div className="p-4 rounded-xl bg-ink-black/40 border border-white/[0.06] flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Current Status</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-muted/80">Label</label>
                    <input
                      type="text"
                      value={content.uses?.mySetup?.currentStatus?.label || "Current status"}
                      onChange={(e) => handleMySetupField("currentStatus", "label", e.target.value)}
                      className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-muted/80">Value</label>
                    <input
                      type="text"
                      value={content.uses?.mySetup?.currentStatus?.value || "Probably coding."}
                      onChange={(e) => handleMySetupField("currentStatus", "value", e.target.value)}
                      className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-muted/80">Description</label>
                    <textarea
                      rows={2}
                      value={content.uses?.mySetup?.currentStatus?.description || ""}
                      onChange={(e) => handleMySetupField("currentStatus", "description", e.target.value)}
                      className="px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors resize-y leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Block 3: Development Stack */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-xs font-mono font-semibold uppercase text-foreground">
                    Development Stack ({(content.uses?.developmentStack || []).length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddDevStackItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Technology</span>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {(content.uses?.developmentStack || []).map((tech, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-ink-black/50 border border-white/[0.06] flex flex-col gap-3 hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted/60 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold font-space text-foreground">
                          {tech.name || "Untitled Item"}
                        </span>
                        {tech.category && (
                          <span className="text-[10px] font-mono text-pacific-cyan/70 bg-pacific-cyan/[0.06] border border-pacific-cyan/15 px-1.5 py-0.5 rounded">
                            {tech.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveDevStackItem(idx, "up")}
                          className="p-1 rounded-md text-muted hover:text-foreground hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (content.uses?.developmentStack || []).length - 1}
                          onClick={() => handleMoveDevStackItem(idx, "down")}
                          className="p-1 rounded-md text-muted hover:text-foreground hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDevStackItem(idx)}
                          className="p-1 rounded-md text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-muted/80 uppercase">Name</label>
                        <input
                          type="text"
                          value={tech.name}
                          onChange={(e) => handleUpdateDevStackItem(idx, "name", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-muted/80 uppercase">Category</label>
                        <input
                          type="text"
                          value={tech.category || ""}
                          onChange={(e) => handleUpdateDevStackItem(idx, "category", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-muted/80 uppercase">Icon</label>
                        <select
                          value={tech.icon || "layers"}
                          onChange={(e) => handleUpdateDevStackItem(idx, "icon", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        >
                          {ICON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-ink-black text-foreground">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-3">
                        <label className="text-[10px] font-mono text-muted/80 uppercase">Description</label>
                        <input
                          type="text"
                          value={tech.description}
                          onChange={(e) => handleUpdateDevStackItem(idx, "description", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Block 4: Currently Exploring */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-xs font-mono font-semibold uppercase text-foreground">
                    Currently Exploring ({(content.uses?.currentlyExploring || []).length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddExploringItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 hover:bg-pacific-cyan/20 border border-pacific-cyan/30 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Topic</span>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {(content.uses?.currentlyExploring || []).map((topic, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-ink-black/50 border border-white/[0.06] flex flex-col gap-3 hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted/60 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold font-space text-foreground">
                          {topic.name || "Untitled Topic"}
                        </span>
                        {topic.category && (
                          <span className="text-[10px] font-mono text-apricot-cream/70 bg-apricot-cream/[0.06] border border-apricot-cream/15 px-1.5 py-0.5 rounded">
                            {topic.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveExploringItem(idx, "up")}
                          className="p-1 rounded-md text-muted hover:text-foreground hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (content.uses?.currentlyExploring || []).length - 1}
                          onClick={() => handleMoveExploringItem(idx, "down")}
                          className="p-1 rounded-md text-muted hover:text-foreground hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExploringItem(idx)}
                          className="p-1 rounded-md text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Topic"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-muted/80 uppercase">Topic Name</label>
                        <input
                          type="text"
                          value={topic.name}
                          onChange={(e) => handleUpdateExploringItem(idx, "name", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-muted/80 uppercase">Category</label>
                        <input
                          type="text"
                          value={topic.category || ""}
                          onChange={(e) => handleUpdateExploringItem(idx, "category", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-muted/80 uppercase">Icon</label>
                        <select
                          value={topic.icon || "compass"}
                          onChange={(e) => handleUpdateExploringItem(idx, "icon", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        >
                          {ICON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-ink-black text-foreground">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-3">
                        <label className="text-[10px] font-mono text-muted/80 uppercase">Description</label>
                        <input
                          type="text"
                          value={topic.description}
                          onChange={(e) => handleUpdateExploringItem(idx, "description", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="flex flex-col gap-8">
            {/* Hidden JSON inputs for array fields */}
            <input
              type="hidden"
              name="suggestedPrompts"
              value={JSON.stringify(content.ai.suggestedPrompts || [])}
            />

            {/* Orbit Core Content */}
            <div className="flex flex-col gap-4 pb-8 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pacific-cyan" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Rawin Orbit Interface
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Eyebrow Badge</label>
                  <input
                    type="text"
                    name="eyebrow"
                    value={content.ai.eyebrow}
                    onChange={(e) => handleFieldChange("ai", "eyebrow", e.target.value)}
                    placeholder="RAWIN ORBIT"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Orbit Title</label>
                  <input
                    type="text"
                    name="title"
                    value={content.ai.title}
                    onChange={(e) => handleFieldChange("ai", "title", e.target.value)}
                    placeholder="Rawin Orbit"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Page Description</label>
                  <textarea
                    rows={2}
                    name="description"
                    value={content.ai.description}
                    onChange={(e) => handleFieldChange("ai", "description", e.target.value)}
                    placeholder="Interactive intelligence core powered by Cloudflare Workers AI..."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-mono text-muted uppercase">Initial Greeting Message</label>
                  <textarea
                    rows={3}
                    name="greetingMessage"
                    value={content.ai.greetingMessage}
                    onChange={(e) => handleFieldChange("ai", "greetingMessage", e.target.value)}
                    placeholder="Greetings. I am Rawin Orbit, an intelligent cognitive interface..."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Input Placeholder Text</label>
                  <input
                    type="text"
                    name="inputPlaceholder"
                    value={content.ai.inputPlaceholder}
                    onChange={(e) => handleFieldChange("ai", "inputPlaceholder", e.target.value)}
                    placeholder="Ask about projects, architecture, tech stack, or engineering philosophy..."
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase">Suggested Prompts Section Label</label>
                  <input
                    type="text"
                    name="suggestedPromptsLabel"
                    value={content.ai.suggestedPromptsLabel || ""}
                    onChange={(e) => handleFieldChange("ai", "suggestedPromptsLabel", e.target.value)}
                    placeholder="SUGGESTED PROMPTS"
                    className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan/40 text-sm text-foreground outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Suggested Prompts Management */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                    Suggested Prompts ({(content.ai.suggestedPrompts || []).length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddPrompt}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pacific-cyan/10 hover:bg-pacific-cyan/20 text-pacific-cyan border border-pacific-cyan/20 text-xs font-mono transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Prompt
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {(content.ai.suggestedPrompts || []).map((prompt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                  >
                    <span className="text-[11px] font-mono text-muted/60 bg-white/[0.04] px-2 py-1 rounded border border-white/[0.06] shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => handleUpdatePrompt(idx, e.target.value)}
                      placeholder="e.g. What is RAWIN?"
                      className="flex-1 px-3 py-2 rounded-lg bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMovePrompt(idx, "up")}
                        aria-label="Move prompt up"
                        className="p-1.5 rounded hover:bg-white/[0.06] text-muted disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === (content.ai.suggestedPrompts || []).length - 1}
                        onClick={() => handleMovePrompt(idx, "down")}
                        aria-label="Move prompt down"
                        className="p-1.5 rounded hover:bg-white/[0.06] text-muted disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePrompt(idx)}
                        aria-label="Delete prompt"
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Owner Verification Security Setting */}
            <div className="flex flex-col gap-4 pt-8 border-t border-white/[0.08]">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-pacific-cyan" />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                    Owner Verification
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
                    Security Setting
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Active (Masked)</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted uppercase">New Verification Code</label>
                    <div className="relative">
                      <input
                        type={showNewCode ? "text" : "password"}
                        value={newVerificationCode}
                        onChange={(e) => setNewVerificationCode(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs font-mono text-foreground outline-none transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewCode(!showNewCode)}
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs font-mono text-foreground outline-none transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmCode(!showConfirmCode)}
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pacific-cyan hover:bg-pacific-cyan/90 text-ink-black text-xs font-mono font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(24,155,173,0.3)] cursor-pointer"
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
        )}
      </form>
      )}
    </div>
  );
}
