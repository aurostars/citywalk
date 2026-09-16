import { expect, test, type Locator, type Page } from "@playwright/test";

const reducedMotionCompletionLimitMs = 300;

async function resetApp(page: Page) {
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function generateWeekendPlan(page: Page) {
  await page.getByRole("checkbox", { name: "看展" }).check();
  await page.getByRole("radio", { name: "100 元内" }).check();
  await page.getByRole("button", { name: "生成周末计划" }).click();
  await expect(
    page.getByRole("heading", { name: "为你安排的北京周末" }),
  ).toBeVisible();
}

async function expectNoHorizontalOverflow(
  page: Page,
  surface: Locator,
  surfaceName: string,
) {
  await expect(surface).toBeVisible();
  await expect(
    page.getByRole("status", { name: "页面加载中" }),
  ).toHaveCount(0);

  const dimensions = await surface.evaluate((element) => {
    const root = document.documentElement;
    const viewportWidth = root.clientWidth;
    const outOfViewportChildren = Array.from(element.children).flatMap(
      (child) => {
        const bounds = child.getBoundingClientRect();
        const style = window.getComputedStyle(child);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          bounds.width === 0 ||
          bounds.height === 0
        ) {
          return [];
        }

        return bounds.left < -1 || bounds.right > viewportWidth + 1
          ? [
              {
                left: Math.round(bounds.left),
                name:
                  child.getAttribute("class") || child.tagName.toLowerCase(),
                right: Math.round(bounds.right),
              },
            ]
          : [];
      },
    );

    return {
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      outOfViewportChildren,
      rootClientWidth: viewportWidth,
      rootScrollWidth: root.scrollWidth,
      surfaceClientWidth: element.clientWidth,
      surfaceScrollWidth: element.scrollWidth,
    };
  });

  expect(
    dimensions.bodyScrollWidth,
    `${surfaceName} expanded the document body`,
  ).toBeLessThanOrEqual(
    dimensions.bodyClientWidth + 1,
  );
  expect(
    dimensions.rootScrollWidth,
    `${surfaceName} expanded the document root`,
  ).toBeLessThanOrEqual(
    dimensions.rootClientWidth + 1,
  );
  expect(
    dimensions.surfaceScrollWidth,
    `${surfaceName} has local horizontal overflow`,
  ).toBeLessThanOrEqual(dimensions.surfaceClientWidth + 1);
  expect(
    dimensions.outOfViewportChildren,
    `${surfaceName} has rendered children outside the viewport`,
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test("fresh onboarding generates and restores a weekend plan", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "这个周末，换条路走。" }),
  ).toBeVisible();

  await generateWeekendPlan(page);
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "为你安排的北京周末" }),
  ).toBeVisible();
  await expect(page.getByLabel("当前偏好")).toContainText("看展");
  await expect(page.getByLabel("当前偏好")).toContainText("100 元内");
});

test("saved preferences can be edited and replace the current plan", async ({
  page,
}) => {
  await generateWeekendPlan(page);
  await page.getByRole("button", { name: "调整偏好" }).click();

  await expect(page.getByRole("checkbox", { name: "看展" })).toBeChecked();
  await expect(
    page.getByRole("radio", { name: "100 元内" }),
  ).toBeChecked();
  await page.getByRole("checkbox", { name: "逛市集" }).check();
  await page.getByRole("radio", { name: "免费" }).check();
  await page.getByRole("button", { name: "更新周末计划" }).click();

  await expect(page.getByLabel("当前偏好")).toContainText("看展、市集");
  await expect(page.getByLabel("当前偏好")).toContainText("免费");
});

