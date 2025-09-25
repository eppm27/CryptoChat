import { describe, it, expect } from "vitest";

describe("DOM Environment", () => {
  it("should have a document object", () => {
    expect(document).toBeDefined();
  });
});