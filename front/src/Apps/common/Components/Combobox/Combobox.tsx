import React, { useEffect, type ReactNode } from "react";
import { Portal } from "../Portal/Portal";
import useOnClickOutsideRefTarget from "../../hooks/useOnClickOutsideRefTarget";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  triggerRef?: React.RefObject<HTMLElement>;
  children: ReactNode | ((props: { close: () => void }) => ReactNode);
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  autoWidth?: boolean;
};

/*
  If you want the dropdown to be the same width as the parent element (select, input,...)
  you only need to pass the parent ref to the Combobox.
  If you need the dropdown to be the width of another element,
  you can separate the trigger element and the parent element.
  The trigger element will be used to align the bottom of the dropdown (it can be the button that opens it for example),
  and the parent element will be used to set the width and horizontal position (it can be a div that takes the whole width of the page for example).
  In this case, you need to pass both the parent and the trigger refs to the Combobox.
*/

export function ComboBox({
  parentRef,
  triggerRef,
  children,
  isOpen,
  onOpenChange,
  autoWidth
}: Props) {
  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: (e: MouseEvent | TouchEvent) => {
      if (triggerRef) {
        if (triggerRef.current?.contains(e.target as Node)) {
          e.preventDefault();
          return;
        }
      } else if (parentRef.current?.contains(e.target as Node)) {
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
    const triggerRect = triggerRef?.current?.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - (triggerRect ?? parentRect).bottom;
    const spaceAbove = (triggerRect ?? parentRect).top;

    const dropdownLeft = parentRect.left + window.scrollX;
    const dropdownWidth = parentRect.width;

    targetRef.current.style.left = `${dropdownLeft}px`;
    if (!autoWidth) {
      targetRef.current.style.width = `${dropdownWidth}px`;
    }

    // Calculate max height based on available space and substract 20 for good measure
    const maxHeight = Math.max(spaceBelow, spaceAbove) - 20;
    targetRef.current.style.maxHeight = `${maxHeight}px`;

    if (maxHeight > spaceBelow && maxHeight <= spaceAbove) {
      // Calculate bottom position as viewport height minus parent's top position
      targetRef.current.style.bottom = `${
        viewportHeight - (triggerRect ?? parentRect).top + window.scrollY
      }px`;
    } else {
      targetRef.current.style.top = `${
        (triggerRect ?? parentRect).bottom + window.scrollY
      }px`;
    }
  }, [isOpen, parentRef, targetRef, triggerRef]);

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
          overflow: "auto",
          height: "auto"
        }}
      >
        {typeof children === "function"
          ? children({ close: () => onOpenChange(false) })
          : children}
      </div>
    </Portal>
  );
}
