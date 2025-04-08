import { createPortal } from "react-dom";

export function Portal({ children }) {
  const portalRoot = document.getElementById("portal-root");

  if (!portalRoot) {
    console.error(
      "Element portal-root is missing from the DOM. Cannot create portal."
    );
    return null;
  }

  return createPortal(children, portalRoot);
}
