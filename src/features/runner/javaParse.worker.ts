/** Parses Java files off the page's thread, one message per file (see javaParser.ts). */
import { parse } from 'java-parser';
import { modelJava } from '@/shared/javaModel';

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<string>) => void) | null;
  postMessage: (message: unknown) => void;
};

scope.onmessage = (e) => scope.postMessage(modelJava(parse, e.data));

// Warmed up (the first parse builds the parser), so the time limit counts parsing only.
parse('class A {}');
scope.postMessage('ready');
