import * as React from "react";
import { FilterProps } from "react-table";
import { Bsd } from "@trackdechets/codegen/src/front.gen";

const DEBOUNCE_DELAY = 500;

/**
 * This component is used for text filters.
 * It debounces updates to the table's state to avoid triggering a rerender on each keystroke.
 */
export function TextInputFilter({
  column: { filterValue = "", setFilter }
}: FilterProps<Bsd>) {
  const [value, setValue] = React.useState(filterValue);
  const timeout = React.useRef<number | null>();
  const ref = React.useRef<{ value: string; filterValue: string }>();
  ref.current = { value, filterValue };

  // if filterValue was changed outside of this component,
  // the input's value must be updated accordingly
  React.useEffect(() => {
    // we don't want to include value in the dependency array
    // as the only change we care about is from filterValue
    // we still want the latest value of value, though
    if (ref.current!.value === filterValue) {
      return;
    }

    setValue(filterValue);
  }, [filterValue]);

  // debounce the call to setFilter when value changes
  React.useEffect(() => {
    // we don't want to include filterValue in the dependency array
    // as the only change we care about is from value
    // we still want the latest value of filterValue, though
    if (value === ref.current!.filterValue) {
      return;
    }

    timeout.current = window.setTimeout(() => {
      setFilter(value);
      timeout.current = null;
    }, DEBOUNCE_DELAY);

    return () => {
      if (timeout.current) {
        window.clearTimeout(timeout.current);
        timeout.current = null;
      }
    };
  }, [
    value,
    // note: setFilter is not well memoized by react-table
    //       it's not so bad because exit early when values are in sync anyway
    setFilter
  ]);

  return (
    <input
      type="text"
      className="td-input"
      onChange={event => setValue(event.target.value)}
      value={value}
      placeholder="Filtrer..."
      style={{ marginTop: "0.5rem" }}
    />
  );
}
