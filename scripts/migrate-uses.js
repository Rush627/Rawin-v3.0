const fs = require("fs");
const path = require("path");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore DNS set failures
}

const { MongoClient } = require("mongodb");

const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local file not found.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
});

const DEFAULT_DAILY_STACK = [
  {
    id: "daily-vscode",
    name: "VS Code",
    category: "Editor",
    description: "Primary editor for everyday development.",
    icon: "code",
    order: 1,
    enabled: true,
  },
  {
    id: "daily-antigravity",
    name: "Antigravity",
    category: "AI & Workspace",
    description: "AI-assisted development, project exploration, and rapid iteration.",
    icon: "bot",
    order: 2,
    enabled: true,
  },
  {
    id: "daily-terminal",
    name: "Windows Terminal / PowerShell",
    category: "Terminal",
    description: "Git, npm, scripts, system tasks, and project automation.",
    icon: "terminal",
    order: 3,
    enabled: true,
  },
  {
    id: "daily-chrome",
    name: "Chrome",
    category: "Browser",
    description: "Responsive testing, DevTools, debugging, and research.",
    icon: "globe",
    order: 4,
    enabled: true,
  },
  {
    id: "daily-figma",
    name: "Figma",
    category: "Design",
    description: "UI exploration, layouts, visual systems, and prototypes.",
    icon: "palette",
    order: 5,
    enabled: true,
  },
  {
    id: "daily-git",
    name: "Git / GitHub",
    category: "Version Control",
    description: "Version control, project history, and collaboration.",
    icon: "git",
    order: 6,
    enabled: true,
  },
];

const DEFAULT_HOW_I_BUILD = [
  {
    id: "build-01",
    step: "01",
    title: "Explore",
    description: "Break down the problem and research what matters.",
    order: 1,
    enabled: true,
  },
  {
    id: "build-02",
    step: "02",
    title: "Design",
    description: "Shape the interface before adding unnecessary complexity.",
    order: 2,
    enabled: true,
  },
  {
    id: "build-03",
    step: "03",
    title: "Build",
    description: "Turn the system into reusable, maintainable components.",
    order: 3,
    enabled: true,
  },
  {
    id: "build-04",
    step: "04",
    title: "Refine",
    description: "Test interaction, responsiveness, accessibility, and performance.",
    order: 4,
    enabled: true,
  },
  {
    id: "build-05",
    step: "05",
    title: "Ship",
    description: "Deploy, observe, iterate, and improve.",
    order: 5,
    enabled: true,
  },
];

const GROUP_MAPPING = {
  "next.js": "Core Architecture",
  react: "Core Architecture",
  typescript: "Core Architecture",
  "tailwind css": "Core Architecture",
  mongodb: "Data & Infrastructure",
  "cloudflare workers / ai": "Data & Infrastructure",
  "framer motion": "Motion & Interaction",
  lenis: "Motion & Interaction",
  "git / github": "Version Control",
};

async function migrate() {
  const uri = env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI not set.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(env.MONGODB_DB_NAME || "rawin3");
    const doc = await db.collection("site_content").findOne({ key: "main" });

    if (!doc) {
      console.error("Error: site_content document not found!");
      process.exit(1);
    }

    const currentUses = doc.uses || {};
    const updates = {};

    // 1. Daily Stack: initialize if missing or empty
    if (!Array.isArray(currentUses.dailyStack) || currentUses.dailyStack.length === 0) {
      updates["uses.dailyStack"] = DEFAULT_DAILY_STACK;
      console.log("Adding default dailyStack (6 tools)...");
    }

    // 2. How I Build: initialize if missing or empty
    if (!Array.isArray(currentUses.howIBuild) || currentUses.howIBuild.length === 0) {
      updates["uses.howIBuild"] = DEFAULT_HOW_I_BUILD;
      console.log("Adding default howIBuild (5 steps)...");
    }

    // 3. Update description to match prompt Section 5 if generic
    if (!currentUses.description || currentUses.description.includes("high-performance")) {
      updates["uses.description"] =
        "The tools, software, and workflows I actually reach for when building, designing, debugging, and shipping.";
      console.log("Updating uses.description to developer workbench tone...");
    }

    // 4. UpdateLabel
    if (!currentUses.updateLabel) {
      updates["uses.updateLabel"] = "UPDATED REGULARLY · 2026";
      console.log("Adding uses.updateLabel...");
    }

    // 5. Enhance developmentStack items with group and enabled if missing
    if (Array.isArray(currentUses.developmentStack) && currentUses.developmentStack.length > 0) {
      let needsDevUpdate = false;
      const enhancedDevStack = currentUses.developmentStack.map((item, idx) => {
        const lowerName = String(item.name || "").toLowerCase().trim();
        const group = item.group || GROUP_MAPPING[lowerName] || "Core Architecture";
        const enabled = item.enabled !== false;
        const id = item.id || `dev-${idx + 1}`;
        if (!item.group || item.enabled === undefined || !item.id) {
          needsDevUpdate = true;
        }
        return {
          ...item,
          id,
          group,
          enabled,
        };
      });
      if (needsDevUpdate) {
        updates["uses.developmentStack"] = enhancedDevStack;
        console.log("Enhanced developmentStack with group, id, and enabled fields...");
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.collection("site_content").updateOne({ key: "main" }, { $set: updates });
      console.log("Migration applied successfully!");
    } else {
      console.log("No migration needed, uses content is already up to date.");
    }
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
