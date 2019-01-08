import React, { useState } from "react";
import Header from "../Header";
import "./Search.scss";
import { Link } from "react-router-dom";

export default function Search() {
  const [show, setShow] = useState(false);

  const [company, setCompany] = useState("");
  const [wasteCode, setWasteCode] = useState("");

  return (
    <div className="Search section section-grey">
      <div className="container">
        <div className="panel">
          <div className="panel__header">
            <h3>Vérification d'un prestataire</h3>
            <small className="panel__header-extra">
              2018 entreprises référencées
            </small>
          </div>

          <p>
            Vous avez la possibilité de vérifier si un prestataire est autorisé
            à prendre en charge un code déchet en particulier.
          </p>

          <div className="search-box">
            <div className="search__input">
              <input
                type="text"
                placeholder="Nom ou SIRET de l'entreprise"
                value={company}
                onChange={e => setCompany(e.target.value)}
              />
              <input
                type="text"
                placeholder="Code déchet"
                value={wasteCode}
                onChange={e => setWasteCode(e.target.value)}
              />
            </div>
            <button className="button" onClick={() => setShow(!show)}>
              Vérifier
            </button>
          </div>
        </div>

        {show && (
          <div className="panel panel__approved">
            <div className="approved">
              <h3>
                L'entreprise <strong>{company}</strong> est
              </h3>
              <ul>
                <li>
                  autorisée au titre des{" "}
                  <a href="http://www.installationsclassees.developpement-durable.gouv.fr/rechercheICForm.php">
                    ICPE
                  </a>{" "}
                  à collecter et/ou traiter des déchets dangereux
                </li>
                <li>
                  capable de prendre en charge le code déchet{" "}
                  <strong>{wasteCode}</strong>
                </li>
              </ul>
              <small>
                Pour en savoir plus sur cette entreprise, accédez{" "}
                <Link to="#">à sa fiche.</Link>
              </small>
            </div>
            <div className="stamp">Valide</div>
          </div>
        )}
      </div>
    </div>
  );
}
