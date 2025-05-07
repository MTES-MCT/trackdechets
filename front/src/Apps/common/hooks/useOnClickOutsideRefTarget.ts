import { useEffect, useRef } from "react";

const useOnClickOutsideRefTarget = ({
  active,
  onClickOutside
}: {
  active?: boolean;
  onClickOutside: (e: MouseEvent | TouchEvent) => void;
}) => {
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (active === false) {
      return;
    }

    function handleClick(e: MouseEvent | TouchEvent) {
      if (targetRef && !targetRef?.current?.contains(e.target as Node)) {
        onClickOutside(e);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClickOutside, active]);
  return { targetRef };
};

export default useOnClickOutsideRefTarget;
