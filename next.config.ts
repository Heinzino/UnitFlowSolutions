import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    airtableData: {
      stale: 900,
      revalidate: 900,
      expire: 3600,
    },
  },
};

export default nextConfig;
