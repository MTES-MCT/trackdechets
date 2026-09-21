import { useEffect } from "react";

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

const CRISP_SCRIPT_ID = "crisp-script";
const CRISP_WEBSITE_ID = "81e9b326-1c34-427a-b5ab-2e004ffa180a";

const CRISP_SELECTOR = ".crisp-client";
const CRISP_BOTTOM_OFFSET = 80;

export const CRISP_CHAT_OPENED_EVENT = "crisp:chat-opened";
export const CRISP_CHAT_CLOSED_EVENT = "crisp:chat-closed";

/**
 * React Aria makes elements outside an opened modal inert.
 *
 * Crisp is rendered outside Trackdéchets modal portals but must remain
 * interactive so users can contact support while a modal is open.
 *
 * The observer is intentionally limited to Crisp and its `inert` attribute.
 */
function keepCrispInteractive(): () => void {
  let crispObserver: MutationObserver | undefined;
  let observedCrisp: HTMLElement | undefined;

  const observeCrisp = () => {
    const crisp = document.querySelector<HTMLElement>(CRISP_SELECTOR);

    if (!crisp || crisp === observedCrisp) {
      return;
    }

    crispObserver?.disconnect();

    observedCrisp = crisp;

    const removeInert = () => {
      if (crisp.inert) {
        crisp.inert = false;
      }
    };

    removeInert();

    crispObserver = new MutationObserver(removeInert);

    crispObserver.observe(crisp, {
      attributes: true,
      attributeFilter: ["inert"]
    });
  };

  observeCrisp();

  // Crisp injects its DOM asynchronously.
  const documentObserver = new MutationObserver(observeCrisp);

  documentObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  return () => {
    documentObserver.disconnect();
    crispObserver?.disconnect();
  };
}

export function useCrisp() {
  useEffect(() => {
    window.$crisp = window.$crisp || [];

    /**
     * Keep Crisp on the right while leaving enough room for fixed
     * Trackdéchets actions such as signature buttons.
     */
    window.$crisp.push([
      "config",
      "position:offset",
      [["bottom", CRISP_BOTTOM_OFFSET]]
    ]);

    /**
     * Forward Crisp lifecycle events as application events.
     *
     * Modal.tsx can therefore pause its focus trap while Crisp owns the focus
     * without introducing a direct dependency on Crisp's SDK.
     */
    const handleChatOpened = () => {
      window.dispatchEvent(new Event(CRISP_CHAT_OPENED_EVENT));
    };

    const handleChatClosed = () => {
      window.dispatchEvent(new Event(CRISP_CHAT_CLOSED_EVENT));
    };

    window.$crisp.push(["on", "chat:opened", handleChatOpened]);
    window.$crisp.push(["on", "chat:closed", handleChatClosed]);

    const stopKeepingCrispInteractive = keepCrispInteractive();

    if (document.getElementById(CRISP_SCRIPT_ID)) {
      window.$crisp.push(["do", "chat:show"]);

      return () => {
        stopKeepingCrispInteractive();

        window.$crisp?.push(["off", "chat:opened"]);
        window.$crisp?.push(["off", "chat:closed"]);
      };
    }

    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    const script = document.createElement("script"); // NOSONAR
    script.id = CRISP_SCRIPT_ID;
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;

    document.head.appendChild(script);

    return () => {
      stopKeepingCrispInteractive();

      window.$crisp?.push(["off", "chat:opened"]);
      window.$crisp?.push(["off", "chat:closed"]);
    };
  }, []);
}
