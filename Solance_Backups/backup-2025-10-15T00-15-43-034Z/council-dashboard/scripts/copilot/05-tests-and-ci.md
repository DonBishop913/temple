# Copilot CLI Prompt: Tests and CI Setup

Goal: Add Jest + RTL test scaffolds and GitHub Actions CI.

Prompt:

- Update `package.json` with `test` scripts and devDeps: `jest`, `babel-jest`, `@testing-library/react`, `@testing-library/jest-dom`, `jest-environment-jsdom`, `@babel/preset-env`, `@babel/preset-react`.
- Add `jest.config.js`, `jest.setup.js` (polyfill EventSource/WebSocket), and `.babelrc`.
- Create tests:
  - `src/components/__tests__/YeshuasClock.test.jsx` (toggle/slider).
  - `src/components/__tests__/YeshuasClock.integration.test.jsx` (overlay presence).
- Provide `.github/workflows/ci.yml` that runs install, build, and tests on push to main.
