vi.hoisted(() => {
  vi.stubEnv("BASE_URL", "/citywalk/");
});

import { assetPath } from "./assetPath";

it("prefixes relative asset paths with the configured base URL", () => {
  expect(assetPath("images/hero/beijing-weekend.webp")).toBe(
    "/citywalk/images/hero/beijing-weekend.webp",
  );
});

it("normalizes leading slashes before prefixing the base URL", () => {
  expect(assetPath("/images/activities/798-art-weekend.webp")).toBe(
    "/citywalk/images/activities/798-art-weekend.webp",
  );
});
