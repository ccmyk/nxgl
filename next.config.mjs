/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.pcss$/,
      use: [
        "style-loader",
        {
          loader: "css-loader",
          options: {
            url: true, // Ensure URLs are resolved correctly
          },
        },
        {
          loader: "postcss-loader",
          options: {
            postcssOptions: {
              config: "./postcss.config.js",
            },
          },
        },
      ],
    });
    return config;
  },
};

export default nextConfig;
