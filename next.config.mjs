import { withVelite } from 'velite/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      enabled: true,
    },
  },
  /* config options here */
};

export default withVelite(nextConfig);