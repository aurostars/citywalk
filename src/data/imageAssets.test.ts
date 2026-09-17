import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  statSync,
} from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const GENERATING_PLACEHOLDER_SHA256 =
  "e330cd023298a812503e10a067a3f88e1cbc094f37f6fd2a88fdb6799495b37e";

const expectedAssets = [
  "images/hero/beijing-weekend.webp",
  "images/activities/798-art-weekend.webp",
  "images/activities/gulou-weekend-market.webp",
  "images/activities/liangma-river-live.webp",
  "images/activities/ncpa-weekend-concert.webp",
  "images/activities/panjiayuan-vintage-market.webp",
  "images/activities/shougang-industrial-exhibition.webp",
  "images/activities/xiangshan-morning-hike.webp",
  "images/activities/wenyu-river-cycling.webp",
  "images/activities/universal-beijing-day.webp",
  "images/activities/tianqiao-musical-night.webp",
  "images/activities/indoor-ski-weekend.webp",
  "images/activities/immersive-theatre-weekend.webp",
] as const;

const hashes: string[] = [];

describe("static city image assets", () => {
  it.each(expectedAssets)("%s is a valid normalized WebP", async (asset) => {
    const filePath = resolve(process.cwd(), "public", asset);

    expect(existsSync(filePath)).toBe(true);
    if (!existsSync(filePath)) {
      return;
    }

    const metadata = await sharp(filePath).metadata();
    const hash = createHash("sha256")
      .update(readFileSync(filePath))
      .digest("hex");

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(1600);
    expect(metadata.height).toBe(1200);
    expect(statSync(filePath).size).toBeLessThanOrEqual(450_000);
    expect(hash).not.toBe(GENERATING_PLACEHOLDER_SHA256);
    hashes.push(hash);
  });

  it("contains thirteen unique images", () => {
    expect(new Set(hashes).size).toBe(expectedAssets.length);
  });
});
