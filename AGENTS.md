# AGENTS.md

Repository guidance for contributors and coding agents working on the
How to Become a Star Writer Reader.

## Project summary

This repository contains a fan-made static reader for _How to Become a Star
Writer_ by SingNShong. It publishes one available edition as static chapter
pages and one generated EPUB.

The public site is `https://htbasw.pages.dev`. A Python build validates the
source chapters, generates the website and EPUB, and writes the deployment
artifact to `dist/`. Cloudflare Pages serves the static output and runs the
Functions in `functions/`.

The project has no server-rendered templates or runtime npm dependencies.
Reading progress, bookmarks, themes, fonts, backgrounds, and text size are
stored in the visitor's browser. Native chapter comments use Cloudflare D1 and
Discord OAuth through the Pages Functions.

## Source of truth and generated output

Edit source files only. Do not manually edit generated files in `dist/`.

| Path | Purpose |
| --- | --- |
| `chapters/first/` | Source XHTML chapters for the single edition. |
| `website/` | Base HTML, CSS, browser JavaScript, assets, headers, robots rules, and Giscus theme files. |
| `website/assets/unused/` | Local-only unused assets. The build excludes this directory. |
| `scripts/build.py` | Validates chapters and generates all website, metadata, and EPUB output. |
| `scripts/preview.py` | Runs the local static preview server on port 8766. |
| `scripts/export_cloudflare.py` | Creates the Cloudflare Pages Direct Upload ZIP. |
| `functions/_middleware.js` | Cloudflare security headers and request limiting. |
| `functions/schema.sql` | Cloudflare D1 schema for native comments and reactions. |
| `functions/api/` | Discord authentication and native comment API routes. |
| `functions/migrations/` | Incremental D1 migrations for comment features. |
| `functions/github-discussion-webhook.js` | Verifies GitHub Discussion webhooks and forwards comments to Discord. |
| `tests/test_build.py` | Regression tests for build propagation, metadata, navigation, and EPUB consistency. |
| `dist/` | Generated deployment output. Recreated by the build. |
| `.github/workflows/build.yml` | CI test and build workflow. |

If a generated page does not reflect an HTML change, inspect the replacement
logic in `scripts/build.py`. Chapter pages are generated from base documents
and selected sections are replaced during the build.

## Commands

Run from the repository root:

```sh
npm test
npm run build
npm run preview
```

Equivalent direct commands:

```sh
python3 -m unittest discover -s tests -v
python3 scripts/build.py
python3 scripts/preview.py
```

The local preview is available at:

```text
http://127.0.0.1:8766/
```

It mimics Cloudflare Pages static routing but does not execute
`functions/_middleware.js` or `functions/github-discussion-webhook.js`.

After code changes, run at minimum:

1. `npm test`
2. `npm run build`
3. `node --check` for changed JavaScript files.
4. `git diff --check` when Git metadata is available.

For formatting changes, preserve the repository's Prettier and Black output.

## Build pipeline

`scripts/build.py`:

1. Reads every `*.xhtml` file under `chapters/first/`.
2. Requires valid XHTML, a title, a body, supported tags, no unsupported
   chapter attributes, non-empty text, and contiguous chapter numbering.
3. Extracts each chapter title, HTML fragment, word count, and source SHA-256.
4. Copies `website/` to a temporary output directory, excluding
   `website/assets/unused/`.
5. Writes `data/first/<number>.json` and `data/catalog.json`.
6. Builds and verifies `Star_Writer_Story.epub`.
7. Replaces chapter-card placeholders in the homepage and chapter index.
8. Generates static chapter pages under
   `dist/first/chapter-N.html`.
9. Generates metadata, canonical URLs, sitemap, robots rules, and
   `build-manifest.json`.
10. Adds content hashes to applicable static asset URLs.
11. Replaces the previous `dist/` only after validation succeeds.

The build is source-driven: a chapter correction propagates to the chapter
JSON, prerendered page, generated chapter index, sitemap-related metadata, and
EPUB.

The production URL is controlled by `SITE_URL`:

```sh
SITE_URL=https://reader.example.com python3 scripts/build.py
```

## Chapter XHTML rules

Chapter files use XHTML with a small supported element set. Keep chapter files
limited to text and formatting elements already accepted by `read_chapters()`
in `scripts/build.py`.

When editing a chapter:

- Keep the four-digit filename unchanged.
- Keep the chapter title and visible heading consistent.
- Preserve paired formatting tags.
- Escape literal ampersands as `&amp;`.
- Do not add scripts, links, event handlers, or custom attributes.
- Do not add translator credits, external promotion, or unrelated metadata.
- Keep chapter numbering contiguous.

The build rejects malformed or unsupported chapter markup instead of silently
producing a partial site.

