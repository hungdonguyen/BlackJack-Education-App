import type { NextConfig } from "next";

const deployTarget = (process.env.NEXT_PUBLIC_DEPLOY_TARGET ?? "default").toLowerCase();
const isItchBuild = deployTarget === "itch";
const isProdBuild = process.env.NODE_ENV === "production";
const basePathRaw = (process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "").trim();
const normalizedBasePath = basePathRaw
  ? `/${basePathRaw.replace(/^\/+|\/+$/g, "")}`
  : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: normalizedBasePath || undefined,
  // Keep dev server chunk URLs absolute (/ _next/...) to avoid nested-route 404s.
  // Use relative assets only for production static export uploaded to itch.io.
  assetPrefix: isItchBuild && isProdBuild ? "./" : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
