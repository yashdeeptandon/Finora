import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@pkg/ui", "@pkg/schemas", "@pkg/types"], // <-- important
};

export default nextConfig;
