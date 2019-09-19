import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./SlipsHeader.scss";
import { trackEvent } from "../../tracker";

export default function SlipsHeader() {
  return (
    <div className="SlipsHeader">
      <div className="header-content">
        <div className="title">
          <h2>Mes bordereaux</h2>
        </div>

        <div className="buttons">
          <Link to="/form">
            <button className="button secondary">Créer un bordereau</button>
          </Link>
        </div>
      </div>
      <div className="notification warning">
        Dans un premier temps, Trackdéchets ne permet pas de prendre en compte
        les déchets Amiante, DASRI, Fluides frigorigènes. Les annexes 1 et 3 ne
        sont actuellement pas prises en compte, ainsi que le multimodal. Merci
        de votre compréhension.
      </div>
    </div>
  );
}
