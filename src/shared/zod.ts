/**
 * The one place zod is imported. Jitless mode: zod otherwise probes whether `new Function` is
 * allowed (to JIT-compile schemas), which our Content Security Policy forbids and reports as a
 * violation. Validation is identical either way. Shared by the app and the Node scripts.
 */
import { z } from 'zod';

z.config({ jitless: true });

export { z };
