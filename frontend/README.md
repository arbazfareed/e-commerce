# IndusCart frontend

This is the Vite + React client for IndusCart.

## Commands

```powershell
npm ci
npm start       # http://localhost:3000
npm run build   # production build in dist/
npm run preview # preview the production build
```

The client expects the backend API at `http://localhost:5000` by default. To
use a backend running on another machine, create `.env` before `npm start` or
`npm run build`:

```env
VITE_API_URL=http://YOUR_COMPUTER_IP:5000
```

This value also controls product image URLs. Uploaded files live in the
backend's `uploads/` directory, so that directory must be retained with the
backend between restarts/deployments.
