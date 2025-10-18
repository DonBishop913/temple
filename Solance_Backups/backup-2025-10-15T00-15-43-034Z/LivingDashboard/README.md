# Living Dashboard Turnkey Package

This bundle provides a Vite-powered React app with Tailwind CSS and an Express API placeholder to visualize Council metrics and alerts.

## Prerequisites

- Node.js 18+

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Start dev servers (Vite + Express):

   ```
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - API: http://localhost:3000

3. Build for production:

   ```
   npm run build
   npm run preview
   ```

## Notes

- Tailwind CSS is configured via `tailwind.config.js` and `postcss.config.js`, with styles in `src/index.css`.
- The dashboard consumes example endpoints from `server/server.js`.
- Adjust colors in `tailwind.config.js` as desired.
