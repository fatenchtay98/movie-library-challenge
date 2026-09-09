import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Without `test.globals: true` in vite.config.ts, RTL's automatic
// afterEach(cleanup) never registers (it detects the test framework via
// globals on `globalThis`), so the DOM would otherwise accumulate across
// tests within a file.
afterEach(() => {
  cleanup();
});
