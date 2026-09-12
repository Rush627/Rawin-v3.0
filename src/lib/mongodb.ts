import { MongoClient, Db } from "mongodb";
import dns from "dns";

// Ensure resilient SRV and TXT record resolution across all network configurations
// Specifically required for Node.js environments (such as Windows) where c-ares
// defaults to loopback (127.0.0.1 / ::1), causing SRV lookups for MongoDB Atlas
// clusters to fail with ECONNREFUSED because no local DNS server is on port 53.
try {
  // 1. Try global setServers on both bundled and native runtime modules
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  const runtimeDns = typeof eval === "function" ? eval("require")("dns") : dns;
  if (runtimeDns && typeof runtimeDns.setServers === "function") {
    runtimeDns.setServers(["8.8.8.8", "1.1.1.1"]);
  }

  // 2. Attach transparent fallback resolver on dns.promises.resolve
  // (the exact method invoked by mongodb driver's resolveSRVRecord)
  const targetDns = (runtimeDns && runtimeDns.promises) ? runtimeDns : dns;
  if (targetDns && targetDns.promises) {
    const fallbackResolver = new targetDns.promises.Resolver();
    fallbackResolver.setServers(["8.8.8.8", "1.1.1.1"]);

    const origResolve = targetDns.promises.resolve.bind(targetDns.promises);
    targetDns.promises.resolve = async (hostname: string, rrtype?: string) => {
      try {
        return await origResolve(hostname, (rrtype || "A") as any);
      } catch (err: unknown) {
        // Transparent fallback to public Google/Cloudflare resolvers
        return await fallbackResolver.resolve(hostname, (rrtype || "A") as any);
      }
    };
  }
} catch (err) {
  // Ignore in restricted sandboxes
}

/**
 * Normalizes MongoDB connection URI:
 * Trims extraneous whitespace, removes optional outer quotes, and strips
 * inadvertent Atlas copy-paste angle brackets around the password (:<password>@)
 * without exposing or logging credentials.
 */
function normalizeMongoUri(rawUri: string): string {
  let cleaned = rawUri.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.replace(/:<([^>]+)>/, (_match, p1) => `:${p1}`);
}

const rawUri = process.env.MONGODB_URI || "";
const uri = normalizeMongoUri(rawUri);
const dbName = process.env.MONGODB_DB_NAME || "rawin3";

declare global {
  // Allow global caching across hot-module reloads in development
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(
      new Error("MONGODB_URI is not configured in environment variables.")
    );
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    global._mongoClientPromise = client.connect().catch((err) => {
      // Clear cached promise on rejection so subsequent calls can retry
      global._mongoClientPromise = undefined;
      throw err;
    });
  }
  return global._mongoClientPromise;
}

const clientPromise = uri ? getClientPromise() : Promise.reject(
  new Error("MONGODB_URI is not configured in environment variables.")
);

/**
 * Returns the active MongoDB database instance.
 * Gracefully handles connection failures without crashing the application.
 */
export async function getDatabase(): Promise<Db | null> {
  if (!uri) {
    return null;
  }
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[MongoDB] Connection failure:", message);
    return null;
  }
}

export default clientPromise;
