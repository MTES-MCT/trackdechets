import { useRef, useEffect } from "react";

// To skip effect on first render
export default function useDidUpdateEffect(
  fn: React.EffectCallback,
  inputs?: any[]
) {
  const didMountRef = useRef(false);

  useEffect(() => {
    if (didMountRef.current) fn();
    else didMountRef.current = true;
  }, inputs);
}
