# IndusCart: Start Here (Windows)

Use the buttons/scripts below—no terminal commands are needed for normal local use.

## Before first launch

1. Make sure **Node.js LTS** and **MongoDB** are installed. MongoDB must be running on this computer, unless `backend/.env` has already been configured to point to a remote MongoDB service.
2. Open the IndusCart project folder (the folder containing `START-ADMIN.cmd` and `START-SHOPPER.cmd`).
3. Double-click one of the launchers:
   - **`START-SHOPPER.cmd`** opens the customer storefront at `http://localhost:3000/`.
   - **`START-ADMIN.cmd`** opens the admin-only portal at `http://localhost:3001/admin/login`.

Each launcher runs the matching Vite portal on its own port and reuses/starts the shared backend API on port `5000`. Run both launchers if you need both portals at once; they use the same API and database, not separate databases. Keep each opened terminal window running. On first launch, dependencies install automatically; this may take a few minutes. If the backend `.env` is missing, the launcher copies the included example for local use.

The shopper portal exposes shopper routes on port `3000`; the admin portal exposes only admin routes, support, and admin invoices on port `3001`. The admin port is a separate frontend process, not a separate backend/API deployment. Authentication endpoints and protected APIs enforce account roles independently of the port.

## Signing in

- Shoppers use `/login` or choose **Login** in the website navigation.
- Administrators use `/admin/login` on port `3001` or select the shield icon on the shopper portal. The admin portal header has a shopper-storefront icon; neither icon is inside a login form.
- Shopper login (`POST /api/auth/login`) refuses administrator accounts. Admin login (`POST /api/auth/admin/login`) refuses non-admin accounts and has a stricter failed-attempt limit. Admin pages and APIs still enforce the administrator role independently of the login screen.
- No default admin password is included in the project. For a new database, the store owner must arrange creation of the first admin account securely; never add a shared password to source code or documentation.

## Stop the application

Close each service window opened by the launcher, or press `Ctrl+C` in each window. If both portals are running, they use separate Vite windows and a shared API window.

## If startup does not finish

- **The website window is still installing packages:** let it finish, then wait for the browser page to load.
- **MongoDB connection failed:** start the MongoDB Windows service (or have your system administrator check the configured MongoDB connection), then click the same launcher again.
- **Node.js/npm missing:** install Node.js LTS, reopen the project folder, and double-click the launcher again.
- **Port already in use:** the launchers use `3000` (shopper), `3001` (admin), and `5000` (API). Make sure an existing frontend on the selected portal port was started in the matching mode; otherwise stop it before relaunching. An existing API on `5000` may be reused.
- **Need phone access:** see [`LOCAL_RUN_GUIDE.md`](./LOCAL_RUN_GUIDE.md); phone testing needs a LAN API URL and Windows Firewall access.

For environment, database, admin account, and troubleshooting details, see the main [Local Run Guide](./LOCAL_RUN_GUIDE.md) and [README](../README.md).
