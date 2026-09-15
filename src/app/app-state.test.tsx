import { render, screen } from "@testing-library/react";
import { App } from "./App";

it("renders the 城迹 navigation", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: "城迹" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "推荐" })).toBeInTheDocument();
});
