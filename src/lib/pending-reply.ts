const KEY = "cyrano:pending-reply-images";

/** Stash screenshots from the home screen so Help Me Reply can pick them up. */
export function setPendingReplyImages(images: string[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(images));
  } catch {
    /* noop */
  }
}

export function takePendingReplyImages(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === "string") as string[]) : [];
  } catch {
    return [];
  }
}