## HTML and page architecture

The primary base documents are:

- `website/index.html`: homepage and shared reader markup.
- `website/chapters.html`: chapter index and shared reader markup.
- `website/info.html`: project information, credits, and community links.

Important shared elements include:

- `#reader`: active chapter reader.
- `#chapter`: chapter content.
- `#edition-label`: current edition and chapter count.
- `#prev`, `#chapter-list`, and `#next`: reader navigation.
- `.reader-prev`, `.reader-chapter-list`, and `.reader-next`: top navigation
  controls.
- `#contents`: chapters and bookmarks dialog.
- `#comments`: Giscus discussion section.
- `#preferences`: reader settings dialog.

The generated chapter page contains navigation, metadata, chapter content,
bottom navigation, and comments. Shared markup changes may require edits to
both base HTML files and the replacement logic in `scripts/build.py`.

Do not introduce duplicate IDs when adding repeated controls. Use shared
classes and update every instance in `website/scripts/app.js`.

## Browser runtime

`website/scripts/app.js` is the main browser controller. It:

- Routes `/` to the homepage.
- Routes `/first` and `/chapters` to the chapter index.
- Routes `/first/chapter-N` to a chapter reader page.
- Loads `data/catalog.json` and chapter JSON.
- Uses prerendered chapter content when available.
- Stores state in localStorage under
  `star-writer-reference-reader`.
- Tracks reading progress and bookmarks.
- Applies theme, font, text-size, and background settings.
- Opens settings, background, chapters, bookmarks, support, and comments
  interfaces.
- Maintains reader navigation and first/last chapter states.

The only supported edition key is `first`. Do not reintroduce a second edition
route or state branch unless the source content and build pipeline are added at
the same time.

Do not create a second browser state store or route system without updating
the existing pathname, localStorage, and navigation behavior.

## CSS architecture

`website/styles/style.css` is the stylesheet entry point. Its import order is
intentional:

1. `base.css`
2. `home.css`
3. `dialogs.css`
4. `themes-responsive.css`
5. `chapters.css`
6. `home-overrides.css`
7. `navigation.css`
8. `wallpaper-background.css`
9. `info.css`
10. `settings.css`

Keep related rules in their existing stylesheet and preserve import order
unless there is a specific cascade reason to change it.

- `base.css`: variables, fonts, global typography, and shared primitives.
- `home.css`: reader layout, article typography, and home content.
- `chapters.css`: chapter index layout, toolbar, and cards.
- `dialogs.css`: generic dialog and fallback control styling.
- `settings.css`: settings, background, chapters, and bookmarks dialogs.
- `navigation.css`: header behavior, comments, and navigation layout.
- `wallpaper-background.css`: background customizer and wallpaper behavior.
- `info.css`: information page, profiles, and Discord server dialog.

The settings, background, chapters, and bookmarks dialogs share a common
surface and responsive mobile behavior. Avoid broad global overflow rules that
break chapter-index scrolling or mobile dialog scrolling.

When changing responsive styles, test:

- Desktop and mobile chapter index layout.
- Settings, background, chapters, and bookmarks dialogs.
- Chapter navigation at the first and final chapters.

## Fonts and assets

Fonts are bundled under `website/assets/fonts/` and registered with
`@font-face` in `website/styles/base.css`. The default reader font is
Bookerly. Other configured font choices include Libre Baskerville, Literata,
OpenDyslexic, Roboto, Georgia, Palatino, Times New Roman, sans-serif, Arial,
Verdana, and monospace.

Use:

- `website/assets/images/` for general reader artwork.
- `website/assets/profiles/` for profile artwork.
- `website/assets/servers/` for community server artwork.
- `website/assets/unused/` for assets intentionally excluded from deployment.

Do not reference files from `website/assets/unused/`; the build deliberately
omits that directory from `dist/`.

## Giscus comments

Giscus configuration lives in `website/scripts/config.js`. This project has
one category for one edition:

```js
giscus: {
  repo: "Meaow-Technologies/HTBASW-Reader",
  repoId: "R_...",
  categories: {
    first: {
      name: "Chapter Discussion",
      id: "DIC_...",
    },
  },
}
```

`website/scripts/comments.js` mounts the native D1-backed discussion UI after a
chapter is loaded and keeps legacy Giscus discussions available in a collapsed
section. Native comments support Discord sign-in, replies, reactions, voting,
editing, deletion, moderation, and chapter-level reactions. Giscus uses stable
keys such as `htbasw-first-chapter-12`, stores a return path for authentication,
applies the configured local theme, and uses the theme files under
`website/giscus/`.

The custom theme files are:

- `website/giscus/dark.css`
- `website/giscus/light.css`
- `website/giscus/admin.css`

