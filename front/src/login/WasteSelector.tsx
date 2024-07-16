import React from "react";
import "rc-tree/assets/index.css";
import { Link } from "react-router-dom";
import WasteTree from "../Apps/common/Components/search/WasteTree";
import routes from "../Apps/routes";

export default function WasteSelector() {
  return (
    <div className="container">
      <h2>Sélection des codes déchets autorisés</h2>
      <WasteTree checkable={true} />

      <Link to={routes.signup.activation} className="button secondary">
        Ignorer
      </Link>
      <Link to={routes.signup.activation} className="btn btn--primary">
        Valider
      </Link>
    </div>
  );
}
