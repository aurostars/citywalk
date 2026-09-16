# Citywalk Static Image Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unauthenticated runtime image-generation requests with nine distinct, optimized static images that reliably render on GitHub Pages.

**Architecture:** Store final WebP assets below `public/images`, expose their source metadata in a small manifest, and build all public paths through one Vite-base-aware helper. Keep `ImageWithFallback` responsible only for browser load failures; add resource tests for file existence, dimensions, byte size, uniqueness, and exclusion of the known generation placeholder.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest 5, Playwright, Sharp.

## Global Constraints

- Preserve the existing city-magazine layout, copy, recommendation behavior, and 8px image framing.
- Add one 4:3 hero image and eight distinct 4:3 activity images.
- Runtime image requests must be same-origin static files; no image-generation credentials or endpoint calls may remain.
- Each WebP must be 1600x1200, no larger than 450 KB, and must not match the known placeholder SHA-256 `e330cd023298a812503e10a067a3f88e1cbc094f37f6fd2a88fdb6799495b37e`.
- Record the original source URL and creator/license information in `public/images/SOURCES.md`.

---

### Task 1: Static asset pack and resource contract

**Files:**
- Create: `public/images/hero/beijing-weekend.webp`
- Create: `public/images/activities/798-art-weekend.webp`
- Create: `public/images/activities/gulou-weekend-market.webp`
- Create: `public/images/activities/liangma-river-live.webp`
- Create: `public/images/activities/ncpa-weekend-concert.webp`
- Create: `public/images/activities/panjiayuan-vintage-market.webp`
- Create: `public/images/activities/shougang-industrial-exhibition.webp`
- Create: `public/images/activities/xiangshan-morning-hike.webp`
- Create: `public/images/activities/wenyu-river-cycling.webp`
- Create: `public/images/SOURCES.md`
- Create: `src/data/imageAssets.test.ts`

**Interfaces:**
- Consumes: Activity IDs from `src/data/activities.ts`.
- Produces: Nine stable paths below `/images`, each decoding as 1600x1200 WebP.

- [ ] **Step 1: Write the failing asset contract test**

Create `src/data/imageAssets.test.ts` using `node:fs`, `node:path`, `node:crypto`, and `sharp`. Define the nine expected relative paths and assert for each file:

```ts
expect(existsSync(filePath)).toBe(true);
expect(metadata.format).toBe("webp");
expect(metadata.width).toBe(1600);
expect(metadata.height).toBe(1200);
expect(statSync(filePath).size).toBeLessThanOrEqual(450_000);
expect(hash).not.toBe(GENERATING_PLACEHOLDER_SHA256);
```

Also assert `new Set(hashes).size === expectedAssets.length`.

- [ ] **Step 2: Run the contract test to verify it fails**

Run: `npm run test:run -- src/data/imageAssets.test.ts`

Expected: FAIL because `public/images` assets do not exist.

- [ ] **Step 3: Acquire and normalize the images**

Select a relevant reusable source image for each scene, record its original URL and license/creator in `public/images/SOURCES.md`, then normalize every source with Sharp:

```js
await sharp(input)
  .rotate()
  .resize(1600, 1200, { fit: "cover", position: "attention" })
  .webp({ quality: 82, effort: 6 })
  .toFile(output);
```

Visually inspect all nine outputs and replace any source with a weak crop, watermark, generated-message text, or unrelated subject.

- [ ] **Step 4: Run the asset contract test**

Run: `npm run test:run -- src/data/imageAssets.test.ts`

Expected: PASS with nine unique valid WebP files.

- [ ] **Step 5: Commit the asset pack**

```bash
git add public/images src/data/imageAssets.test.ts
git commit -m "feat: add static Beijing image assets"
```

### Task 2: Base-aware static image paths

**Files:**
- Create: `src/lib/assetPath.ts`
- Create: `src/lib/assetPath.test.ts`
- Modify: `src/data/activities.ts`
- Modify: `src/features/home/HomePage.tsx`
- Modify: `src/features/recommendations/recommend.test.ts`
- Modify: `src/features/guides/GuidesPage.test.tsx`

**Interfaces:**
- Produces: `assetPath(path: string): string`.
- Consumers: Activity fixture data and the home hero.

- [ ] **Step 1: Write the failing path tests**

Create `src/lib/assetPath.test.ts`:

```ts
expect(assetPath("images/hero/beijing-weekend.webp")).toBe(
  "/citywalk/images/hero/beijing-weekend.webp",
);
expect(assetPath("/images/activities/798-art-weekend.webp")).toBe(
  "/citywalk/images/activities/798-art-weekend.webp",
);
```

Update fixture tests to expect same-origin `.webp` paths and to reject `text_to_image`.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm run test:run -- src/lib/assetPath.test.ts src/features/recommendations/recommend.test.ts src/features/guides/GuidesPage.test.tsx`

Expected: FAIL because `assetPath` is missing and fixtures still use the generation endpoint.

- [ ] **Step 3: Implement the helper and migrate image references**

Implement:

```ts
export function assetPath(path: string) {
  const relativePath = path.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${relativePath}`;
}
```

Use it for the hero and all eight `Activity.imageUrl` values.

- [ ] **Step 4: Run focused tests**

Run: `npm run test:run -- src/lib/assetPath.test.ts src/features/recommendations/recommend.test.ts src/features/guides/GuidesPage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the runtime migration**

```bash
git add src/lib src/data/activities.ts src/features/home/HomePage.tsx src/features/recommendations/recommend.test.ts src/features/guides/GuidesPage.test.tsx
git commit -m "fix: serve city images from static assets"
```

### Task 3: Browser acceptance and release verification

**Files:**
- Modify: `e2e/citywalk.spec.ts`

**Interfaces:**
- Consumes: Same-origin `/citywalk/images/**/*.webp` requests.
- Produces: Browser proof that every rendered image decodes and preserves its frame.

- [ ] **Step 1: Replace the mocked endpoint test**

Change the image E2E case to block `**/api/ide/v1/text_to_image**`, generate a weekend plan, and assert:

```ts
expect(generationRequests).toHaveLength(0);
await expect(image).toHaveAttribute("src", /\/citywalk\/images\/.+\.webp$/);
expect(await image.evaluate((node) => node.naturalWidth)).toBeGreaterThan(0);
expect(await image.evaluate((node) => node.naturalHeight)).toBeGreaterThan(0);
```

Keep the before/after frame-size assertion to protect layout stability.

- [ ] **Step 2: Run the focused browser test**

Run: `npm run test:e2e -- --grep "static images"`

Expected: PASS and no generation endpoint requests.

- [ ] **Step 3: Run the complete verification suite**

Run:

```bash
npm run test:run
npm run build
npm run test:e2e
```

Expected: 100% passing tests and a successful production build containing `dist/images`.

- [ ] **Step 4: Inspect desktop and mobile screenshots**

Use Playwright at 1440x900 and 390x844. Confirm all key subjects remain visible, no image is blank, and no text overlaps or horizontal overflow appears.

- [ ] **Step 5: Commit the browser acceptance change**

```bash
git add e2e/citywalk.spec.ts
git commit -m "test: verify static city images"
```
