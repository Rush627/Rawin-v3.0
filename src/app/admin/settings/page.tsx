import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings, ArrowLeft } from "lucide-react";
import { GridFSBucket } from "mongodb";
import { getAdminSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { getSiteContent } from "@/lib/site-content";
import SettingsView from "@/components/admin/SettingsView";

export const metadata = {
  title: "Settings | RAWIN Admin",
  description: "Administrator security, session configuration, and system status.",
};

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?redirect=/admin/settings");
  }

  const siteContent = await getSiteContent();

  let isDbConnected = false;
  let dbName = "unknown";
  let isGridFsReady = false;

  try {
    const db = await getDatabase();
    if (db) {
      await db.command({ ping: 1 });
      isDbConnected = true;
      dbName = db.databaseName;

      // Safe GridFS operational check
      const bucket = new GridFSBucket(db, { bucketName: "site_assets" });
      await bucket.find({}).limit(1).toArray();
      isGridFsReady = true;
    }
  } catch (err) {
    console.warn("[Settings] Status probe notice:", err);
  }

  const sessionSecurity = {
    cookieName: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAgeDays: 7,
    hasSecret: !!process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32,
  };

  const securityConfig = {
    hasSessionSecret: !!process.env.SESSION_SECRET,
    hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
    nodeEnv: process.env.NODE_ENV || "development",
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
            title="Return to Main Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
              <Settings className="w-3.5 h-3.5" />
              <span>SYSTEM CONFIGURATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
              Admin <span className="text-pacific-cyan">Settings</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Settings Interactive View */}
      <SettingsView
        adminEmail={session.email}
        isDbConnected={isDbConnected}
        dbName={dbName}
        isGridFsReady={isGridFsReady}
        sessionSecurity={sessionSecurity}
        securityConfig={securityConfig}
        initialMaintenance={siteContent.maintenance}
      />
    </div>
  );
}
