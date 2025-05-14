import { defineConfig } from 'next';

export default defineConfig({
  experimental: {
    turbo: {
      loaders: {
        '.glsl': ['raw-loader'],
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source',
    });

    return config;
  },
});