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
    const targetElement = targetRef.current; // targetRef comes from the hook
    if (!isOpen || !parentRef.current || !targetElement) {
      return;
    }

    const parentRect = parentRef.current.getBoundingClientRect();
    const triggerRect = triggerRef?.current?.getBoundingClientRect();
    // Use trigger for vertical alignment if available, otherwise parent
    const triggerOrParentRect = triggerRect ?? parentRect;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const margin = 10; // Viewport margin

    // --- Vertical Positioning ---
    const spaceBelow = viewportHeight - triggerOrParentRect.bottom;
    const spaceAbove = triggerOrParentRect.top;
    // Consider a minimum height for the dropdown before flipping
    const minDropdownHeightThreshold = 50;

    let positionAbove = false;
    // Decide to position above if space below is insufficient (< threshold + margin)
    // AND there is more space above than below.
    if (
      spaceBelow < minDropdownHeightThreshold + margin &&
      spaceAbove > spaceBelow
    ) {
      positionAbove = true;
    }

    // Reset potentially conflicting styles before applying new ones
    targetElement.style.top = "auto";
    targetElement.style.bottom = "auto";

    if (positionAbove) {
      // Position above the trigger/parent
      targetElement.style.bottom = `${
        viewportHeight - triggerOrParentRect.top + scrollY
      }px`;
      targetElement.style.maxHeight = `${Math.max(0, spaceAbove - margin)}px`; // Ensure non-negative
    } else {
      // Position below the trigger/parent
      targetElement.style.top = `${triggerOrParentRect.bottom + scrollY}px`;
      targetElement.style.maxHeight = `${Math.max(0, spaceBelow - margin)}px`; // Ensure non-negative
    }

    // --- Horizontal Positioning ---
    let dropdownLeft = parentRect.left + scrollX;
    let dropdownWidth = parentRect.width; // Default width for non-autoWidth

    // Reset width/maxWidth first
    targetElement.style.width = "auto";
    targetElement.style.maxWidth = "none";

    if (autoWidth) {
      // Let the browser determine the width based on content
      targetElement.style.width = "auto";
      // Set a max-width to prevent it from exceeding viewport width minus margins
      targetElement.style.maxWidth = `${viewportWidth - 2 * margin}px`;

      // For autoWidth, accurately checking overflow requires knowing the rendered width.
      // We'll estimate based on parentRect for initial placement check.
      // A ResizeObserver would be needed for perfect dynamic adjustment.
      const estimatedWidth = targetElement.offsetWidth; // Get current width after styles applied

      // Check if potential position overflows right viewport edge
      if (dropdownLeft + estimatedWidth > viewportWidth + scrollX - margin) {
        // Align right edge of dropdown with right edge of parent
        dropdownLeft = parentRect.right + scrollX - estimatedWidth;
      }
      // Ensure it doesn't overflow left viewport edge
      if (dropdownLeft < scrollX + margin) {
        dropdownLeft = scrollX + margin;
      }
    } else {
      // Fixed width based on parent
      targetElement.style.width = `${dropdownWidth}px`;

      // Check if dropdown overflows to the right viewport edge
      if (dropdownLeft + dropdownWidth > viewportWidth + scrollX - margin) {
        // Align right edge of dropdown with right edge of parent
        dropdownLeft = parentRect.right + scrollX - dropdownWidth;
      }

      // Ensure it doesn't overflow to the left viewport edge (either initially or after right-alignment)
      if (dropdownLeft < scrollX + margin) {
        dropdownLeft = scrollX + margin;
        // Optional: Adjust width if constrained by both edges
        const availableWidth = viewportWidth + scrollX - margin - dropdownLeft;
        if (dropdownWidth > availableWidth) {
          targetElement.style.width = `${Math.max(0, availableWidth)}px`; // Ensure non-negative width
        }
      }
    }

    targetElement.style.left = `${dropdownLeft}px`;
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
          overflowY: "auto", // Allow vertical scroll
          overflowX: "hidden", // Prevent horizontal scroll within dropdown
          boxSizing: "border-box" // Include padding/border in element's total width and height
        }}
      >
        {typeof children === "function"
          ? children({ close: () => onOpenChange(false) })
          : children}
      </div>
    </Portal>
  );
}
