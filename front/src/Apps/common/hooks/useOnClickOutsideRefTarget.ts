import { useEffect, useRef } from "react";

const useOnClickOutsideRefTarget = ({
  onClickOutside
}: {
  onClickOutside: (e: MouseEvent | TouchEvent) => void;
}) => {
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Close dropdown when click outside of target
    const clickEvent = document.addEventListener(
      "mousedown",
      (e: MouseEvent) => {
        if (targetRef && !targetRef?.current?.contains(e.target as Node)) {
          onClickOutside(e);
        }
      }
    );
    const touchEvent = document.addEventListener(
      "touchend",
      (e: TouchEvent) => {
        if (targetRef && !targetRef?.current?.contains(e.target as Node)) {
          onClickOutside(e);
        }
      }
    );
    return () => {
      document.removeEventListener("mousedown", clickEvent!);
      document.removeEventListener("touchend", touchEvent!);
    };
  }, [onClickOutside]);
  return { targetRef };
};

export default useOnClickOutsideRefTarget;
