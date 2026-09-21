const fs = require("fs");
const path = require("path");
const dns = require("dns");

// Configure resilient DNS resolution for Node.js on Windows environments
try {
  const currentServers = dns.getServers();
  const isLoopbackOnly =
    currentServers.length === 0 ||
    currentServers.every((s) => s === "127.0.0.1" || s === "::1");
  if (isLoopbackOnly) {
    const fallbackDns = ["8.8.8.8", "1.1.1.1"];
    dns.setServers(fallbackDns);
    const resolver = new dns.promises.Resolver();
    resolver.setServers(fallbackDns);
    const origResolve = dns.promises.resolve.bind(dns.promises);
    dns.promises.resolve = async (h, t) => {
      try {
        return await origResolve(h, t);
      } catch (err) {
        if (err && (err.code === "ECONNREFUSED" || err.code === "ETIMEOUT")) {
          return await resolver.resolve(h, t || "A");
        }
        throw err;
      }
    };
  }
} catch {
  // Ignore in restricted environments
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

let rawUri = (env.MONGODB_URI || "").trim();
if ((rawUri.startsWith('"') && rawUri.endsWith('"')) || (rawUri.startsWith("'") && rawUri.endsWith("'"))) {
  rawUri = rawUri.slice(1, -1).trim();
}
const uri = rawUri.replace(/:<([^>]+)>/, (_m, p1) => `:${p1}`);
const dbName = env.MONGODB_DB_NAME || "rawin3";

if (!uri) {
  console.error("Error: MONGODB_URI not configured in .env.local.");
  process.exit(1);
}

// Initial project dataset mapped from src/data/projects.ts
const INITIAL_PROJECTS = [
  {
    slug: "rawin-portfolio",
    title: "RAWIN 3.0 Platform",
    shortName: "RAWIN 3",
    tagline: "Next-generation developer portfolio & engineering showcase",
    description:
      "A high-performance personal portfolio and digital brand platform engineered with Next.js 15, TypeScript, Tailwind CSS, and hardware-accelerated micro-interactions.",
    problem:
      "Previous static portfolio suffered from heavy CSS bloat (~3,000 lines), unoptimized mobile re-renders, and lacked an interactive project case-study architecture.",
    solution:
      "Re-engineered from the ground up using modern component architecture, Lenis smooth scroll engine, throttled pointer-tracking spotlight with smooth performance, and structured MDX content support.",
    role: "Lead Full Stack Architect & UI Designer",
    outcome:
      "Achieved sub-second page loads, smooth interaction physics, and zero layout shift across all viewport sizes.",
    featured: true,
    status: "in-progress",
    category: "Full Stack",
    technologies: ["Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion", "Lenis", "EmailJS"],
    engineeringFocus: ["Performance", "Scalable Architecture", "Product UX"],
    displayOrder: 1,
    previewImage: "/images/profile.png",
    liveUrl: "https://rawin.world",
    githubUrl: "https://github.com/rush627",
    caseStudyAvailable: true,
    year: "2026",
  },
  {
    slug: "zenith-commerce",
    title: "Zenith Headless Commerce",
    shortName: "ZENITH",
    tagline: "Ultra-fast headless e-commerce experience with sub-100ms transitions",
    description:
      "A full-stack e-commerce experience featuring server-driven inventory synchronization, edge-cached product catalogs, and an instant checkout pipeline.",
    problem:
      "Traditional monolithic shopping cart platforms had high latency on mobile networks and lost conversions due to sluggish product filtering.",
    solution:
      "Built a modern headless frontend leveraging Next.js server components, optimistic UI cart updates, and instant search with fuzzy match indexing.",
    role: "Full Stack Developer",
    outcome:
      "Reduced average page transition times and increased user checkout completion rates significantly.",
    featured: true,
    status: "completed",
    category: "Full Stack",
    technologies: ["React", "TypeScript", "Node.js", "Tailwind CSS", "PostgreSQL", "Stripe API"],
    engineeringFocus: ["Edge Caching", "Optimistic UI", "Reliable Pipelines"],
    displayOrder: 2,
    previewImage: "/images/profile.png",
    liveUrl: "",
    githubUrl: "https://github.com/rush627",
    caseStudyAvailable: true,
    year: "2025",
  },
  {
    slug: "pulse-analytics",
    title: "Pulse Real-time Analytics",
    shortName: "PULSE",
    tagline: "Telemetry dashboard & streaming event visualization",
    description:
      "An interactive real-time observability dashboard for monitoring microservices, WebSocket events, and live throughput metrics.",
    problem:
      "Engineers lacked an intuitive, lightweight visualizer to inspect streaming operational metrics without launching heavy enterprise suites.",
    solution:
      "Developed a dark-mode first telemetry interface with WebSockets, SVG sparklines, canvas heatmaps, and customizable monitoring widgets.",
    role: "Frontend Engineer & UI Architect",
    outcome:
      "Capable of rendering streaming operational data points with zero UI frame dropping.",
    featured: true,
    status: "completed",
    category: "Web App",
    technologies: ["TypeScript", "React", "WebSockets", "Tailwind CSS", "Canvas API"],
    engineeringFocus: ["Live Telemetry", "Canvas Rendering", "Low Overhead"],
    displayOrder: 3,
    previewImage: "/images/profile.png",
    liveUrl: "",
    githubUrl: "https://github.com/rush627",
    caseStudyAvailable: true,
    year: "2025",
  },
  {
    slug: "rawin-orbit",
    title: "Rawin Orbit",
    shortName: "ORBIT",
    tagline: "Intelligent conversational system powered by Cloudflare Workers AI and dynamic portfolio knowledge",
    description:
      "A specialized AI intelligence system built for RAWIN, utilizing edge LLMs for zero-cold-start natural language responses and deep portfolio grounding.",
    problem:
      "Standard client-side chat widgets are heavy, sluggish, and often rely on expensive or rate-limited external APIs.",
    solution:
      "Integrated Cloudflare Workers AI with serverless streaming edge functions, client-side session memory, and an orbital interface.",
    role: "Full Stack Developer",
    outcome:
      "Zero server maintenance, fast edge inference, and private session management.",
    featured: false,
    status: "in-progress",
    category: "AI & Cloud",
    technologies: ["Cloudflare AI", "Next.js", "TypeScript", "Edge Workers", "Tailwind CSS"],
    engineeringFocus: ["Edge Inference", "Stream Parsing", "Session Privacy"],
    displayOrder: 4,
    previewImage: "/images/profile.png",
    liveUrl: "/ai",
    githubUrl: "https://github.com/rush627",
    caseStudyAvailable: true,
    year: "2026",
  },
];

async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 6000 });

  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas.");

    const db = client.db(dbName);
    const col = db.collection("projects");

    // Indexes
    await col.createIndex({ slug: 1 }, { unique: true });
    await col.createIndex({ featured: 1, displayOrder: 1 });
    console.log("Verified database indexes on projects collection.");

    let upsertedCount = 0;
    let modifiedCount = 0;
    let matchedCount = 0;

    for (const p of INITIAL_PROJECTS) {
      const now = new Date();
      const res = await col.updateOne(
        { slug: p.slug },
        {
          $set: {
            title: p.title,
            shortName: p.shortName,
            tagline: p.tagline,
            description: p.description,
            category: p.category,
            technologies: p.technologies,
            engineeringFocus: p.engineeringFocus || [],
            status: p.status,
            featured: p.featured,
            displayOrder: p.displayOrder,
            previewImage: p.previewImage,
            liveUrl: p.liveUrl,
            githubUrl: p.githubUrl,
            caseStudyAvailable: p.caseStudyAvailable,
            problem: p.problem,
            solution: p.solution,
            role: p.role,
            outcome: p.outcome,
            year: p.year,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      );

      if (res.upsertedCount > 0) upsertedCount++;
      else if (res.modifiedCount > 0) modifiedCount++;
      else matchedCount++;
    }

    console.log(`Migration Complete:`);
    console.log(`- Upserted: ${upsertedCount}`);
    console.log(`- Modified: ${modifiedCount}`);
    console.log(`- Already up-to-date: ${matchedCount}`);
    console.log(`Total projects in initial dataset: ${INITIAL_PROJECTS.length}`);

    const allDocs = await col.find({}, { projection: { title: 1, slug: 1, featured: 1, status: 1, displayOrder: 1 } }).toArray();
    console.log("\nCurrent projects in MongoDB Atlas:");
    allDocs.forEach((d) => {
      console.log(`  [Order ${d.displayOrder}] ${d.title} (${d.slug}) - Status: ${d.status}, Featured: ${d.featured}`);
    });
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
