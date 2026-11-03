/**
 * Fire-and-forget request that asks the server to delete an uploaded image
 * nobody saved. `keepalive` lets it outlive the page (unload, navigation).
 * The server ignores ids that are saved or not ours, so a stray call is safe.
 */
export function discardUpload(publicId: string) {
  try {
    void fetch("/api/admin/uploads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Best effort: an orphaned image costs storage, nothing else.
  }
}

/** Tracks the one image uploaded in this form session that has not been saved. */
export function createUploadTracker(discard: (publicId: string) => void = discardUpload) {
  let pending: string | null = null;
  return {
    /** A new upload replaces (and discards) the previous unsaved one. */
    track(publicId: string) {
      if (pending && pending !== publicId) discard(pending);
      pending = publicId;
    },
    /** The pending image is now stored on the entity: never discard it. */
    markSaved() {
      pending = null;
    },
    /** Discards the pending image, e.g. on removal, cancel or unmount. */
    discard() {
      if (!pending) return;
      const id = pending;
      pending = null;
      discard(id);
    },
    get pending() {
      return pending;
    },
  };
}
