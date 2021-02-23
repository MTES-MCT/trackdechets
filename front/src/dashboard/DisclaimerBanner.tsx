import * as React from "react";
import { IconClose } from "common/components/Icons";
import { usePersistedState } from "common/hooks/usePersistedState";

const DISCLAIMER_BANNER_KEY = "td-warningbanner";

export function DisclaimerBanner() {
  const [isDismissed, setIsDismissed] = usePersistedState<boolean>(
    DISCLAIMER_BANNER_KEY,
    value => Boolean(value)
  );

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
        aria-label="Fermer"
        className="tw-border-none tw-bg-transparent"
        onClick={() => setIsDismissed(true)}
      >
        <IconClose className="tw-text-2xl tw-ml-1" />
      </button>
    </div>
  );
}
