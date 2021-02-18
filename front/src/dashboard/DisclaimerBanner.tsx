import * as React from "react";
import { IconClose } from "common/components/Icons";

const DISCLAIMER_BANNER_KEY = "disclaimer_banner";

export default function DisclaimerBanner() {
  const [isDismissed, setIsDismissed] = React.useState(() => {
    // FIXME: not cross-environment proof (e.g SSR)
    // FIXME: would throw an error if localStorage doens't work
    return Boolean(window.localStorage.getItem(DISCLAIMER_BANNER_KEY));
  });

  React.useEffect(() => {
    if (isDismissed) {
      // FIXME: would throw an error if localStorage doens't work
      window.localStorage.setItem(
        DISCLAIMER_BANNER_KEY,
        new Date().toISOString()
      );
    } else {
      // FIXME: would throw an error if localStorage doens't work
      window.localStorage.removeItem(DISCLAIMER_BANNER_KEY);
    }
  }, [isDismissed]);

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className="notification warning tw-flex tw-items-center"
      style={{ margin: "1rem" }}
    >
      <p>
        Actuellement, Trackdéchets ne permet pas de prendre en compte les
        déchets d'amiante, les DASRI et les Fluides frigorigènes, ainsi que
        l'annexe 3 (Spécifique Véhicules Hors d'Usage) et le multimodal. Merci
        de votre compréhension
      </p>
      <button
        type="button"
        aria-label="Fermer"
        className="tw-border-none tw-bg-transparent"
        onClick={() => {
          setIsDismissed(true);
        }}
      >
        <IconClose className="tw-text-2xl tw-ml-1" />
      </button>
    </div>
  );
}
