import { executeFontSubset, parseAndNormalizeFont } from './fontSubsetCore';
import type { ParsedFontMetadata, SubsetOptions, SubsetResult } from './fontSubsetUtils';

interface PendingTask {
  resolve: (value: any) => void;
  reject: (err: Error) => void;
}

let worker: Worker | null = null;
let workerFailed = false;
let nextId = 1;
const pending = new Map<number, PendingTask>();

function getWorker(): Worker | null {
  if (workerFailed || typeof Worker === 'undefined') return null;
  if (worker) return worker;

  try {
    worker = new Worker(new URL('./fontSubsetWorker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<any>) => {
      const { id, ok, error, sfntBuffer, metadata, result, outBuffer } = event.data;
      const task = pending.get(id);
      if (!task) return;
      pending.delete(id);
      if (!ok) {
        task.reject(new Error(error || 'Font worker error'));
        return;
      }
      if (sfntBuffer) {
        task.resolve({ sfntBytes: new Uint8Array(sfntBuffer), metadata });
      } else {
        task.resolve({ ...result, bytes: new Uint8Array(outBuffer) });
      }
    };
    worker.onerror = () => {
      workerFailed = true;
      for (const task of pending.values()) {
        task.reject(new Error('WORKER_UNAVAILABLE'));
      }
      pending.clear();
      worker?.terminate();
      worker = null;
    };
    return worker;
  } catch {
    workerFailed = true;
    return null;
  }
}

export async function parseFontInWorker(
  rawBytes: Uint8Array,
  faceIndex = 0
): Promise<{ sfntBytes: Uint8Array; metadata: ParsedFontMetadata }> {
  const w = getWorker();
  if (!w) {
    return parseAndNormalizeFont(rawBytes, faceIndex);
  }

  const id = nextId++;
  const copyBuf = rawBytes.slice().buffer;
  try {
    return await new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      w.postMessage({ id, type: 'parse', rawBuffer: copyBuf, faceIndex }, [copyBuf]);
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'WORKER_UNAVAILABLE') {
      return parseAndNormalizeFont(rawBytes, faceIndex);
    }
    throw err;
  }
}

export async function subsetFontInWorker(
  sfntBytes: Uint8Array,
  options: SubsetOptions
): Promise<SubsetResult> {
  const w = getWorker();
  if (!w) {
    return executeFontSubset(sfntBytes, options);
  }

  const id = nextId++;
  const copyBuf = sfntBytes.slice().buffer;
  try {
    return await new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      w.postMessage(
        { id, type: 'subset', sfntBuffer: copyBuf, options },
        [copyBuf]
      );
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'WORKER_UNAVAILABLE') {
      return executeFontSubset(sfntBytes, options);
    }
    throw err;
  }
}
