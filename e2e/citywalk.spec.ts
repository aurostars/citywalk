import { expect, test, type Page } from "@playwright/test";

const imageEndpoint =
  "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image";

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

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    rootClientWidth: document.documentElement.clientWidth,
    rootScrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(
    dimensions.bodyClientWidth + 1,
  );
  expect(dimensions.rootScrollWidth).toBeLessThanOrEqual(
    dimensions.rootClientWidth + 1,
  );
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

test("team query preselects an activity and a created team can be left", async ({
  page,
}) => {
  await page.goto("./#/teams?activity=798-art-weekend");
  await page.getByRole("button", { name: "发起队伍" }).click();

  const dialog = page.getByRole("dialog", { name: "创建周末队伍" });
  await expect(dialog.getByLabel("活动")).toHaveValue("798-art-weekend");
  await dialog.getByLabel("出发时间").fill("2026-09-21T10:30");
  await dialog.getByLabel("集合点").fill("798 艺术区南门");
  await dialog
    .getByLabel("队伍说明")
    .fill("先看主展，再一起整理周末照片。");
  await dialog.getByRole("button", { name: "创建队伍" }).click();

  await expect(dialog.getByText("队伍已创建")).toBeVisible();
  await dialog.getByRole("button", { name: "查看我的队伍" }).click();
  const createdTeam = page
    .getByRole("article", { name: "798 当代艺术周末组队" })
    .first();
  await expect(createdTeam).toContainText("我发起");
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
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectNoHorizontalOverflow(page);

    await generateWeekendPlan(page);
    await expectNoHorizontalOverflow(page);

    for (const route of ["#/teams", "#/checkins", "#/guides"]) {
      await page.goto(`./${route}`);
      await expectNoHorizontalOverflow(page);
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
  await generateWeekendPlan(page);
  await expect(page.locator(".skeleton").first()).toBeHidden();
  await expect(
    page.getByRole("button", { name: "调整偏好" }),
  ).toHaveCSS("transition-duration", "0s");
});

test("generated images load from the required endpoint without shifting frames", async ({
  page,
}) => {
  await generateWeekendPlan(page);
  const images = page.locator("img");
  await expect(images.first()).toBeVisible();

  for (let index = 0; index < (await images.count()); index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element) =>
            element.complete &&
            element.naturalWidth > 0 &&
            element.naturalHeight > 0,
        ),
      )
      .toBe(true);
    await expect(image).toHaveAttribute("src", new RegExp(`^${imageEndpoint}`));
    await expect(image).toHaveAttribute("width", /^[1-9]\d*$/);
    await expect(image).toHaveAttribute("height", /^[1-9]\d*$/);
  }

  const before = await images.evaluateAll((elements) =>
    elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      return { height: bounds.height, width: bounds.width };
    }),
  );
  await page.waitForTimeout(500);
  const after = await images.evaluateAll((elements) =>
    elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      return { height: bounds.height, width: bounds.width };
    }),
  );

  expect(after).toEqual(before);
  expect(
    after.every(({ height, width }) => height > 0 && width > 0),
  ).toBe(true);
});
