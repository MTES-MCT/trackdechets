import { useEffect, useRef } from "react";

const useOnClickOutsideRefTarget = ({ onClickOutside }) => {
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Close dropdown when click outside of target
    const clickEvent = document.addEventListener(
      "mousedown",
      (e: MouseEvent) => {
        if (targetRef && !targetRef?.current?.contains(e.target as Node)) {
          onClickOutside();
        }
      }
    );
    return () => {
      document.removeEventListener("mousedown", clickEvent!);
    };
  }, [onClickOutside]);
  return { targetRef };
};

export default useOnClickOutsideRefTarget;
