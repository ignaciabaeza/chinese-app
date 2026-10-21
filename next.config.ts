import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // deploy.sh builds into a side directory (NEXT_DIST_DIR=.next-build) while
  // the live app keeps serving .next, then swaps the two.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Native bindings + their bundled data files can't be processed by Turbopack/
  // webpack. Mark them as external so Next leaves them in node_modules and
  // require()s them at runtime.
  serverExternalPackages: ["@node-rs/jieba"],
};

export default nextConfig;