test("an activity can be favorited from detail and restored", async ({
  page,
}) => {
  await generateWeekendPlan(page);
  await page
    .getByRole("link", { name: "查看798 当代艺术周末详情" })
    .click();

  await expect(
    page.getByRole("heading", { name: "798 当代艺术周末" }),
  ).toBeVisible();
  const favoriteButton = page.getByRole("button", {
    name: "收藏活动",
  });
  await favoriteButton.click();
  await expect(
    page.getByRole("button", { name: "取消收藏" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: "取消收藏" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("activity detail opens at top and returns to the prior Home scroll", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "逛市集" }).check();
  await page.getByRole("radio", { name: "100 元内" }).check();
  await page.getByRole("button", { name: "生成周末计划" }).click();
  const detailLink = page.getByRole("link", {
    name: "查看潘家园旧物早市详情",
  });
  await detailLink.scrollIntoViewIfNeeded();
  const homeScrollY = await page.evaluate(() => window.scrollY);
  expect(homeScrollY).toBeGreaterThan(0);

  await detailLink.click();
  await expect(
    page.getByRole("heading", { name: "潘家园旧物早市" }),
  ).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.getByRole("link", { name: "返回周末推荐" }).click();
  await expect(
    page.getByRole("heading", { name: "为你安排的北京周末" }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      Math.abs((await page.evaluate(() => window.scrollY)) - homeScrollY)
    )
    .toBeLessThanOrEqual(2);
});

test("team query preselects an activity and a created team can be left", async ({
  page,
}) => {
  await page.goto("./#/teams?activity=798-art-weekend");
  await page.getByRole("button", { name: "发起队伍" }).click();

  const dialog = page.getByRole("dialog", { name: "创建周末队伍" });
  await expect(dialog.getByLabel("活动")).toHaveValue("798-art-weekend");
  await dialog.getByLabel("出发时间").fill("2026-09-19T10:30");
  await dialog.getByLabel("集合点").fill("798 艺术区南门");
  await dialog
    .getByLabel("队伍说明")
    .fill("先看主展，再一起整理周末照片。");
  await dialog.getByRole("button", { name: "创建队伍" }).click();

  await expect(dialog.getByText("队伍已创建")).toBeVisible();
  await dialog.getByRole("button", { name: "查看我的队伍" }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  const createdTeam = page
    .getByRole("article", { name: "798 当代艺术周末组队" })
    .first();
  await expect(createdTeam).toContainText("我发起");
  await expect(createdTeam).toContainText(
    "先看主展，再一起整理周末照片。",
  );
  await createdTeam.getByRole("button", { name: "退出队伍" }).click();
  await expect(
    createdTeam.getByRole("button", { name: "加入队伍" }),
  ).toBeVisible();
});

test("check-in query preselects an activity and keeps success until confirmation", async ({
  page,
}) => {
  await page.goto("./#/checkins?activity=798-art-weekend");
  await page.getByRole("button", { name: "新增打卡" }).click();

  const dialog = page.getByRole("dialog", { name: "记录一次出发" });
  await expect(dialog.getByLabel("活动")).toHaveValue("798-art-weekend");
  await dialog.getByLabel("日期").fill("2026-09-20");
  await dialog.getByLabel("同行人数").selectOption("pair");
  await dialog.getByRole("radio", { name: "4 星" }).check();
  await dialog
    .getByLabel("打卡记录")
    .fill("雨后园区很安静，主展路线也很顺。");
  await dialog.getByRole("button", { name: "保存打卡" }).click();

  await expect(dialog.getByLabel("打卡已保存")).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "保存打卡" }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "关闭打卡窗口" }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("article", { name: "798 当代艺术周末打卡" }),
  ).toContainText("雨后园区很安静");
});

test("guides can be filtered, saved, published, and explicitly confirmed", async ({
  page,
}) => {
  await page.goto("./#/guides");
  await page.getByRole("button", { name: "市集", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "潘家园早市的三个停留点" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "下雨也能慢慢逛的 798 顺序" }),
  ).toBeHidden();

  const saveButton = page.getByRole("button", {
    name: "收藏《潘家园早市的三个停留点》",
  });
  await saveButton.click();
  await expect(
    page.getByRole("button", {
      name: "取消收藏《潘家园早市的三个停留点》",
    }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "写攻略" }).click();
  const dialog = page.getByRole("dialog", { name: "分享周末攻略" });
  await dialog.getByLabel("标题").fill("雨后逛 798 的半日顺序");
  await dialog.getByLabel("关联地点").selectOption("798-art-weekend");
  await dialog
    .getByLabel("正文摘要")
    .fill("从南门进园区，先看主展，再沿北侧厂房慢慢逛。");
  await dialog.getByLabel("适合人群").fill("第一次去 798 的两人同行");
  await dialog.getByRole("button", { name: "发布攻略" }).click();

  await expect(dialog.getByLabel("攻略已发布")).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "发布攻略" }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "完成" }).click();
  await expect(
    page.getByRole("heading", { name: "雨后逛 798 的半日顺序" }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "雨后逛 798 的半日顺序" }),
  ).toContainText("我的分享");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("article", { name: "雨后逛 798 的半日顺序" }),
  ).toContainText("我的分享");
});

