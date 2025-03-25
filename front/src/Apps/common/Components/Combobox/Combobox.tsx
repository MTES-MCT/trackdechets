import React, { useState, useEffect, type ReactNode } from "react";
import { Portal } from "../Portal/Portal";
import useOnClickOutsideRefTarget from "../../hooks/useOnClickOutsideRefTarget";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  children: ReactNode | ((props: { close: () => void }) => ReactNode);
};

export function ComboBox({ parentRef, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setIsOpen(false)
  });

  useEffect(() => {
    function handleClick() {
      setIsOpen(open => !open);
    }
    const element = parentRef.current;
    element?.addEventListener("click", handleClick);

    return () => {
      element?.removeEventListener("click", handleClick);
    };
  }, [parentRef]);

  useEffect(() => {
    if (!isOpen || !parentRef.current || !targetRef.current) {
      return;
    }

    const parentRect = parentRef.current.getBoundingClientRect();
    const comboboxRect = targetRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const dropdownTop = parentRect.bottom + window.scrollY;
    const dropdownLeft = parentRect.left + window.scrollX;
    const dropdownWidth = parentRect.width;

    targetRef.current.style.top = `${dropdownTop}px`;
    targetRef.current.style.left = `${dropdownLeft}px`;
    targetRef.current.style.width = `${dropdownWidth}px`;

    if (dropdownTop + comboboxRect.height > viewportHeight) {
      targetRef.current.style.top = `${
        parentRect.top + window.scrollY - comboboxRect.height
      }px`;
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
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
        }}
      >
        {typeof children === "function"
          ? children({ close: () => setIsOpen(false) })
          : children}
      </div>
    </Portal>
  );
}
