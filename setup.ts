import { cleanup } from '@testing-library/vue';
import { afterEach } from 'vitest';
// expect.extend(matchers);

// Optional: cleans up `render` after each test
afterEach(() => {
  cleanup();
});
