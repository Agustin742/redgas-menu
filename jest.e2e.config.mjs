import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

// Needs a running server (pnpm start) and a database.
// Run via `pnpm test:e2e`: Prisma 7 loads its query compiler with a dynamic
// ESM import, which Jest only supports under --experimental-vm-modules.
export default createJestConfig({
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/e2e/**/*.e2e.test.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testTimeout: 60_000,
});
