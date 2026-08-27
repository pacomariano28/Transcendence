import { useLayoutEffect, useRef } from "react";

const FLIP_TRANSITION =
  "transform 550ms cubic-bezier(0.34, 1.2, 0.64, 1)";

/**
 * FLIP animation for list reordering: rows slide to their new rank when order changes.
 */
export function useFlipListAnimation(itemIds: string[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPositions = useRef<Map<string, number>>(new Map());
  const itemKey = itemIds.join("|");

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    const nextPositions = new Map<string, number>();

    children.forEach((child) => {
      const id = child.dataset.flipId;
      if (!id) return;
      nextPositions.set(id, child.offsetTop);
    });

    children.forEach((child) => {
      const id = child.dataset.flipId;
      if (!id) return;

      const prevTop = prevPositions.current.get(id);
      const nextTop = nextPositions.get(id);
      if (prevTop === undefined || nextTop === undefined) return;

      const deltaY = prevTop - nextTop;
      if (deltaY === 0) return;

      child.style.transform = `translateY(${deltaY}px)`;
      child.style.transition = "transform 0s";
      child.style.willChange = "transform";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          child.style.transition = FLIP_TRANSITION;
          child.style.transform = "";

          const cleanup = () => {
            child.style.transition = "";
            child.style.willChange = "";
            child.removeEventListener("transitionend", cleanup);
          };

          child.addEventListener("transitionend", cleanup);
        });
      });
    });

    prevPositions.current = nextPositions;
  }, [itemKey]);

  return containerRef;
}
