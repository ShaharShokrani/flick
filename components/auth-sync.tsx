"use client";

import { useEffect } from "react";

import { useSession } from "@/lib/auth-client";
import { enableCloudSync } from "@/lib/deck-store";

export function AuthSync() {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }
    void enableCloudSync(session?.user?.id ?? null);
  }, [isPending, session?.user?.id]);

  return null;
}