test("theme choice updates the document and persists across reloads", async ({
  page,
}) => {
  await page.getByRole("button", { name: "切换至深色主题" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "切换至浅色主题" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("mobile navigation reaches every primary section", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByRole("navigation", { name: "主导航" })).toBeHidden();
  const mobileNavigation = page.getByRole("navigation", {
    name: "移动端导航",
  });
  await expect(mobileNavigation).toBeVisible();

  for (const [label, hash, heading] of [
    ["移动端组队", "#/teams", "一起出发"],
    ["移动端打卡", "#/checkins", "留下城迹"],
    ["移动端攻略", "#/guides", "走过，再分享"],
    ["移动端推荐", "#/", "这个周末，换条路走。"],
  ] as const) {
    await mobileNavigation.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`${hash.replace("/", "\\/")}$`));
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});

test("small-phone onboarding keeps compact validation and action in the first viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload({ waitUntil: "domcontentloaded" });

  const validation = page.getByText("请选择活动类型和预算后继续。");
  await expect(validation).toBeVisible();
  await page.getByRole("checkbox", { name: "看展" }).check();
  await page.getByRole("radio", { name: "100 元内" }).check();

  const positions = await page.evaluate(() => {
    const action = document.querySelector(".preference-action");
    const navigation = document.querySelector(".bottom-nav");
    if (!action || !navigation) {
      return null;
    }
    return {
      actionBottom: action.getBoundingClientRect().bottom,
      navigationTop: navigation.getBoundingClientRect().top,
    };
  });
  expect(positions).not.toBeNull();
  expect(positions?.actionBottom).toBeLessThanOrEqual(
    positions?.navigationTop ?? 0,
  );
});

test("mobile results reveal a material portion of lead media above navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await generateWeekendPlan(page);

  const visibleLeadMedia = await page.evaluate(() => {
    const image = document.querySelector(".lead-activity-image");
    const navigation = document.querySelector(".bottom-nav");
    if (!image || !navigation) {
      return null;
    }
    const imageBounds = image.getBoundingClientRect();
    const navigationTop = navigation.getBoundingClientRect().top;
    return Math.max(
      0,
      Math.min(imageBounds.bottom, navigationTop) -
        Math.max(imageBounds.top, 0),
    );
  });

  expect(visibleLeadMedia).not.toBeNull();
  expect(visibleLeadMedia).toBeGreaterThanOrEqual(160);
});

test("mobile interactive controls provide 44 pixel touch targets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "这个周末，换条路走。" }),
  ).toBeVisible();

  const undersizedTargets: Array<{
    height: number;
    name: string;
    surface: string;
    width: number;
  }> = [];
  async function collectUndersizedTargets(surface: string) {
    const targets = await page
      .locator(
        "a:visible, button:visible, label:has(input):visible, input:visible, select:visible, textarea:visible",
      )
      .evaluateAll((elements) =>
        elements.flatMap((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.width < 44 || bounds.height < 44
            ? [
                {
                  height: Math.round(bounds.height),
                  name:
                    element.getAttribute("aria-label") ??
                    element.textContent?.trim() ??
                    element.tagName,
                  width: Math.round(bounds.width),
                },
              ]
            : [];
        }),
      );
    undersizedTargets.push(
      ...targets.map((target) => ({ ...target, surface })),
    );
  }

  await collectUndersizedTargets("onboarding");
  await generateWeekendPlan(page);
  await collectUndersizedTargets("results");

  await page.goto("./#/activity/798-art-weekend");
  await expect(
    page.getByRole("heading", { name: "798 当代艺术周末" }),
  ).toBeVisible();
  await collectUndersizedTargets("activity detail");

  await page.goto("./#/teams");
  await page.getByRole("button", { name: "发起队伍" }).click();
  await expect(
    page.getByRole("dialog", { name: "创建周末队伍" }),
  ).toBeVisible();
  await collectUndersizedTargets("team dialog");
  await page.getByRole("button", { name: "关闭创建窗口" }).click();

  await page.goto("./#/checkins");
  await page.getByRole("button", { name: "新增打卡" }).click();
  await expect(
    page.getByRole("dialog", { name: "记录一次出发" }),
  ).toBeVisible();
  await collectUndersizedTargets("check-in dialog");
  await page.getByRole("button", { name: "关闭打卡窗口" }).click();

  await page.goto("./#/guides");
  await page.getByRole("button", { name: "写攻略" }).click();
  await expect(
    page.getByRole("dialog", { name: "分享周末攻略" }),
  ).toBeVisible();
  await collectUndersizedTargets("guide dialog");

  expect(undersizedTargets).toEqual([]);
});

