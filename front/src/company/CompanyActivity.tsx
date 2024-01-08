import React from "react";
import { Installation } from "@td/codegen-ui";

type Props = { installation: Installation };

export default function CompanyActivity({ installation }: Props) {
  const rubriquesInActivity = installation.rubriques
    ? installation.rubriques.filter(r => r.etatActivite === "En fonct.")
    : [];

  const rubriquesSorted = [...rubriquesInActivity].sort((r1, r2) => {
    if (r1.rubrique < r2.rubrique) return -1;
    else if (r1.rubrique > r2.rubrique) return 1;
    return 0;
  });

  const categoryLabel: { [key: string]: string } = {
    COLLECTOR: "Installation de tri transit regroupement",
    WASTE_CENTER:
      "Installation de collecte de déchets apportés par le producteur initial",
    WASTE_VEHICLES:
      "Installation de traitement de VHU (casse automobile et/ou broyeur agréé)",
    WASTEPROCESSOR: "Installation de traitement"
  };

  return (
    <div className="columns">
      <div className="box">
        <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>Activité</p>

        {installation.urlFiche && installation.codeS3ic && (
          <p>
            Installation classée pour la protection de l'environnement{" "}
            <a href={installation.urlFiche}>n°{installation.codeS3ic}</a>
          </p>
        )}

        {[...new Set(rubriquesSorted.map(r => r.category))]
          .filter(category => !!category)
          .map((category, idx) => {
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
                <th>Régime autorisé</th>
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
                    <td>{rubrique.regimeAutorise}</td>
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
