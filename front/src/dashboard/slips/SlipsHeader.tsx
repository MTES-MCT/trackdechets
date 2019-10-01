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
        Actuellement, Trackdéchets ne permets pas de prendre en compte les
        déchets d'amiante, les DASRI et les Fluides frigorigènes, ainsi que
        l'annexe 3 (Spécifique Véhicules Hors d'Usage) et le multimodal. Merci
        de votre compréhension
      </div>
    </div>
  );
}
