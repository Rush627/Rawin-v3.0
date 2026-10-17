import type { NextConfig } from "next";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch { }

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["mongodb"],
  images: {
    // 75 is the default; 85 keeps the UI text in project and milestone screenshots crisp
    // (lib/image-source.ts). Next 16 only serves qualities listed here.
    qualities: [75, 85],
  },
  experimental: {
    cpus: 1,
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    return [
      {
        // Ogg Opus site audio (public/audio): the static server has no type for ".opus"
        source: "/audio/:name*.opus",
        headers: [{ key: "Content-Type", value: "audio/ogg; codecs=opus" }],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Structural policy only: no framing, no <base> or plugin injection, forms post to
            // this origin. A script-src policy would need per-request nonces for the inline
            // theme script and Next's own inline scripts, so it is not enabled here.
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            // Microphone stays limited to this origin so Orbit dictation can work; everything else is off.
            value: "camera=(), microphone=(self), geolocation=(), payment=()",
          },
          ...(process.env.NODE_ENV === "production"
            ? [
              {
                key: "Strict-Transport-Security",
                value: "max-age=63072000; includeSubDomains; preload",
              },
            ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
