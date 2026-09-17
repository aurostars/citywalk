import { matchesBudget } from "./budget";

it.each([
  ["free", 0, true],
  ["free", 1, false],
  ["under-100", 0, true],
  ["under-100", 100, true],
  ["under-100", 101, false],
  ["100-300", 100, false],
  ["100-300", 101, true],
  ["100-300", 300, true],
  ["100-300", 301, false],
  ["above-300", 300, false],
  ["above-300", 301, true],
  ["any", 0, true],
  ["any", 528, true],
] as const)("matches %s against %i", (budget, price, expected) => {
  expect(matchesBudget(price, budget)).toBe(expected);
});
