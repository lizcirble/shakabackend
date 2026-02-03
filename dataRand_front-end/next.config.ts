import fs from "fs";
import path from "path";
import type { NextConfig } from "next";

const envFiles = [".env.local", ".env.production", ".env"];

for (const fileName of envFiles) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) continue;

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"]
  }
};

export default nextConfig;
