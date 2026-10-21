import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // deploy.sh builds into a side directory (NEXT_DIST_DIR=.next-build) while
  // the live app keeps serving .next, then swaps the two.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Don't advertise the framework to scanners.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Production is HTTPS-only (nginx redirects :80); tell browsers to
          // never try plain HTTP again.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  // Native bindings + their bundled data files can't be processed by Turbopack/
  // webpack. Mark them as external so Next leaves them in node_modules and
  // require()s them at runtime.
  serverExternalPackages: ["@node-rs/jieba"],
};

export default nextConfig;
