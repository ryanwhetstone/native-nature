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
      {
        protocol: 'https',
        hostname: 'static.inaturalist.org',
        port: '',
        pathname: '/photos/**',
      },
      {
        protocol: 'https',
        hostname: 'native-nature.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/observations/**',
      },
      {
        protocol: 'https',
        hostname: 'native-nature.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/projects/**',
      },
      {
        protocol: 'https',
        hostname: 'native-nature.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/project-updates/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
