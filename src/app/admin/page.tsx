import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FolderGit2,
  FileText,
  Sliders,
  Settings,
  Database,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { getProjects } from "@/lib/projects";
import { getAllPostsAdmin } from "@/lib/blog";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  // Live database connectivity check
  let isDbConnected = false;
  let dbName = "unknown";
  try {
    const db = await getDatabase();
    if (db) {
      await db.command({ ping: 1 });
      isDbConnected = true;
      dbName = db.databaseName;
    }
  } catch {
    isDbConnected = false;
  }

  const projects = await getProjects();
  const projectCount = projects.length;

  const blogPosts = await getAllPostsAdmin();
  const blogCount = blogPosts.length;

  const modules = [
    {
      title: "Projects",
      icon: FolderGit2,
      status: `Active · ${projectCount} projects`,
      color: "text-pacific-cyan",
      border: "border-pacific-cyan/30",
      href: "/admin/projects",
    },
    {
      title: "Blog",
      icon: FileText,
      status: `Active · ${blogCount} articles`,
      color: "text-apricot-cream",
      border: "border-apricot-cream/30",
      href: "/admin/blog",
    },
    {
      title: "Site Content",
      icon: Sliders,
      status: "Active · 7 sections",
      color: "text-emerald-400",
      border: "border-emerald-400/30",
      href: "/admin/content",
    },
    {
      title: "Settings",
      icon: Settings,
      status: "Active",
      color: "text-pacific-cyan",
      border: "border-pacific-cyan/30",
      href: "/admin/settings",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Top Welcome & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/[0.08]">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-emerald-400 w-fit border border-emerald-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYSTEM OPERATIONAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
            RAWIN ADMIN <span className="text-pacific-cyan">Dashboard</span>
          </h1>
        </div>
      </div>

      {/* System Infrastructure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* MongoDB Status */}
        <div className="glass-card rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              Database Connection
            </span>
            <Database className="w-4 h-4 text-pacific-cyan" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {isDbConnected ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-lg font-bold font-space text-foreground">
                    Connected
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-lg font-bold font-space text-foreground">
                    Standby / Fallback
                  </span>
                </>
              )}
            </div>
            <p className="text-xs font-mono text-muted">
              {isDbConnected ? `Cluster database: ${dbName}` : "Awaiting database credentials verification"}
            </p>
          </div>
        </div>

        {/* Authentication Status */}
        <div className="glass-card rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              Active Session
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-lg font-bold font-space text-foreground truncate max-w-[220px]" title={session.email}>
                {session.email}
              </span>
            </div>
            <p className="text-xs font-mono text-muted">
              Single Administrator Role
            </p>
          </div>
        </div>

        {/* Session Expiry */}
        <div className="glass-card rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              Session
            </span>
            <Clock className="w-4 h-4 text-apricot-cream" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold font-space text-foreground">
              7 Days
            </span>
          </div>
        </div>
      </div>

      {/* Management Modules Grid */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold font-space text-foreground">
            Management
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className="glass-card rounded-2xl p-6 sm:p-7 border border-white/[0.06] flex flex-col justify-between gap-6 hover:border-white/[0.12] transition-colors"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-foreground">
                      <Icon className="w-5 h-5 text-pacific-cyan" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold font-space text-foreground mt-1">
                    {mod.title}
                  </h3>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className="text-pacific-cyan font-medium">
                    {mod.status}
                  </span>
                  <Link
                    href={mod.href}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-pacific-cyan text-ink-black font-semibold hover:bg-pacific-cyan/90 transition-all shadow-[0_0_12px_rgba(24,155,173,0.25)] cursor-pointer"
                  >
                    <span>Manage</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
