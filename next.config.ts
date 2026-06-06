import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native bindings + their bundled data files can't be processed by Turbopack/
  // webpack. Mark them as external so Next leaves them in node_modules and
  // require()s them at runtime.
  serverExternalPackages: ["@node-rs/jieba"],
};

export default nextConfig;
