"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function showHint() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  return /Android/i.test(navigator.userAgent) && !standalone;
}

export function AndroidInstallHint() {
  const visible = useSyncExternalStore(subscribe, showHint, () => false);

  if (!visible) {
    return null;
  }

  return (
    <p className="rounded-xl bg-[oklch(0.96_0.012_80)] px-4 py-3 text-sm leading-6 text-muted-foreground">
      On Android, open Chrome’s menu and tap{" "}
      <span className="font-medium text-foreground">Add to Home screen</span> to
      use Flick like an app. In learning, swipe right for Yes and left for No.
    </p>
  );
}
