import { useEffect } from "react";

const host = import.meta.env.VITE_NOTIFIER_ENDPOINT;

export function useNotifier(siret: string, callback: () => Promise<any>) {
  useEffect(() => {
    if (!callback) {
      throw new Error("Cannot call useNotifier without callback");
    }

    const source = new EventSource(`${host}/updates/${siret}`);

    source.addEventListener("open", callback);
    source.addEventListener("message", callback);

    return () => {
      source.close();
    };
  }, [siret, callback]);
}
