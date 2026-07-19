const nextJest = require("next/jest");

// next/jest handles the SWC transform, CSS/asset mocking, and env loading
// that Next.js apps need — same tooling Next.js itself builds with, rather
// than hand-rolling a separate ts-jest/babel config that could drift from it.
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/src/**/*.spec.[jt]s?(x)"],
};

module.exports = createJestConfig(customJestConfig);
