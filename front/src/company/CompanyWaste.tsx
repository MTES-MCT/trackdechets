import React from "react";

import { Installation, Declaration } from "./companyTypes";

type Props = {
  installation: Installation;
};

export default function CompanyWaste({ installation }: Props) {
  const dechetsUniques = [
    ...new Set(installation.declarations.map((d: Declaration) => d.codeDechet))
  ].map((codeDechet: string) => {
    let declaration = installation.declarations.find(
      (d: Declaration) => d.codeDechet === codeDechet
    );
    const libDechet = declaration ? declaration.libDechet : null;
    return { codeDechet, libDechet };
  });

  const dechetsSorted = [...dechetsUniques].sort((d1, d2) => {
    if (d1.codeDechet < d2.codeDechet) return -1;
    else if (d1.codeDechet > d2.codeDechet) return 1;
    return 0;
  });

  return (
    <div className="columns">
      <div className="box">
        <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>
          Déchets ayant fait l'object d'une déclaration GEREP
        </p>
        <p style={{ color: "#8393a7" }}>Source GEREP 2016-2017</p>
        <div className="notification warning">
          Liste indicative mais non exhaustive des déchets pouvant être pris en
          charge. Contactez l'entreprise pour plus de détail
        </div>
        <div className="table__container">
          <table className="table">
            <thead>
              <tr>
                <th>Code déchet</th>
                <th>Libellé</th>
              </tr>
            </thead>
            <tbody>
              {dechetsSorted.map((d, idx) => (
                <tr key={idx}>
                  <td>{d.codeDechet}</td>
                  <td>{d.libDechet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
