module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/server", "<rootDir>/src", "<rootDir>/LivingDashboard/src"],
  transform: {
    "^.+\\.jsx?$": ["babel-jest", { configFile: "./babel.config.js" }],
  },
  moduleFileExtensions: ["js", "jsx", "json", "node"],
  verbose: true,
};
