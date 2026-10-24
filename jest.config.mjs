import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
};

// jose is ESM-only: transform it (also under pnpm's .pnpm store) instead of ignoring node_modules.
const buildConfig = async () => {
  const resolved = await createJestConfig(config)();
  return {
    ...resolved,
    transformIgnorePatterns: [
      "/node_modules/(?!(\\.pnpm|jose)/)",
      "/node_modules/\\.pnpm/(?!jose@)",
      "^.+\\.module\\.(css|sass|scss)$",
    ],
  };
};

export default buildConfig;
