/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},
    webpack: (config, { dev, isServer }) => {
        // Enable Webpack polling if standard filesystem events (inotify) aren't firing properly on Windows
        if (dev && !isServer) {
            config.watchOptions = {
                poll: 1000, // Check for changes every second
                aggregateTimeout: 300, // delay between detecting a change and rebuilding
            };
        }
        return config;
    },
};

export default nextConfig;
