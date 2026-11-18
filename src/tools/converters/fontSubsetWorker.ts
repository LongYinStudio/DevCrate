import { executeFontSubset, parseAndNormalizeFont } from './fontSubsetCore';
import type { SubsetOptions } from './fontSubsetUtils';

type WorkerRequest =
  | {
      id: number;
      type: 'parse';
      rawBuffer: ArrayBuffer;
      faceIndex: number;
    }
  | {
      id: number;
      type: 'subset';
      sfntBuffer: ArrayBuffer;
      options: SubsetOptions;
    };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    if (msg.type === 'parse') {
      const { sfntBytes, metadata } = await parseAndNormalizeFont(
        new Uint8Array(msg.rawBuffer),
        msg.faceIndex
      );
      const transferable = sfntBytes.slice().buffer;
      self.postMessage(
        { id: msg.id, ok: true, sfntBuffer: transferable, metadata },
        { transfer: [transferable] }
      );
      return;
    }

    if (msg.type === 'subset') {
      const result = await executeFontSubset(
        new Uint8Array(msg.sfntBuffer),
        msg.options
      );
      const outBuffer = result.bytes.slice().buffer;
      self.postMessage(
        {
          id: msg.id,
          ok: true,
          result: { ...result, bytes: undefined },
          outBuffer,
        },
        { transfer: [outBuffer] }
      );
    }
  } catch (err) {
    self.postMessage({
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
