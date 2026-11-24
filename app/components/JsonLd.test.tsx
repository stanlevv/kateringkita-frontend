// Test JsonLd: "<" di-escape agar data tidak bisa menutup tag script.
import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { JsonLd } from "./JsonLd";

it("meng-escape < dan tetap bisa di-parse", () => {
  const { container } = render(<JsonLd data={{ name: "</script><b>x" }} />);
  const text = container.querySelector("script")!.textContent!;
  expect(text).not.toContain("</script>");
  expect(JSON.parse(text).name).toBe("</script><b>x");
});
