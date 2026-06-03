import type { Issue } from "../types.ts";

export interface DiffBlock {
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
}

export interface FileSnapshot {
  filePath: string;
  lastCheckedAt: number;
  lastHash: string;
  checkedLines: Set<number>;
  issues: Issue[];
}

export class DiffTracker {
  private snapshots: Map<string, FileSnapshot> = new Map();
  private contentCache: Map<string, string> = new Map();

  /** Compute a simple content hash */
  private hash(content: string): string {
    let h = 0;
    for (let i = 0; i < content.length; i++) {
      const c = content.charCodeAt(i);
      h = ((h << 5) - h) + c;
      h |= 0;
    }
    return h.toString(36);
  }

  /** Get changed blocks between current content and last snapshot */
  getChangedBlocks(filePath: string, currentContent: string): DiffBlock[] {
    const prev = this.snapshots.get(filePath);
    const currentHash = this.hash(currentContent);

    // First time seeing this file — whole file is new
    if (!prev) {
      const lines = currentContent.split("\n");
      return [
        {
          filePath,
          startLine: 1,
          endLine: lines.length,
          content: currentContent,
        },
      ];
    }

    // No change
    if (prev.lastHash === currentHash) return [];

    // Compute line-level diff against stored snapshot
    const prevLines = this.getCachedLines(filePath) ?? [];
    const currLines = currentContent.split("\n");
    return this.lineDiff(prevLines, currLines, filePath);
  }

  /** Simple line-level diff */
  private lineDiff(
    prevLines: string[],
    currLines: string[],
    filePath: string,
  ): DiffBlock[] {
    const blocks: DiffBlock[] = [];
    const maxLen = Math.max(prevLines.length, currLines.length);
    let blockStart = -1;

    for (let i = 0; i < maxLen; i++) {
      const changed =
        i >= prevLines.length ||
        i >= currLines.length ||
        prevLines[i] !== currLines[i];
      if (changed && blockStart === -1) {
        blockStart = i + 1; // 1-based
      }
      if (!changed && blockStart !== -1) {
        blocks.push({
          filePath,
          startLine: blockStart,
          endLine: i,
          content: currLines.slice(blockStart - 1, i).join("\n"),
        });
        blockStart = -1;
      }
    }

    // Trailing block
    if (blockStart !== -1) {
      blocks.push({
        filePath,
        startLine: blockStart,
        endLine: maxLen,
        content: currLines.slice(blockStart - 1).join("\n"),
      });
    }

    return blocks;
  }

  /** Get cached line content for a tracked file */
  private getCachedLines(filePath: string): string[] | null {
    const cachedContent = this.contentCache.get(filePath);
    return cachedContent ? cachedContent.split("\n") : null;
  }

  /** Update snapshot after a successful review */
  updateSnapshot(filePath: string, content: string, issues: Issue[]): void {
    this.contentCache.set(filePath, content);

    this.snapshots.set(filePath, {
      filePath,
      lastCheckedAt: Date.now(),
      lastHash: this.hash(content),
      checkedLines: new Set(),
      issues,
    });
  }

  /** Clear all snapshots and caches */
  clear(): void {
    this.snapshots.clear();
    this.contentCache.clear();
  }

  /** Get all tracked files */
  getTrackedFiles(): string[] {
    return Array.from(this.snapshots.keys());
  }

  /** Access snapshots for the incremental engine */
  getSnapshot(filePath: string): FileSnapshot | undefined {
    return this.snapshots.get(filePath);
  }

  /** Remove a single file from tracking */
  removeFile(filePath: string): void {
    this.snapshots.delete(filePath);
    this.contentCache.delete(filePath);
  }
}
