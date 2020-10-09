import React, { useState, useEffect } from "react";

import styles from "./SlipsHeader.module.scss";
import { FaTimesCircle } from "react-icons/fa";
import { useRouteMatch } from "react-router-dom";

const Crumb = () => {
  const draft = useRouteMatch("/dashboard/:siret/slips/drafts");
  const act = useRouteMatch("/dashboard/:siret/slips/act");
  const follow = useRouteMatch("/dashboard/:siret/slips/follow");
  const history = useRouteMatch("/dashboard/:siret/slips/history");
  const detail = useRouteMatch("/dashboard/:siret/slips/view/:id");

  return (
    <span>
      {"> "}
      {draft && "Brouillons"}
      {act && "Pour Action"}
      {follow && "Suivi"}
      {history && "Archives"}
      {detail && "Aperçu"}
    </span>
  );
};
export default function SlipsHeader() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const warningBannerShown = window.localStorage.getItem("td-warningbanner");
    if (!warningBannerShown) {
      setIsOpen(true);
    }
  }, []);
  return (
    <div className={styles.slipsHeader}>
      <div>
        <div className="title">
          <h2 className="h3 tw-mb-4">
            Mes Bordereaux <Crumb />
          </h2>
        </div>
      </div>
      {isOpen && (
        <div className="notification warning tw-flex tw-items-center">
          <p>
            Actuellement, Trackdéchets ne permet pas de prendre en compte les
            déchets d'amiante, les DASRI et les Fluides frigorigènes, ainsi que
            l'annexe 3 (Spécifique Véhicules Hors d'Usage) et le multimodal.
            Merci de votre compréhension
          </p>
          <button
            aria-label="Fermer"
            className="tw-border-none tw-bg-transparent"
            onClick={() => {
              window.localStorage.setItem("td-warningbanner", "HIDDEN");
              setIsOpen(false);
            }}
          >
            <FaTimesCircle className="tw-text-2xl tw-ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
