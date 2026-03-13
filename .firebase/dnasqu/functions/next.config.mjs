// next.config.mjs
var nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true
  }
};
var next_config_default = nextConfig;
export {
  next_config_default as default
};
