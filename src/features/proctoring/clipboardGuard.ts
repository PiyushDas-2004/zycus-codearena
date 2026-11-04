/**
 * Blocks pasting into the test (editor, text fields, anywhere), copying/cutting content out of it,
 * drag-and-drop and the context menu. Listeners run in the capture phase on window, so they see
 * every event before Monaco or React and can cancel it. The async Clipboard API is disabled too.
 *
 * Internal clipboard (optional): copy/cut inside the editor or a text field goes to an in-memory buffer
 * instead of the system clipboard, and paste inserts that buffer, so candidates can move their own
 * code around while nothing from outside can come in and nothing can leave.
 */
export interface GuardedEditor {
  /** Root element of the code editor, to tell editor events from the rest of the page. */
  getDomNode(): HTMLElement | null;
  getSelectedText(): string;
  /** Inserts text at the cursor(s), replacing the selection; marked as an app edit. */
  insertText(text: string): void;
  deleteSelection(): void;
}

export type ClipboardIncident =
  'paste_attempt' | 'copy_attempt' | 'cut_attempt' | 'drop_attempt' | 'context_menu';

export interface ClipboardGuardOptions {
  blockPaste: boolean;
  blockCopy: boolean;
  blockDrop: boolean;
  blockContextMenu: boolean;
  allowInternalClipboard: boolean;
  getEditor: () => GuardedEditor | null;
  onBlocked: (type: ClipboardIncident, details: Record<string, unknown>) => void;
}

type TextField = HTMLTextAreaElement | HTMLInputElement;
const PASTE_INPUT_TYPES = /^insertFrom(Paste|PasteAsQuotation|Drop|Yank)$/;

function asTextField(t: EventTarget | null): TextField | null {
  if (t instanceof HTMLTextAreaElement) return t;
  if (t instanceof HTMLInputElement && /^(text|search|email|url|tel|password)$/.test(t.type)) return t;
  return null;
}

const stop = (e: Event) => {
  e.preventDefault();
  e.stopImmediatePropagation();
};

export function installClipboardGuard(o: ClipboardGuardOptions): () => void {
  let buffer = '';

  const editorFor = (t: EventTarget | null): GuardedEditor | null => {
    const editor = o.getEditor();
    const dom = editor?.getDomNode();
    return editor && dom && t instanceof Node && dom.contains(t) ? editor : null;
  };
  const where = (editor: GuardedEditor | null, field: TextField | null) =>
    editor ? 'editor' : field ? 'text_field' : 'page';

  const onCopyOrCut = (e: ClipboardEvent) => {
    const cut = e.type === 'cut';
    const editor = editorFor(e.target);
    const field = editor ? null : asTextField(e.target);
    if (o.allowInternalClipboard && (editor || field)) {
      const text = editor
        ? editor.getSelectedText()
        : (field?.value.slice(field.selectionStart ?? 0, field.selectionEnd ?? 0) ?? '');
      if (text) buffer = text;
      if (o.blockCopy) {
        stop(e); // keep it off the system clipboard
        if (cut && text) {
          if (editor) editor.deleteSelection();
          else document.execCommand('delete');
        }
      }
      return;
    }
    if (!o.blockCopy) return;
    stop(e);
    o.onBlocked(cut ? 'cut_attempt' : 'copy_attempt', { where: where(editor, field) });
  };

  const onPaste = (e: ClipboardEvent) => {
    if (!o.blockPaste) return;
    stop(e);
    const editor = editorFor(e.target);
    const field = editor ? null : asTextField(e.target);
    if (o.allowInternalClipboard && buffer && (editor || field)) {
      if (editor) editor.insertText(buffer);
      else document.execCommand('insertText', false, buffer);
      return;
    }
    // Never send the clipboard contents themselves — only their size.
    const chars = e.clipboardData?.getData('text/plain').length ?? 0;
    o.onBlocked('paste_attempt', { where: where(editor, field), chars });
  };

  const onBeforeInput = (e: InputEvent) => {
    if (!PASTE_INPUT_TYPES.test(e.inputType)) return;
    const drop = e.inputType === 'insertFromDrop';
    if (drop ? !o.blockDrop : !o.blockPaste) return;
    stop(e);
    o.onBlocked(drop ? 'drop_attempt' : 'paste_attempt', { where: 'input', via: e.inputType });
  };

  const onDragOver = (e: DragEvent) => {
    if (!o.blockDrop) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
  };
  const onDragEnter = (e: DragEvent) => {
    // Something dragged in from outside the page (another app or window).
    if (o.blockDrop && e.relatedTarget === null) {
      o.onBlocked('drop_attempt', { types: [...(e.dataTransfer?.types ?? [])].slice(0, 5) });
    }
  };
  const onDrop = (e: DragEvent) => {
    if (!o.blockDrop) return;
    stop(e);
  };
  const onDragStart = (e: DragEvent) => {
    if (o.blockCopy) e.preventDefault(); // dragging question text out of the page
  };
  const onContextMenu = (e: MouseEvent) => {
    if (!o.blockContextMenu) return;
    e.preventDefault();
    o.onBlocked('context_menu', { where: where(editorFor(e.target), asTextField(e.target)) });
  };

  const listeners: [string, EventListener][] = [
    ['copy', onCopyOrCut as EventListener],
    ['cut', onCopyOrCut as EventListener],
    ['paste', onPaste as EventListener],
    ['beforeinput', onBeforeInput as EventListener],
    ['dragover', onDragOver as EventListener],
    ['dragenter', onDragEnter as EventListener],
    ['drop', onDrop as EventListener],
    ['dragstart', onDragStart as EventListener],
    ['contextmenu', onContextMenu as EventListener],
  ];
  for (const [type, fn] of listeners) window.addEventListener(type, fn, true);

  // The async Clipboard API bypasses paste/copy events; disable the relevant halves of it.
  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
  const patched: string[] = [];
  const deny = () =>
    Promise.reject(
      new DOMException('Clipboard access is disabled during the assessment.', 'NotAllowedError'),
    );
  if (clipboard) {
    const names = [
      ...(o.blockPaste ? ['read', 'readText'] : []),
      ...(o.blockCopy ? ['write', 'writeText'] : []),
    ];
    for (const name of names) {
      try {
        Object.defineProperty(clipboard, name, { configurable: true, value: deny });
        patched.push(name);
      } catch {
        /* non-configurable in this browser */
      }
    }
  }

  return () => {
    for (const [type, fn] of listeners) window.removeEventListener(type, fn, true);
    if (clipboard) for (const name of patched) Reflect.deleteProperty(clipboard, name);
    buffer = '';
  };
}
