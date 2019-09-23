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

  const categoryLabel: { [key: string]: string } = {
    COLLECTOR: "Installation de tri transit gregroupement",
    WASTE_CENTER: "Collecte de déchets apportés par le producteur initial",
    WASTE_VEHICLES: "Collecte de déchets apportés par le producteur initial",
    WASTEPROCESSOR: "Installation de traitement"
  };

  return (
    <div className="columns">
      <div className="box">
        <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>Activité</p>
        <p>
          Installation classée pour la protection de l'environnement{" "}
          <a href={installation.urlFiche}>n°{installation.codeS3ic}</a>
        </p>

        {[...new Set(installation.rubriques.map((r: Rubrique) => r.category))]
          .filter(category => category !== null)
          .map((category, idx) => {
            console.log(category);
            return (
              <div className="label" key={idx}>
                {categoryLabel[category]}
              </div>
            );
          })}

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