test("unknown activities show a recovery route", async ({ page }) => {
  await page.goto("./#/activity/not-a-citywalk-activity");

  await expect(
    page.getByRole("heading", {
      name: "这条活动不在当前周末清单里",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "返回周末推荐" }).click();
  await expect(
    page.getByRole("heading", { name: "这个周末，换条路走。" }),
  ).toBeVisible();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("./", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "这个周末，换条路走。" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(
      page,
      page.locator(".home-page"),
      "Home onboarding",
    );

    await generateWeekendPlan(page);
    await expectNoHorizontalOverflow(
      page,
      page.locator(".home-page"),
      "Home results",
    );

    for (const surface of [
      {
        heading: "798 当代艺术周末",
        name: "Activity Detail",
        route: "#/activity/798-art-weekend",
        selector: ".activity-detail",
      },
      {
        dialogButton: "发起队伍",
        dialogName: "创建周末队伍",
        heading: "一起出发",
        name: "Teams",
        route: "#/teams",
        selector: ".teams-page",
      },
      {
        dialogButton: "新增打卡",
        dialogName: "记录一次出发",
        heading: "留下城迹",
        name: "Check-ins",
        route: "#/checkins",
        selector: ".checkins-page",
      },
      {
        dialogButton: "写攻略",
        dialogName: "分享周末攻略",
        heading: "走过，再分享",
        name: "Guides",
        route: "#/guides",
        selector: ".guides-page",
      },
    ]) {
      await page.goto(`./${surface.route}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", { name: surface.heading }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(
        page,
        page.locator(surface.selector),
        surface.name,
      );

      if (surface.dialogButton && surface.dialogName) {
        await page
          .getByRole("button", { name: surface.dialogButton })
          .click();
        const dialog = page.getByRole("dialog", {
          name: surface.dialogName,
        });
        await expect(dialog).toBeVisible();
        await expectNoHorizontalOverflow(
          page,
          dialog,
          `${surface.name} creation dialog`,
        );
      }
    }
  });
}

test("reduced motion keeps state changes immediate and removes decorative animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "domcontentloaded" });

  const preferenceButton = page.getByRole("button", {
    name: "生成周末计划",
  });
  await expect(preferenceButton).toHaveCSS("transition-duration", "0s");
  await page.getByRole("checkbox", { name: "看展" }).check();
  await page.getByRole("radio", { name: "100 元内" }).check();
  await preferenceButton.evaluate((button) => {
    const probe = {
      clickAt: null as number | null,
      resultAt: null as number | null,
    };
    const probeWindow = window as typeof window & {
      __citywalkReducedMotionProbe?: typeof probe;
    };
    probeWindow.__citywalkReducedMotionProbe = probe;

    const observer = new MutationObserver(() => {
      if (document.querySelector(".results-stage h1")) {
        probe.resultAt = performance.now();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    button.addEventListener(
      "click",
      () => {
        probe.clickAt = performance.now();
      },
      { capture: true, once: true },
    );
  });

  await preferenceButton.click();
  await page.waitForFunction(
    () => {
      const probeWindow = window as typeof window & {
        __citywalkReducedMotionProbe?: {
          clickAt: number | null;
          resultAt: number | null;
        };
      };
      return probeWindow.__citywalkReducedMotionProbe?.resultAt !== null;
    },
    undefined,
    { timeout: 2_000 },
  );
  const completionMs = await page.evaluate(() => {
    const probeWindow = window as typeof window & {
      __citywalkReducedMotionProbe?: {
        clickAt: number | null;
        resultAt: number | null;
      };
    };
    const probe = probeWindow.__citywalkReducedMotionProbe;
    if (probe?.clickAt === null || probe?.resultAt === null || !probe) {
      throw new Error("Reduced-motion completion was not observed");
    }
    return probe.resultAt - probe.clickAt;
  });

  expect(completionMs).toBeLessThan(reducedMotionCompletionLimitMs);
  await expect(
    page.getByRole("heading", { name: "为你安排的北京周末" }),
  ).toBeVisible();
  await expect(page.locator(".skeleton").first()).toBeHidden();
  await expect(
    page.getByRole("button", { name: "调整偏好" }),
  ).toHaveCSS("transition-duration", "0s");
});

test("static images load without generation requests or shifting frames", async ({
  page,
}) => {
  const generationRequests: string[] = [];
  let hasClaimedStaticImage = false;
  let heldImageUrl: string | null = null;
  let heldResponseReady = false;
  let releaseHeldImageResponse: () => void = () => {};
  const heldImageResponseGate = new Promise<void>((resolve) => {
    releaseHeldImageResponse = resolve;
  });

  await page.route("**/api/ide/v1/text_to_image**", async (route) => {
    generationRequests.push(route.request().url());
    await route.abort();
  });
  await page.route(
    (url) =>
      url.pathname.startsWith("/citywalk/images/activities/") &&
      url.pathname.endsWith(".webp"),
    async (route) => {
      if (hasClaimedStaticImage) {
        await route.continue();
        return;
      }

      hasClaimedStaticImage = true;
      heldImageUrl = route.request().url();
      heldResponseReady = true;
      await heldImageResponseGate;
      await route.continue();
    },
  );

  try {
    await generateWeekendPlan(page);
    await expect
      .poll(() => heldResponseReady, { timeout: 30_000 })
      .toBe(true);
    expect(generationRequests).toHaveLength(0);
    expect(heldImageUrl).not.toBeNull();

    const before = await page.evaluate((url) => {
      const image = Array.from(document.images).find(
        (candidate) => candidate.src === url,
      );
      if (!image) {
        return null;
      }
      const bounds = image.getBoundingClientRect();
      return {
        complete: image.complete,
        height: bounds.height,
        naturalHeight: image.naturalHeight,
        naturalWidth: image.naturalWidth,
        width: bounds.width,
      };
    }, heldImageUrl);
    expect(before).not.toBeNull();
    expect(before?.complete).toBe(false);
    expect(before?.naturalHeight).toBe(0);
    expect(before?.naturalWidth).toBe(0);
    expect(before?.height).toBeGreaterThan(0);
    expect(before?.width).toBeGreaterThan(0);

    releaseHeldImageResponse();
    await expect
      .poll(
        () =>
          page.evaluate((url) => {
            const image = Array.from(document.images).find(
              (candidate) => candidate.src === url,
            );
            return Boolean(
              image?.complete &&
                image.naturalWidth > 0 &&
                image.naturalHeight > 0,
            );
          }, heldImageUrl),
        { timeout: 30_000 },
      )
      .toBe(true);

    const after = await page.evaluate((url) => {
      const image = Array.from(document.images).find(
        (candidate) => candidate.src === url,
      );
      if (!image) {
        return null;
      }
      const bounds = image.getBoundingClientRect();
      return { height: bounds.height, width: bounds.width };
    }, heldImageUrl);
    expect(after).toEqual({
      height: before?.height,
      width: before?.width,
    });

    const images = page.locator("img");
    await expect(images.first()).toBeVisible();
    for (let index = 0; index < (await images.count()); index += 1) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(
          () =>
            image.evaluate(
              (element) =>
                element.complete &&
                element.naturalWidth > 0 &&
                element.naturalHeight > 0,
            ),
          { timeout: 30_000 },
        )
        .toBe(true);
      await expect(image).toHaveAttribute(
        "src",
        /\/citywalk\/images\/.+\.webp$/,
      );
      expect(await image.evaluate((node) => node.naturalWidth)).toBeGreaterThan(
        0,
      );
      expect(
        await image.evaluate((node) => node.naturalHeight),
      ).toBeGreaterThan(0);
    }
  } finally {
    releaseHeldImageResponse();
  }
});
