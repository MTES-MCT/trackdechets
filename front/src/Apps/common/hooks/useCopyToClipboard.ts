import { useCallback, useState } from "react";

export function useCopyToClipboard(resetInterval = 2000) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(
    async ({
      text,
      target = document.body
    }: {
      text: string;
      target: HTMLElement;
    }) => {
      if (!text) return false;

      let success = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          success = true;
        } catch (err) {
          console.warn("Clipboard API failed:", err);
        }
      }

      // Fallback for insecure contexts
      if (!success) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        // Prevent keyboard from showing on mobile
        textarea.setAttribute("readonly", "");

        // Reset all inherited styles to prevent CSS interference
        textarea.style.all = "unset";

        // Apply minimal required styles
        textarea.style.contain = "strict";
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        textarea.style.width = "2em";
        textarea.style.height = "2em";
        textarea.style.padding = "0";
        textarea.style.border = "none";
        textarea.style.outline = "none";
        textarea.style.boxShadow = "none";
        textarea.style.background = "transparent";
        textarea.style.fontSize = "12pt"; // Prevent zooming on iOS
        textarea.style.whiteSpace = "pre"; // Preserve whitespace (tabs, spaces, newlines)
        target.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.selectionStart = 0;
        textarea.selectionEnd = text.length;
        try {
          success = document.execCommand("copy");
        } catch (err) {
          console.error("Fallback copy failed:", err);
          success = false;
        } finally {
          target.removeChild(textarea);
        }
      }

      setIsCopied(success);
      if (success && resetInterval > 0) {
        setTimeout(() => setIsCopied(false), resetInterval);
      }

      return success;
    },
    [resetInterval]
  );

  return { copy, isCopied };
}
