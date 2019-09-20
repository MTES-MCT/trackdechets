import React from "react";

import { Installation, Rubrique } from "./companyTypes";

type Props = {
  installation: Installation;
};

export default function CompanyActivity({ installation }: Props) {
  const rubriquesSorted = [...installation.rubriques].sort((r1, r2) => {
    if (r1.rubrique < r2.rubrique) return -1;
    else if (r1.rubrique > r2.rubrique) return 1;
    return 0;
  });

  return (
    <div className="columns">
      <div className="box">
        <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>Activité</p>
        <p>
          Installation classée pour la protection de l'environnement{" "}
          <a href={installation.urlFiche}>n°{installation.codeS3ic}</a>
        </p>

        {[
          ...new Set(installation.rubriques.map((r: Rubrique) => r.category))
        ].map((category, idx) => {
          switch (category) {
            case "COLLECTOR":
              return (
                <div className="label" key={idx}>
                  Installation de tri transit regroupement
                </div>
              );
            case "WASTE_CENTER":
              return (
                <div className="label" key={idx}>
                  Collecte de déchets apportés par le producteur initial
                </div>
              );
            case "WASTE_VEHICLES":
              return (
                <div className="label" key={idx}>
                  Véhicules hors d'usage
                </div>
              );
            case "WASTEPROCESSOR":
              return (
                <div className="label" key={idx}>
                  Installation de traitement
                </div>
              );
          }
        })}

        {/* <div>
          <input
            className="table__filter"
            type="text"
            placeholder="Filtrer les rubriques"
          />
        </div> */}
        <div className="table__container">
          <table className="table">
            <thead>
              <tr>
                <th>Rubrique</th>
                <th>Alinéa</th>
                <th>Activité</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {rubriquesSorted.map((rubrique, idx) => {
                return (
                  <tr key={idx}>
                    <td>{rubrique.rubrique}</td>
                    <td>{rubrique.alinea}</td>
                    <td>{rubrique.activite}</td>
                    <td>
                      {rubrique.volume} {rubrique.unite}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
