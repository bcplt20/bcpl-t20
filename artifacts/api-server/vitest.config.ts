import { defineConfig } from "vitest/config";

// Dev workspace runs the API server, website and Expo alongside the tests,
// so the 5s/10s defaults produce false timeout failures under load.
export default defineConfig({
  test: {
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
