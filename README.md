# Martigo: Groceries in Minutes


This project was built with [Lovable](https://lovable.dev).

**Live app**: https://alinamart.store

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2f02eeac-9288-47cb-b9e7-737533d5b908).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Android permissions (Windows PowerShell)

After creating the Android project, run before building the APK:

```powershell
npx cap sync android
powershell -ExecutionPolicy Bypass -File .\scripts\android-permissions.ps1
npx cap open android
```

The script adds foreground location, microphone, camera, network and vibration permissions without replacing the existing manifest. No background location, contacts, SMS or broad storage access is requested. Photo/KYC selection uses the system picker. In-app notifications do not need Android notification permission.

Android normally asks for location when the delivery map opens, microphone when voice search starts, and camera when delivery capture needs it—not all permissions at installation. Already granted or permanently denied permissions may not show another prompt; users change them in Android app settings. Internet access has no Allow/Deny prompt.

This repository does not contain the generated Android project or an APK. Actual manifest merging, plugin compatibility, Allow/Deny dialogs, hardware Back and reconnect after losing connectivity on an already-open live page require a fresh APK/device test. The bundled offline splash covers startup; it cannot guarantee recovery from every remote WebView navigation failure.
