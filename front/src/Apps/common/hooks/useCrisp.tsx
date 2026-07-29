import { useEffect } from "react";

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

const CRISP_SCRIPT_ID = "crisp-script";
const CRISP_WEBSITE_ID = "81e9b326-1c34-427a-b5ab-2e004ffa180a";

export function useCrisp() {
  useEffect(() => {
    const isProdOrSandbox =
      import.meta.env.VITE_ENV_NAME === "production" ||
      import.meta.env.VITE_ENV_NAME === "sandbox";

    if (isProdOrSandbox) {
      return;
    }

    if (document.getElementById(CRISP_SCRIPT_ID)) {
      window.$crisp?.push(["do", "chat:show"]);
      return;
    }

    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    const script = document.createElement("script"); // NOSONAR
    script.id = CRISP_SCRIPT_ID;
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;

    document.head.appendChild(script);
  }, []);
}
