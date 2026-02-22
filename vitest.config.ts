import { fileURLToPath } from 'node:url';

import { mergeConfig, defineConfig, configDefaults } from 'vitest/config';
import viteConfig from './vite.config';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [viteTsconfigPaths()],
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**', 'src/components/temp.test.ts'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        all: true,
        include: ['src/**/*.{ts,vue}'],
      },
    },
    // resolve: {
    //   alias: {
    //     '@': path.resolve(__dirname, './src'),
    //   },
    // },
  }),
);
