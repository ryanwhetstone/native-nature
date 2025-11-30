import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'inaturalist-open-data.s3.amazonaws.com',
        port: '',
        pathname: '/photos/**',
      },
    ],
  },
};

export default nextConfig;
