module.exports = {
  // Root config still required for Jest CLI
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src", "<rootDir>/../LivingDashboard/src"],
  moduleFileExtensions: ["js", "jsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "^.+\\.(css|scss)$": "identity-obj-proxy",
    "^react-plotly.js$": "<rootDir>/jest.plotly.stub.js",
    // Map LivingDashboard CSS imports for cross-package tests
    "^../../../LivingDashboard/src/components/.*\\.(css|scss)$":
      "identity-obj-proxy",
  },
  projects: [
    {
      displayName: "frontend",
      testEnvironment: "jsdom",
      testMatch: [
        "<rootDir>/src/**/__tests__/**/*.[jt]s?(x)",
        "<rootDir>/src/**/*.(spec|test).[jt]s?(x)",
      ],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      moduleNameMapper: {
        "^.+\\.(css|scss)$": "identity-obj-proxy",
        "^react-plotly.js$": "<rootDir>/jest.plotly.stub.js",
        "^./AudioHarmonics$": "<rootDir>/jest.audio.stub.js",
      },
    },
    {
      displayName: "backend",
      testEnvironment: "node",
      testMatch: [
        "<rootDir>/server/**/__tests__/**/*.[jt]s?(x)",
        "<rootDir>/server/**/*.(spec|test).[jt]s?(x)",
      ],
      setupFiles: ["<rootDir>/jest.backend.setup.js"],
      transformIgnorePatterns: [
        "/node_modules/(?!(@paralleldrive/cuid2|uuid)/)",
      ],
    },
  ],
  verbose: true,
};
