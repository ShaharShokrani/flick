"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type SwipeDirection = "left" | "right";

type UseCardSwipeOptions = {
  enabled?: boolean;
  threshold?: number;
  onTap?: () => void;
  onSwipe?: (direction: SwipeDirection) => void;
};

export function useCardSwipe({
  enabled = true,
  threshold = 88,
  onTap,
  onSwipe,
}: UseCardSwipeOptions) {
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState<SwipeDirection | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  function reset() {
    start.current = null;
    moved.current = false;
    setOffset(0);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!enabled || leaving || event.button !== 0) {
      return;
    }
    start.current = { x: event.clientX, y: event.clientY };
    moved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!start.current || leaving) {
      return;
    }
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      moved.current = true;
      event.preventDefault();
    }
    if (moved.current) {
      setOffset(dx);
    }
  }

  function finish(direction: SwipeDirection) {
    setLeaving(direction);
    setOffset(direction === "right" ? 480 : -480);
    window.setTimeout(() => {
      onSwipe?.(direction);
      setLeaving(null);
      setOffset(0);
    }, 220);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (!start.current || leaving) {
      return;
    }
    const dx = event.clientX - start.current.x;
    if (!moved.current || Math.abs(dx) < 12) {
      reset();
      onTap?.();
      return;
    }
    if (Math.abs(dx) >= threshold) {
      finish(dx > 0 ? "right" : "left");
      start.current = null;
      moved.current = false;
      return;
    }
    reset();
  }

  function onPointerCancel() {
    if (!leaving) {
      reset();
    }
  }

  const decision: SwipeDirection | null =
    leaving ??
    (offset > threshold ? "right" : offset < -threshold ? "left" : null);

  return {
    offset,
    leaving,
    decision,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
