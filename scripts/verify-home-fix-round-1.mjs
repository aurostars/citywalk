import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { createServer } from "vite";

// Hold generated-image requests locally; abort selected requests to test errors.
// No provider traffic or substitute images are needed for these geometry checks.
const server = await createServer({
  server: { host: "127.0.0.1", port: 0 },
});
const failures = [];
let browser;

async function check(name, run) {
  try {
    console.log(`PASS ${name} ${JSON.stringify(await run())}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function openPage(viewport, reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport, reducedMotion });
  const requests = [];
  await context.route("https://copilot-cn.bytedance.net/**", (route) => {
    requests.push(route);
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/citywalk/`,
    { waitUntil: "domcontentloaded", timeout: 30000 },
  );
  await expect(page.getByRole("button", { name: "生成周末计划" })).toBeVisible();
  return { context, page, requests };
}

async function selectPreferences(page, activity = "逛市集", budget = "100 元内") {
  await page.getByRole("checkbox", { name: activity }).check();
  await page.getByRole("radio", { name: budget, exact: true }).check();
}

async function generate(page) {
  await page.getByRole("button", { name: "生成周末计划" }).click();
  await expect(page.locator(".results-stage")).toBeVisible();
  await expect(page.locator(".onboarding-stage")).toHaveCount(0);
}

async function failImage(image, requests) {
  await image.scrollIntoViewIfNeeded();
  const src = await image.getAttribute("src");
  await expect.poll(() => requests.some((route) => route.request().url() === src)).toBe(true);
  await requests.find((route) => route.request().url() === src).abort();
}

function bounds(element) {
  const { x, y, width, height, right, bottom } = element.getBoundingClientRect();
  return { x, y, width, height, right, bottom };
}

try {
  await server.listen();
  browser = await chromium.launch();

  await check("I1 alternative image frame and content", async () => {
    const { context, page, requests } = await openPage({ width: 768, height: 1024 });
    try {
      await selectPreferences(page);
      await generate(page);
      const card = page.locator(".activity-card").first();
      const image = card.locator("img");
      await image.scrollIntoViewIfNeeded();
      const before = await image.evaluate(bounds);
      await failImage(image, requests);
      const fallback = card.locator(".image-fallback");
      await expect(fallback).toBeVisible();
      const after = await fallback.evaluate(bounds);
      assert.ok(Math.abs(before.height - after.height) < 1,
        `media height ${before.height} -> ${after.height}`);
      assert.ok(Math.abs(before.width - after.width) < 1);
      const cardBox = await card.evaluate(bounds);
      for (const selector of ["h3", ".activity-facts", "a"]) {
        const box = await card.locator(selector).evaluate(bounds);
        assert.ok(box.y >= cardBox.y && box.bottom <= cardBox.bottom,
          `${selector} outside card: ${JSON.stringify({ box, cardBox })}`);
      }
      return { beforeHeight: before.height, afterHeight: after.height, contentContained: true };
    } finally {
      await context.close();
    }
  });

  await check("I2 failed lead recovers on rerank", async () => {
    const { context, page, requests } = await openPage({ width: 768, height: 1024 });
    try {
      await selectPreferences(page);
      await generate(page);
      const lead = page.getByLabel("首选活动");
      await failImage(lead.locator("img"), requests);
      await expect(lead.locator(".image-fallback")).toBeVisible();
      await page.getByRole("radio", { name: "一个人" }).check();
      await expect(lead.getByRole("heading")).toHaveText("潘家园旧物早市");
      await expect(lead.locator("img")).toHaveCount(1);
      return { recovered: await lead.locator("img").getAttribute("alt") };
    } finally {
      await context.close();
    }
  });

  await check("I3 tablet and breakpoint overflow", async () => {
    const { context, page } = await openPage({ width: 768, height: 1024 });
    try {
      await selectPreferences(page);
      await generate(page);
      const measurements = [];
      for (const width of [767, 768, 769, 1022, 1023, 1024]) {
        await page.setViewportSize({ width, height: 1024 });
        const measurement = await page.evaluate(() => {
          const summary = document.querySelector(".weather-summary");
          const box = summary.getBoundingClientRect();
          return {
            width: innerWidth,
            overflow: document.documentElement.scrollWidth - innerWidth,
            childOverflow: Math.max(0, ...[...summary.children].map((child) => {
              const rect = child.getBoundingClientRect();
              return Math.max(rect.right - box.right, box.left - rect.left);
            })),
          };
        });
        measurements.push(measurement);
      }
      assert.ok(measurements.every((m) => m.overflow === 0 && m.childOverflow === 0),
        JSON.stringify(measurements));
      return measurements;
    } finally {
      await context.close();
    }
  });

  await check("I5 small-phone first viewport", async () => {
    const { context, page } = await openPage({ width: 375, height: 667 });
    try {
      const nav = await page.locator(".bottom-nav").evaluate(bounds);
      const media = await page.locator(".onboarding-media").evaluate(bounds);
      const controls = await page.locator(".preference-panel input, .primary-action")
        .evaluateAll((elements) => elements.map((element) => {
          const { y, bottom, height } = element.getBoundingClientRect();
          return { name: element.getAttribute("value") ?? element.textContent, y, bottom, height };
        }));
      assert.ok(controls.every((box) => box.y >= media.bottom && box.bottom <= nav.y),
        JSON.stringify({ navTop: nav.y, mediaHeight: media.height, controls }));
      assert.ok(controls.every((box) => box.height >= 34));
      assert.equal(await page.evaluate(() => scrollY), 0);
      await selectPreferences(page);
      const button = await page.locator(".primary-action").evaluate(bounds);
      assert.ok(button.bottom <= nav.y && button.height >= 44);
      return { mediaHeight: media.height, buttonBottom: button.bottom, navTop: nav.y };
    } finally {
      await context.close();
    }
  });

  for (const width of [1440, 768]) {
    await check(`I6 same-slot normal-motion loading at ${width}`, async () => {
      const { context, page } = await openPage({ width, height: width === 1440 ? 900 : 1024 });
      try {
        await selectPreferences(page);
        await page.clock.install();
        await page.clock.pauseAt(new Date(Date.now() + 1000));
        const outgoing = await page.locator(".onboarding-stage").evaluate(bounds);
        await page.getByRole("button", { name: "生成周末计划" }).press("Enter");
        await expect(page.locator(".results-loading")).toHaveCount(1);
        const loading = await page.locator(".results-loading").evaluate(bounds);
        const skeleton = await page.locator(".skeleton-heading").evaluate(bounds);
        assert.ok(Math.abs(loading.y - outgoing.y) <= 1 && skeleton.y < outgoing.bottom,
          JSON.stringify({ outgoingY: outgoing.y, outgoingBottom: outgoing.bottom, loadingY: loading.y, skeletonY: skeleton.y }));
        assert.ok(skeleton.bottom < page.viewportSize().height);
        await page.clock.runFor(100);
        const during = await page.locator(".skeleton-heading").evaluate(bounds);
        assert.ok(Math.abs(during.y - skeleton.y) <= 1);
        await page.clock.runFor(1000);
        await expect(page.locator(".results-stage h1")).toBeFocused();
        const heading = await page.locator(".results-masthead").evaluate(bounds);
        const route = await page.locator(".lead-route").evaluate(bounds);
        return { outgoingY: outgoing.y, loadingY: loading.y, skeletonY: skeleton.y, resultHeadingY: heading.y, resultRouteY: route.y };
      } finally {
        await context.close();
      }
    });
  }

  for (const reducedMotion of ["no-preference", "reduce"]) {
    await check(`I4 keyboard focus and announcements (${reducedMotion})`, async () => {
      const { context, page } = await openPage({ width: 1440, height: 900 }, reducedMotion);
      try {
        await selectPreferences(page);
        await page.keyboard.press("Tab");
        await expect(page.getByRole("button", { name: "生成周末计划" })).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page.locator(".results-stage h1")).toBeFocused();
        const status = page.getByRole("status", { name: "周末计划状态" });
        await expect(status).toContainText("周末计划已生成");
        await page.getByRole("radio", { name: "一个人" }).check();
        await expect(page.getByRole("radio", { name: "一个人" })).toBeFocused();
        if (reducedMotion === "reduce") {
          assert.equal(await page.evaluate(() =>
            document.getAnimations().filter((animation) => animation.playState === "running").length), 0);
        }
        await page.getByRole("button", { name: "调整偏好" }).press("Enter");
        await expect(page.getByRole("heading", { name: "换个方向，再排一次。" })).toBeFocused();
        await expect(status).toBeEmpty();
        await page.keyboard.press("Tab");
        await expect(page.getByRole("checkbox", { name: "看展" })).toBeFocused();
        return { resultsFocused: true, editingFocused: true, radioFocusRetained: true };
      } finally {
        await context.close();
      }
    });
  }
} finally {
  await browser?.close();
  await server.close();
}

console.log(`${8 - failures.length}/8 focused Chromium checks passed`);
if (failures.length) process.exitCode = 1;
