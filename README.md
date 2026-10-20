# SmartPet Progressive Web App

SmartPet is a browser-only demonstration PWA. It opens without an API, database, account, MQTT broker, or tracker.

## Demo features

- Browse an illustrated landing page with interactive sample pet cards and feature tabs.
- Open the dashboard without signing in; add and select pet profiles saved in the current browser.
- View clearly labeled illustrative telemetry and alert examples.
- Install the dashboard as a PWA where supported, and open its cached shell offline after one visit.

## Demo limits

There is no account, cross-device sync, live telemetry, GPS, secure tracker pairing, push alert service, or hardware command. Demo readings are examples only. Device action buttons do not send commands. Browser data is not encrypted or backed up; do not enter sensitive information or rely on the demo for pet safety decisions.

## Publish with GitHub Pages

Upload the **contents** of this folder to the repository root. Keep these files together: `index.html`, `app.html`, `app.css`, `app.js`, `site.css`, `site.js`, `animal-scene.svg`, `paw-pattern.svg`, `manifest.webmanifest`, `service-worker.js`, and the four icon files. Commit to `main`; GitHub Pages deploys from the branch root. The landing page is `/` and the dashboard is `/app.html`.

The site uses relative asset paths, so it works under a GitHub Pages project subpath.

## Run locally

From this folder, run:

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080/`. Service workers require HTTPS or localhost.

## Install

- Desktop/Android: use the browser's **Install app** option or menu.
- iPhone/iPad: open in Safari, tap **Share**, then **Add to Home Screen**.

Pet profile data stays in the browser and is not synchronized. Clearing browser site data removes it.
