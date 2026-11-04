import { toast } from '@/design/components';

export async function copyText(text: string, what = 'Copied'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(what);
    return true;
  } catch {
    toast.danger('Couldn’t copy', 'Select the text and copy it with Ctrl+C.');
    return false;
  }
}
