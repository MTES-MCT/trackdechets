import * as React from "react";
import * as localStorage from "local-storage";

export function usePersistedState<T>(
  key: string,
  deserialize: (value: any) => T
) {
  const [value, setValue] = React.useState<T>(() =>
    deserialize(localStorage.get(key))
  );

  React.useEffect(() => {
    if (value == null) {
      localStorage.remove(key);
    } else {
      localStorage.set(key, value);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
