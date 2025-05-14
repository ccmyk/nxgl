/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source',
    });

    config.module.rules.push({
      test: /\.pcss$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            url: true,
            importLoaders: 1,
          },
        },
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              config: './postcss.config.js',
            },
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;