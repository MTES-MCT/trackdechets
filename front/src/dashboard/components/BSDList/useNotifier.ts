import { QueryBsdsArgs } from "@td/codegen-ui";
import { useState, useEffect } from "react";

const host = import.meta.env.VITE_NOTIFIER_ENDPOINT;

export function useNotifier(
  siret: string,
  callback: (variables?: QueryBsdsArgs | undefined) => void
) {
  if (!callback) {
    throw new Error("Cannot call useNotifier without callback");
  }

  const [source, setSource] = useState<EventSource | undefined>();

  useEffect(() => {
    const eventSource = new EventSource(`${host}/updates/${siret}`);
    setSource(eventSource);

    return () => {
      setSource(undefined);
      eventSource.close();
    };
  }, [siret]);

  // Use separate effects for connection and events to avoid having to memoize the callback
  useEffect(() => {
    if (!source) {
      return;
    }

    function onUpdate() {
      callback();
    }
    source.addEventListener("open", onUpdate);
    source.addEventListener("update", onUpdate);

    return () => {
      source.removeEventListener("update", onUpdate);
    };
  }, [source, callback]);
}
