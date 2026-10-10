/**
 * The system check's "Only one display connected" row. When the template blocks extended desktops,
 * a browser that can't tell (no `screen.isExtended`, e.g. a spoofed user agent) fails too: start
 * is allowed only when one display is confirmed.
 */
export function displayCheck(
  extended: boolean | null,
  required: boolean,
): { status: 'pass' | 'fail' | 'warn'; detail: string } {
  if (extended === false) return { status: 'pass', detail: 'One display detected' };
  if (extended === true) {
    return {
      status: 'fail',
      detail:
        'More than one display is connected. Disconnect the extra monitor (or press Windows key + P and choose "PC screen only"), then run the check again.',
    };
  }
  return required
    ? {
        status: 'fail',
        detail:
          "Your browser can't confirm that only one display is connected. Use the latest Google Chrome or Microsoft Edge.",
      }
    : { status: 'warn', detail: "Your browser couldn't confirm the number of displays." };
}
