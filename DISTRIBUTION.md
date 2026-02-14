# Distributing Step Bro as a desktop app

This guide explains how to build installable Mac and Windows apps and host them on your website for download.

## Build output

All built installers and archives go into the **`release/`** folder (already in `.gitignore`). After building, upload the files you want from `release/` to your site.

---

## SnapBot (Groq API key) – one key for all users

The app can use a **single Groq API key** that you embed at build time. Everyone who downloads the built app will use that key; they don’t need to add their own.

1. **Get a key** at [console.groq.com/keys](https://console.groq.com/keys).
2. **Put it in `.env`** in the project root (same folder as `package.json`):
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
3. **Build as usual** (`npm run build:mac`, `npm run build:win:x64`, or `npm run build:all`). The build reads `.env` and bakes the key into the app, so the installers you upload will have SnapBot working for all users.

**Important:** Keep `.env` out of version control (it’s in `.gitignore`). The key is embedded in the built app, so all users share your Groq quota and rate limits. If the key is ever leaked or revoked, create a new key, put it in `.env`, and rebuild/re-release.

---

## Building on macOS

From the project root:

```bash
npm install
npm run build:mac
```

This produces in `release/`:

| File | Use |
|------|-----|
| **Step Bro-1.0.0-mac-arm64.dmg** | Apple Silicon (M1/M2/M3) – drag to Applications |
| **Step Bro-1.0.0-mac-arm64.zip** | Same, zip for direct download |
| **Step Bro-1.0.0-mac-x64.dmg** | Intel Mac |
| **Step Bro-1.0.0-mac-x64.zip** | Same, zip |

- **DMG** = disk image, standard Mac installer experience.  
- **ZIP** = unzip and move “Step Bro.app” to Applications; good for users who prefer no installer.

Unsigned builds may show a one-time security warning on first open; users can use **Right‑click → Open** or **System Settings → Privacy & Security → Open anyway**.

---

## Building on Windows

From the project root (in PowerShell or Command Prompt):

```bash
npm install
npm run build:win
```

This produces in `release/`:

| File | Use |
|------|-----|
| **Step Bro-Setup-1.0.0-x64.exe** | Installer – run and follow setup |
| **Step Bro-1.0.0-portable-x64.exe** | Portable – run without installing |

You get two `.exe` files; one is the installer and one is the portable build (names may include “Setup” or “portable” depending on electron-builder). Upload both if you want to offer installer + portable.

---

## Building both platforms

- **On a Mac:** you can only build the Mac version with `npm run build:mac`. To get Windows installers, use a Windows machine or CI (e.g. GitHub Actions) and run `npm run build:win` there.
- **On Windows:** you can only build the Windows version with `npm run build:win`. To get Mac DMGs/zips, use a Mac or CI and run `npm run build:mac` there.

To build “all” on the current OS only:

```bash
npm run build:all
```

(This runs `build:mac` then `build:win`; the non‑native one may fail if the OS doesn’t support it.)

---

## Putting builds on your website

1. **Bump the version** (optional but recommended) in `package.json` before each release so filenames and user expectations match (e.g. `1.0.1`).
2. **Build** on Mac and/or Windows as above.
3. **Copy** the desired files from `release/` to your server (e.g. `/downloads/` or your CDN).
4. **Link** them on your site, for example:

   - **Mac (Apple Silicon):** `Step Bro-1.0.0-mac-arm64.dmg`  
   - **Mac (Intel):** `Step Bro-1.0.0-mac-x64.dmg`  
   - **Windows:** your main `.exe` (installer and/or portable)

5. You can add a simple download page that detects OS and suggests the right file, or list all options and let users choose.

---

## Optional: code signing (fewer security warnings)

- **Mac:** use `npm run build:mac:signed` and set up an Apple Developer certificate so the app is notarized and opens without warnings.
- **Windows:** use `npm run build:signed` (or `build:win` with signing env vars) and a Windows code‑signing certificate so SmartScreen doesn’t warn.

Signing requires developer accounts and certificates; the unsigned builds above are fine for hosting and testing.

---

## Summary

| Goal | Command | Where output goes |
|------|---------|-------------------|
| Mac installers (DMG + zip) | `npm run build:mac` | `release/` |
| Windows installer + portable | `npm run build:win` | `release/` |
| Host for download | Upload chosen files from `release/` to your site | Your server / CDN |

After that, add download links on your website to the files you uploaded.
