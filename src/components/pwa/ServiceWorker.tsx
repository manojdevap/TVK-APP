"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that makes the app installable.
 *
 * Registration is deliberately deferred until after load so it never competes with
 * the first render on a slow connection.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("[sw] registration failed", err);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
