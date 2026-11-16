import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build (.next/standalone) for the Proxmox container.
  output: "standalone",
  poweredByHeader: false,
  // Don't let `next dev` generate an AGENTS.md in the repo.
  agentRules: false,
};

export default nextConfig;
