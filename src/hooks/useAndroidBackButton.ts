import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

/**
 * Handles the Android hardware back button inside the Capacitor WebView.
 * - If the in-app history has a previous page, navigate back within the app.
 * - Otherwise (on the home/root page), minimize the app instead of killing it,
 *   so the user never gets thrown out unexpectedly.
 * Runs only on native platforms; no-op in the browser.
 */
export function useAndroidBackButton() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener("backButton", () => {
      if (router.history.canGoBack()) {
        router.history.back();
      } else {
        // On the root screen: send app to background instead of closing it.
        void App.minimizeApp();
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [router]);
}
