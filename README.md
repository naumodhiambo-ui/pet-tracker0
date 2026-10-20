# SmartPet Progressive Web App

The owner dashboard is an installable PWA served from `app.html`. The existing `index.html` landing page remains available. It uses the existing FastAPI API; it does not connect directly to MQTT.

## Run locally

From this directory, serve the static files on localhost (service workers require localhost or HTTPS):

```powershell
python -m http.server 8080
```

Open `http://localhost:8080/app.html`. Start the API in a second terminal:

```powershell
cd ../pet_tracker_backend
Copy-Item .env.example .env
docker compose up --build
```

This development compose stack starts PostgreSQL, EMQX, and the FastAPI service; the API container applies Alembic migrations before starting. Docker Desktop must be running. Wait for the API container to finish its startup, then confirm `http://localhost:8000/docs` opens. In the PWA sign-in screen, set Backend URL to `http://localhost:8000` if it differs from the default.

The `.env.example` values are for local development only. Do not deploy them or expose the development broker/database ports on a public network.

For a different web origin, configure the backend's `CORS_ALLOWED_ORIGINS` to include that exact origin, such as `http://localhost:8080`, then restart the API. For production, serve the PWA and API over HTTPS and set a specific allowed origin; do not use wildcard CORS.

## Use the app

1. Create an account or sign in using the backend API.
2. Add/select a pet profile.
3. Pair a tracker using its device code in development mode. Production pairing remains disabled until secure provisioning is implemented.
4. Refresh to load the latest backend telemetry and alerts. A command response only means the API accepted it for publishing; broker receipt and hardware execution are not confirmed.
5. On supported browsers, install from the browser's install option/menu. On iPhone/iPad, open the Share menu in Safari and choose **Add to Home Screen**.

The access token is kept in `sessionStorage` for the browser session. The service worker caches only the static app shell; API requests remain network-only and no sensitive API response is cached. Offline access can open the shell, but account data and API actions require connectivity.

## Checks

Serve the page on localhost and check:

- sign-up/sign-in and API errors;
- pet creation and selection;
- device pairing and command queue responses;
- telemetry and alert rendering;
- install prompt and offline shell reload.

No automated browser tests are included yet. Production still needs authenticated live telemetry and secure provisioning.
