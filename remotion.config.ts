import { Config } from '@remotion/cli/config';
import { enableTailwind } from '@remotion/tailwind';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);

// Set entry point explicitly
Config.setEntryPoint('./src/index.ts');

// Configure webpack to resolve TypeScript extensions and provide Node polyfills
Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      fallback: {
        ...config.resolve?.fallback,
        path: require.resolve('path-browserify'),
        url: require.resolve('url/'),
        os: require.resolve('os-browserify/browser'),
        crypto: require.resolve('crypto-browserify'),
        fs: false,
        stream: false,
        buffer: false,
      },
    },
  };
});
