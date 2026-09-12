const fs = require("fs");
const path = require("path");
const dns = require("dns");

try {
  const currentServers = dns.getServers();
  const isLoopbackOnly =
    currentServers.length === 0 ||
    currentServers.every((s) => s === "127.0.0.1" || s === "::1");
  if (isLoopbackOnly) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
} catch {
  // Ignore DNS set failures
}

const bcrypt = require("bcryptjs");
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

async function main() {
  const email = (env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = env.ADMIN_PASSWORD || "";
  let rawUri = (env.MONGODB_URI || "").trim();
  if (
    (rawUri.startsWith('"') && rawUri.endsWith('"')) ||
    (rawUri.startsWith("'") && rawUri.endsWith("'"))
  ) {
    rawUri = rawUri.slice(1, -1).trim();
  }
  const uri = rawUri.replace(/:<([^>]+)>/, (_match, p1) => `:${p1}`);
  const dbName = env.MONGODB_DB_NAME || "rawin3";

  if (!email || !password) {
    console.error("Error: ADMIN_EMAIL or ADMIN_PASSWORD not found in .env.local.");
    process.exit(1);
  }

  console.log("Generating secure password hash...");
  const passwordHash = await bcrypt.hash(password, 12);

  if (!uri) {
    console.log("MONGODB_URI is not set. Admin credentials will authenticate via .env.local fallback.");
    return;
  }

  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 6000,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const adminsCol = db.collection("admins");

    await adminsCol.createIndex({ email: 1 }, { unique: true });

    const result = await adminsCol.updateOne(
      { email },
      {
        $set: {
          email,
          passwordHash,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log("Admin account successfully created in MongoDB Atlas.");
    } else {
      console.log("Admin account credentials successfully updated in MongoDB Atlas.");
    }
  } catch (err) {
    console.warn("MongoDB connection warning:", err.message);
    console.log("Note: Authentication will continue working seamlessly via .env.local fallback.");
  } finally {
    await client.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});
