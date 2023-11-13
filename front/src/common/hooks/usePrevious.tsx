import { useEffect, useRef } from "react";

/**
 * Convenience hook to keep track of a prop, for instance.
 *
 * ex:
 * const myComp = ({ foo }) => {
 *   const prevFoo = usePrevious(foo);
 *
 *   useEffect(() => {
 *     if(prevFoo === "bar" && foo === "baz") {
 *       doStuff();
 *     }
 *   }, [foo, prevFoo])
 * }
 */
const usePrevious = value => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
};

export default usePrevious;
