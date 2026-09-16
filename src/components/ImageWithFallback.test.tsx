import { fireEvent, render, screen } from "@testing-library/react";
import { ImageWithFallback } from "./ImageWithFallback";

it("attempts a new source after the previous source failed", () => {
  const props = {
    alt: "First activity",
    fallbackLabel: "First activity",
    height: 540,
    src: "/activity-a.jpg",
    width: 720,
  };
  const { rerender } = render(<ImageWithFallback {...props} />);

  fireEvent.error(screen.getByRole("img", { name: "First activity" }));
  expect(
    screen.getByRole("img", { name: /First activity图片暂不可用/ }),
  ).toBeVisible();

  rerender(<ImageWithFallback {...props} alt="Updated description" />);
  expect(screen.queryByAltText("Updated description")).not.toBeInTheDocument();

  rerender(
    <ImageWithFallback
      {...props}
      alt="Second activity"
      fallbackLabel="Second activity"
      src="/activity-b.jpg"
    />,
  );
  const recoveredImage = screen.getByRole("img", { name: "Second activity" });
  expect(recoveredImage).toHaveAttribute("src", "/activity-b.jpg");
  fireEvent.error(recoveredImage);
  expect(
    screen.getByRole("img", { name: /Second activity图片暂不可用/ }),
  ).toBeVisible();
});
