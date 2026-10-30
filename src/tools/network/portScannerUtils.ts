export interface PortScanItem {
  port: number;
  open: boolean;
  latencyMs: number | null;
}

export interface ListeningPortItem {
  port: number;
  protocol: string;
  address: string;
  pid: number | null;
  processName: string | null;
  user: string | null;
}

/**
 * Parses user input string (e.g. "80, 443, 3000-3005, 8080") into unique, sorted port numbers
 */
export function parsePortInput(input: string): number[] {
  const parts = input.split(/[,，\s\n]+/);
  const set = new Set<number>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check if range like "3000-3010"
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(65535, Math.max(start, end));
        // Prevent accidental massive range freeze (e.g. 1-65535 limit to 5000)
        const count = max - min + 1;
        const actualMax = count > 2000 ? min + 1999 : max;
        for (let p = min; p <= actualMax; p++) {
          set.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= 65535) {
        set.add(p);
      }
    }
  }

  return Array.from(set).sort((a, b) => a - b);
}

/**
 * Splits array into chunks of specified size
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
