# SmartPet Progressive Web App

SmartPet is currently published as a **browser-only demonstration PWA**. It does not need an API, database, account, MQTT broker, or tracker to open.

## What works in this demo

- Open the dashboard without signing in.
- Add and select pet profiles. These are saved in this browser's local storage.
- View clearly labeled illustrative telemetry and alert examples.
- Install the dashboard as a PWA where the browser supports installation.
- Open the app shell offline after it has loaded once.

## What is not connected

There is no user account, cross-device synchronization, live telemetry, GPS, secure tracker pairing, push alert service, or hardware command. Device buttons only explain that no command was sent. Do not use sample values for pet safety decisions. Browser data is not encrypted or backed up; avoid entering sensitive information.

## Publish with GitHub Pages

1. Upload the **contents** of this `smart_pet_web` folder to the root of a public GitHub repository. Keep `index.html`, `app.html`, `app.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`, and all icon files together.
2. In repository **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
3. Open the URL GitHub Pages displays. The dashboard is at `/app.html`.

The site is static and uses relative asset paths, so it works under a GitHub Pages project subpath.

## Run locally

From this folder, run:

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080/`. Service workers require HTTPS or localhost.

## Install

- Desktop/Android: use the browser's **Install app** option or menu.
- iPhone/iPad: open the site in Safari, tap **Share**, then **Add to Home Screen**.

Pet profile data is saved locally in the browser and is not synchronized. Clearing browser site data removes it.
