            /** @type {import('next').NextConfig} */
            const nextConfig = {
              webpack(config, { isServer, dev }) {
                // Add rule for GLSL files
                config.module.rules.push({
                  test: /\.(glsl|vs|fs|vert|frag)$/,
                  exclude: /node_modules/,
                  use: ['raw-loader'],
                });

                // Important: return the modified config
                return config;
              },
            };

            export default nextConfig;
            