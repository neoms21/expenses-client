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
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
);
