# Council Admin UI

## Dev
```powershell
cd C:\Temple\council-dashboard\admin-ui
npm install
npm run dev
```
Open http://localhost:5174

## Backend
Ensure the Council API is running on port 4321 and `.env` is configured:
```
COUNCIL_ADMIN_USER=admin
COUNCIL_ADMIN_PASS=password
COUNCIL_JWT_SECRET=supersecret
```

Login at /login, then access /admin and /audit.
