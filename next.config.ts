import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dasm.com.sa" },
      { protocol: "https", hostname: "dasm.com.sa" },
      { protocol: "https", hostname: "www.dasm.com.sa" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.cloudinary.com" },
    ],
  },
};

export default nextConfig;
