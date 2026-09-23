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
    redirect("/saint-denis/login");
  }

  // Live database connectivity check from active connection pool
  let isDbConnected = false;
  let dbName = "unknown";
  try {
    const db = await getDatabase();
    if (db) {
      isDbConnected = true;
      dbName = db.databaseName;
    }
  } catch {
    isDbConnected = false;
  }

  const [projects, blogPosts] = await Promise.all([
    getProjects(),
    getAllPostsAdmin(),
  ]);
  const projectCount = projects.length;
  const blogCount = blogPosts.length;

  const modules = [
    {
      title: "Projects",
      icon: FolderGit2,
      status: `Active · ${projectCount} projects`,
      color: "text-pacific-cyan",
      border: "border-pacific-cyan/30",
      href: "/saint-denis/projects",
    },
    {
      title: "Blog",
      icon: FileText,
      status: `Active · ${blogCount} articles`,
      color: "text-apricot-cream",
      border: "border-apricot-cream/30",
      href: "/saint-denis/blog",
    },
    {
      title: "Site Content",
      icon: Sliders,
      status: "Active · 7 sections",
      color: "text-emerald-400",
      border: "border-emerald-400/30",
      href: "/saint-denis/content",
    },
    {
      title: "Settings",
      icon: Settings,
      status: "Active",
      color: "text-pacific-cyan",
      border: "border-pacific-cyan/30",
      href: "/saint-denis/settings",
    },
  ];

  return (
    <>
      {/* ─── DESKTOP PRESENTATION (md: >= 768px) ─── */}
      <div className="hidden md:flex flex-col gap-10">
        {/* Top Welcome & Overview */}
        <div className="flex flex-row items-center justify-between gap-4 pb-8 border-b border-white/[0.08]">
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
        <div className="grid grid-cols-3 gap-5">
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

          <div className="grid grid-cols-2 gap-5">
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

      {/* ─── SMARTPHONE PRESENTATION (< 768px) ─── */}
      <div className="flex md:hidden flex-col gap-5">
        {/* Mobile Header */}
        <div className="flex flex-col gap-2 pb-4 border-b border-white/[0.08]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium glass-pill text-emerald-400 w-fit border border-emerald-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYSTEM OPERATIONAL</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-space">
            RAWIN ADMIN <span className="text-pacific-cyan">Dashboard</span>
          </h1>
        </div>

        {/* Mobile System Status Panel */}
        <div className="flex flex-col gap-2.5">
          {/* Database Connection Card */}
          <div className="rounded-xl p-3.5 bg-surface/70 border border-white/[0.08] backdrop-blur-xl flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3 h-3 text-pacific-cyan" />
                Database Connection
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isDbConnected ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>
                {isDbConnected ? "ONLINE" : "STANDBY"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isDbConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-sm font-bold font-space text-foreground">
                {isDbConnected ? "Connected" : "Standby"}
              </span>
              <span className="text-[11px] font-mono text-muted/70 truncate">
                · {dbName}
              </span>
            </div>
          </div>

          {/* Active Session & Session Expiry row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Active Session */}
            <div className="rounded-xl p-3.5 bg-surface/70 border border-white/[0.08] backdrop-blur-xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Active Session
                </span>
                <span className="text-[10px] font-mono text-muted/70 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-sm font-bold font-space text-foreground truncate" title={session.email}>
                  {session.email}
                </span>
              </div>
            </div>

            {/* Session Expiry */}
            <div className="rounded-xl p-3.5 bg-surface/70 border border-white/[0.08] backdrop-blur-xl flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-apricot-cream" />
                Session Expiry
              </span>
              <span className="text-sm font-bold font-space text-foreground">
                7 Days
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Management Section */}
        <div className="flex flex-col gap-3 pt-1">
          <h2 className="text-xs font-mono text-muted uppercase tracking-wider font-semibold">
            Management
          </h2>

          <div className="flex flex-col gap-2.5">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.title}
                  className="rounded-xl p-3.5 bg-surface/70 border border-white/[0.08] backdrop-blur-xl flex items-center justify-between gap-3 hover:border-white/[0.14] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-pacific-cyan" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-sm font-bold font-space text-foreground leading-tight truncate">
                        {mod.title}
                      </h3>
                      <span className="text-[11px] font-mono text-pacific-cyan truncate mt-0.5">
                        {mod.status}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={mod.href}
                    className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-pacific-cyan/90 transition-all shadow-[0_0_10px_rgba(24,155,173,0.25)] min-h-[38px] cursor-pointer"
                  >
                    Manage
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
