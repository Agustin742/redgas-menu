"use client";

import { useEffect, useState } from "react";
import { createUploadTracker } from "./unsaved-upload";

/**
 * Keeps track of an image uploaded in this form session and discards it unless
 * the form saves it: when another upload replaces it, when the component
 * unmounts (Cancelar, in-app navigation) and when the page is closed.
 * Call `markSaved()` after the entity is stored.
 */
export function useUnsavedUpload() {
  const [tracker] = useState(createUploadTracker);

  useEffect(() => {
    // A page kept in the back/forward cache can be restored, so it keeps its upload.
    const onPageHide = (event: PageTransitionEvent) => {
      if (!event.persisted) tracker.discard();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      tracker.discard();
    };
  }, [tracker]);

  return tracker;
}
