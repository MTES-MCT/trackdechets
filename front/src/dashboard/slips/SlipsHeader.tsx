import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "./SlipsHeader.scss";
import { FaTimesCircle } from "react-icons/fa";
import { useRouteMatch } from "react-router-dom";

const Crumb = () => {
  const draft = useRouteMatch("/dashboard/:siret/slips/drafts");
  const act = useRouteMatch("/dashboard/:siret/slips/act");
  const follow = useRouteMatch("/dashboard/:siret/slips/follow");
  const history = useRouteMatch("/dashboard/:siret/slips/history");
  return (
    <span>
      {"> "}
      {draft !== null ? "Brouillons" : null}
      {act !== null ? "Pour Action" : null}
      {follow !== null ? "Suivi" : null}
      {history !== null ? "Archivé" : null}
    </span>
  );
};
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
    <div className="slips-header">
      <div className="header-content">
        <div className="title">
          <h2>
            Mes Bordereaux <Crumb />
          </h2>
        </div>

        <div className="buttons">
          <Link to="/form?redirectTo=${siret}">
            <button className="btn btn--primary">Créer un bordereau</button>
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
