import { describe, it, expect, vi } from "vitest";

global.fetch = vi.fn();

describe("agentApi", () => {
  it("exporta función run", async () => {
    const { agentApi } = await import("@/lib/api");
    expect(typeof agentApi.run).toBe("function");
  });
});
