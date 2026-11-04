# Character Studio

A private, browser-only character photography workspace built with React, Vite, TypeScript, Tailwind CSS, and IndexedDB. No backend, API keys, subscriptions, analytics, external image services, or cloud database.

## Development

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Workflow

1. Create a character, including physical identity and personality notes.
2. Open the character card to upload face and body references (PNG, JPEG, WebP, GIF; up to 8 MB per image).
3. Choose a character in Prompt builder, customize direction, and optionally edit the template.
4. Copy the prompt, paste it into ChatGPT manually, and attach the reference files. ChatGPT Plus is a separate product; this website cannot invoke it, access your account, or automate generation.
5. Download generated images from ChatGPT, then import them into Image gallery with the prompt used.
6. Create cinematic shot sequences, plan dated content ideas, and maintain reusable presets.

JSON export includes characters, embedded images, prompt history, calendar entries, and presets. Import validates the structure and requires confirmation before replacing existing data. Export the current studio first to retain both backups. The gallery also supports downloading individual images.

All records stay in IndexedDB for this browser and origin. Clearing browser data, switching devices, changing the deployed hostname, or using a private browsing session can remove or isolate the studio. Export regular backups. Browser storage limits vary; save failures are reported, and failed saves do not replace the active studio. Large images increase backup sizes. This MVP has no account sync, video rendering, or automatic posting.

## GitHub Pages

Push this repository to `main`. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**. The included `deploy.yml` workflow installs locked dependencies, runs tests, builds, and publishes `dist`. You can also run the workflow manually. Relative Vite assets support both repository Pages and custom domains; navigation uses in-app state so there are no server-side routes to rewrite.

The workflow requires Pages to be enabled and repository Actions to be allowed. GitHub Free supports Pages for public repositories. If this repository is private, make it public to host it on GitHub Free. Do not commit private reference images or backups; application data is created only in the user's browser.
