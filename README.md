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

## GitHub Pages: build and deploy entirely in GitHub

Every push to `main` runs the complete pipeline in **Actions → Validate and deploy Character Studio**. Pull requests run the same validation without publishing. The pipeline installs locked dependencies on Node 22, checks formatting, runs storage/backup tests, builds for `/chance-studio/`, and exercises the production build in desktop and mobile Chromium. Only a passing build is uploaded and deployed. Browser test reports and traces are retained in the Actions run for seven days.

### First deployment

GitHub requires one-time Pages enablement; a workflow file alone does not enable the site. The default `GITHUB_TOKEN` cannot enable Pages for the first time.

In the repository's **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source, then open **Actions → Validate and deploy Character Studio → Run workflow** on `main`. Subsequent pushes publish automatically. No local build or separate hosting service is needed.

If you prefer to initialize Pages through the workflow, add an optional repository Actions secret named `PAGES_SETUP_TOKEN`: a fine-grained GitHub personal access token restricted to this repository with **Pages: Read and write**. For a GitHub App token, both **Administration: Read and write** and **Pages: Read and write** are required. Run the workflow once; it creates the Pages site with the workflow build source. Remove the setup secret after successful initialization. Normal deployments use GitHub's built-in token. Never put a token into source files, application settings, or an issue.

GitHub Free supports Pages for **public repositories**. A private repository requires a supported paid plan; this application does not require one. Repository visibility must be chosen by the owner; the workflow does not change it. Organization policies may also restrict Actions or Pages. The deployment job reports configuration and permission errors directly in the Actions log.

After the deployment succeeds, the live URL is printed in the deployment job and shown in the `github-pages` environment. The expected repository URL is `https://chanceoss.github.io/chance-studio/`. Do not treat that address as live until GitHub reports a successful deployment.

### Browser checks locally (optional)

```sh
npx playwright install chromium
npm run build -- --base=/chance-studio/
npm run test:e2e
```

The tests serve the production build under the same `/chance-studio/` prefix used by Pages. Application navigation uses in-app state, so no server route rewrites are needed. `npm run format` formats source and workflow files; `npm run format:check` validates formatting.

Do not commit private reference images or backups. User records are created only in the browser's IndexedDB and are never published with the application.