The theme files load in a cross-origin iframe. The `/giscus/*` rules in
`website/_headers` and `functions/_middleware.js` must continue to allow the
theme resources to load. If the theme version changes, update the cache-busting
version in `comments.js` and the matching theme imports.

The browser cannot reliably read comment bodies from the cross-origin Giscus
iframe. Discord notifications are handled by the server-side GitHub webhook,
not by scraping iframe messages in browser code.

## Discord comment webhook

`functions/github-discussion-webhook.js`:

- Verifies `X-Hub-Signature-256` using Web Crypto HMAC-SHA256.
- Accepts only created comments from
  `Meaow-Technologies/HTBASW-Reader`.
- Posts a Discord embed with the commenter, discussion title, discussion URL,
  comment body, and timestamp.
- Returns explicit errors for missing configuration, invalid signatures,
  invalid JSON, unsupported methods, and Discord delivery failures.

Required Cloudflare Pages secrets:

```text
GITHUB_WEBHOOK_SECRET
DISCORD_GISCUS_WEBHOOK_URL
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
SESSION_SECRET
```

Bind a Cloudflare D1 database to the Pages Functions as `COMMENTS_DB` and
initialize it with `functions/schema.sql`, followed by the migrations in
`functions/migrations/`.

Use a new random project-specific secret. Set the exact same value in the
GitHub repository webhook and Cloudflare Pages. Never commit secrets or place
them in `website/scripts/config.js`.

The GitHub webhook should target:

```text
https://htbasw.pages.dev/github-discussion-webhook
```

Use `application/json`, enable SSL verification, and enable the **Discussion**
event. The local Python preview does not execute Pages Functions.

## Cloudflare middleware and headers

`functions/_middleware.js`:

- Adds security headers.
- Adds no-index controls to chapter JSON and EPUB paths.
- Applies per-client request limits.
- Uses Cloudflare rate-limit bindings when available.
- Falls back to an in-memory per-isolate limiter when bindings are absent.
- Allows cross-origin loading for `/giscus/*`.

Recommended optional Cloudflare bindings include:

- `RATE_LIMITER` for general requests.
- `CONTENT_RATE_LIMITER` for stricter chapter JSON and EPUB limits.

`website/_headers` also provides static security and caching rules. The build
rewrites `robots.txt`; update the corresponding generation code in
`scripts/build.py` if those rules need to change.

The static site remains publicly readable. Robots rules and browser JavaScript
are not access control.

## Deployment

For Cloudflare Pages Git integration:

```text
Root directory: repository root
Build command: python3 scripts/build.py
Build output directory: dist
```

The root `functions/` directory must be included for Pages Functions to
deploy. Direct static ZIP uploads do not provide Functions.

Useful deployed checks:

```sh
curl -I https://htbasw.pages.dev/data/catalog.json
curl -i -X POST https://htbasw.pages.dev/github-discussion-webhook
```

Expected webhook results:

- `405`: wrong HTTP method.
- `401`: invalid GitHub signature.
- `503`: missing Cloudflare secrets.
- `200`: valid GitHub delivery accepted.
- `404`: the Function was not deployed or the route is wrong.

The local preview cannot validate deployed middleware, native comment APIs,
Discord OAuth, D1 bindings, or webhook behavior.

## Safe change practices

- Read the relevant source and generator code before editing.
- Preserve route behavior and stylesheet import order.
- Update both base HTML documents when shared markup changes.
- Update `scripts/build.py` when generated output must change.
- Never hand-edit `dist/`.
- Keep secrets out of frontend files and Git.
- Keep changes surgical and focused.
- Do not revert unrelated worktree changes.
- Run the smallest relevant tests, then the full build tests when generator or
  shared UI code changes.

## Common pitfalls

1. **Editing only generated HTML:** the next build overwrites it. Edit
   `website/` or `scripts/build.py`.
2. **Decimal chapter titles:** title cleanup must support values such as
   `Chapter 22.5`, not only integer chapter numbers.
3. **Testing Functions locally:** `scripts/preview.py` serves static files only.
4. **Stale Giscus CSS:** bump the theme cache version when deployed theme files
   change.
5. **Dialog scroll regressions:** avoid unscoped `overflow: hidden`.
6. **Missing assets in the build:** files under `website/assets/unused/` are
   intentionally excluded.
7. **Static security expectations:** robots rules and client-side checks do not
   prevent determined scraping.

## Validation baseline

The regression suite validates:

- Chapter correction propagation to website and EPUB.
- EPUB structure and source consistency.
- Invalid-source safety.
- Missing chapters and whitespace handling.
- Generated discovery metadata.
- Canonical URLs and navigation links.
- Robots rules and asset hashing.
- Giscus headers and theme-version consistency.
