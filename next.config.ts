import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Görseller yalnızca Supabase Storage'da barındırılır (PRD Bölüm 8).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
