/** Parses Java files for questionCheck.ts off its thread, one message per file (see there). */
import { parentPort } from 'node:worker_threads';
import { parse } from 'java-parser';
import { modelJava } from '../../src/shared/javaModel.ts';

parentPort?.on('message', (source: string) => parentPort?.postMessage(modelJava(parse, source)));

// Warmed up (the first parse builds the parser), so the time limit counts parsing only.
parse('class A {}');
parentPort?.postMessage('ready');
