/**
 * @jest-environment node
 */
import { capitalizeFirstLetter, getStatusColor } from "../lib/utils";

describe("Utils", () => {
  it("capitalizes first letter correctly", () => {
    expect(capitalizeFirstLetter("hello")).toBe("Hello");
    expect(capitalizeFirstLetter("world")).toBe("World");
  });

  it("returns correct status color", () => {
    expect(getStatusColor("delivered")).toBe("#10B981");
    expect(getStatusColor("pending")).toBe("#F59E0B");
    expect(getStatusColor("unknown")).toBe("#666");
  });
});
