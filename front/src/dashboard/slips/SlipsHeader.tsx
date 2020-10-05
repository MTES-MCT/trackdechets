import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "./SlipsHeader.scss";
import { FaTimesCircle } from "react-icons/fa";

export default function SlipsHeader() {
  const { siret } = useParams<{ siret: string }>();
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const warningBannerShown = window.localStorage.getItem("td-warningbanner");
    if (!warningBannerShown) {
      setIsOpen(true);
    }
  }, []);
  return (
    <div className="SlipsHeader">
      <div className="header-content">
        <div className="title">
          <h2>Mes bordereaux</h2>
        </div>

        <div className="buttons">
          <Link to={`/form?redirectTo=${siret}`}>
            <button className="button primary">Créer un bordereau</button>
          </Link>
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
