import React, { useEffect, type ReactNode } from "react";
import { Portal } from "../Portal/Portal";
import useOnClickOutsideRefTarget from "../../hooks/useOnClickOutsideRefTarget";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  children: ReactNode | ((props: { close: () => void }) => ReactNode);
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function ComboBox({ parentRef, children, isOpen, onOpenChange }: Props) {
  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: (e: MouseEvent | TouchEvent) => {
      if (parentRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        return;
      }
      onOpenChange(false);
    }
  });

  useEffect(() => {
    if (!isOpen || !parentRef.current || !targetRef.current) {
      return;
    }

    const parentRect = parentRef.current.getBoundingClientRect();
    const comboboxRect = targetRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - parentRect.bottom;
    const spaceAbove = parentRect.top;

    const dropdownLeft = parentRect.left + window.scrollX;
    const dropdownWidth = parentRect.width;

    targetRef.current.style.left = `${dropdownLeft}px`;
    targetRef.current.style.width = `${dropdownWidth}px`;

    // Calculate max height based on available space
    const maxHeight = Math.max(spaceBelow, spaceAbove);
    targetRef.current.style.maxHeight = `${maxHeight}px`;

    if (comboboxRect.height > spaceBelow && comboboxRect.height <= spaceAbove) {
      targetRef.current.style.top = `${
        parentRect.top + window.scrollY - comboboxRect.height
      }px`;
    } else {
      targetRef.current.style.top = `${parentRect.bottom + window.scrollY}px`;
    }
  }, [isOpen, parentRef, targetRef]);

  if (!isOpen) {
    return null;
  }

  return (
    <Portal>
      <div
        ref={targetRef as React.RefObject<HTMLDivElement>}
        style={{
          position: "absolute",
          backgroundColor: "white",
          border: "1px solid #ccc",
          zIndex: 1000,
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          height: `${Math.max(
            window.innerHeight -
              (parentRef.current?.getBoundingClientRect().bottom ?? 0),
            parentRef.current?.getBoundingClientRect().top ?? 0
          )}px`
        }}
      >
        {typeof children === "function"
          ? children({ close: () => onOpenChange(false) })
          : children}
      </div>
    </Portal>
  );
}
