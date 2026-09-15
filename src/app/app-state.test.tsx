import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

const colorSchemeQuery = "(prefers-color-scheme: dark)";

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: colorSchemeQuery,
    onchange: null,
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.add(listener),
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
    addListener: (listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeListener: (listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
    dispatchEvent: () => true,
  } as MediaQueryList;

  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches, media: colorSchemeQuery } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
  vi.unstubAllGlobals();
});

it("renders the 城迹 navigation", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: "城迹" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "推荐" })).toBeInTheDocument();
});

it("follows system theme changes without setting a root override", () => {
  const colorScheme = installMatchMedia(false);

  render(<App />);

  expect(document.documentElement).not.toHaveAttribute("data-theme");
  expect(
    screen.getByRole("button", { name: "切换至深色主题" }),
  ).toBeInTheDocument();

  act(() => colorScheme.setMatches(true));

  expect(document.documentElement).not.toHaveAttribute("data-theme");
  expect(
    screen.getByRole("button", { name: "切换至浅色主题" }),
  ).toBeInTheDocument();
});

it("keeps a manual theme override when the system theme changes", async () => {
  const user = userEvent.setup();
  const colorScheme = installMatchMedia(false);

  render(<App />);
  act(() => colorScheme.setMatches(true));
  await user.click(
    screen.getByRole("button", { name: "切换至浅色主题" }),
  );

  expect(document.documentElement).toHaveAttribute("data-theme", "light");

  act(() => colorScheme.setMatches(false));
  act(() => colorScheme.setMatches(true));

  expect(document.documentElement).toHaveAttribute("data-theme", "light");
  expect(
    screen.getByRole("button", { name: "切换至深色主题" }),
  ).toBeInTheDocument();
});
