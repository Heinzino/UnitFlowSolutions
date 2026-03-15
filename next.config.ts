import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheLife: {
    airtableData: {
      stale: 60,
      revalidate: 60,
      expire: 300,
    },
  },
};

export default nextConfig;
