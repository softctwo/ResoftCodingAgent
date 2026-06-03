import { describe, it, expect, beforeEach } from "vitest";
import { DiffTracker } from "./diff-tracker.ts";

describe("DiffTracker", () => {
  let tracker: DiffTracker;
  beforeEach(() => { tracker = new DiffTracker(); });

  it("returns full file as changed on first call", () => {
    const blocks = tracker.getChangedBlocks("test.sql", "line1\nline2\nline3");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].startLine).toBe(1);
    expect(blocks[0].endLine).toBe(3);
  });

  it("returns empty when content unchanged", () => {
    tracker.updateSnapshot("test.sql", "line1\nline2", []);
    expect(tracker.getChangedBlocks("test.sql", "line1\nline2")).toHaveLength(0);
  });

  it("detects changed lines after snapshot", () => {
    tracker.updateSnapshot("test.sql", "line1\nline2\nline3", []);
    const blocks = tracker.getChangedBlocks("test.sql", "line1\nCHANGED\nline3");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].startLine).toBe(2);
  });

  it("detects appended lines", () => {
    tracker.updateSnapshot("test.sql", "line1\nline2", []);
    const blocks = tracker.getChangedBlocks("test.sql", "line1\nline2\nline3\nline4");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].startLine).toBe(3);
  });

  it("handles empty content", () => {
    const blocks = tracker.getChangedBlocks("empty.sql", "");
    expect(blocks).toHaveLength(1);
  });

  it("tracks snapshot issues", () => {
    tracker.updateSnapshot("f.sql", "content", [{ id: "i1", description: "test", severity: "warning" as const }]);
    expect(tracker.getSnapshot("f.sql")!.issues).toHaveLength(1);
  });

  it("lists tracked files", () => {
    tracker.updateSnapshot("a.sql", "a", []);
    tracker.updateSnapshot("b.sql", "b", []);
    expect(tracker.getTrackedFiles()).toHaveLength(2);
  });

  it("removeFile clears tracking", () => {
    tracker.updateSnapshot("a.sql", "content", []);
    tracker.removeFile("a.sql");
    expect(tracker.getSnapshot("a.sql")).toBeUndefined();
  });

  it("clear removes all state", () => {
    tracker.updateSnapshot("a.sql", "content", []);
    tracker.clear();
    expect(tracker.getTrackedFiles()).toHaveLength(0);
  });
});
