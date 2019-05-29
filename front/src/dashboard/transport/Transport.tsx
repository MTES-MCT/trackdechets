import React from "react";
import { Me } from "../../login/model";
import "./Transport.scss";

type Props = {
  me: Me;
  siret: string;
};

export default function Transport({ me, siret }: Props) {
  return (
    <>
      <div className="header-content">
        <h2>Mes bordereaux à transporter</h2>
      </div>

      <div>
        <table className="table">
          <thead>
            <tr>
              <th>Colonne 1</th>
              <th>Colonne 2</th>
              <th>Colonne 3</th>
              <th>Colonne 4</th>
            </tr>
          </thead>
        </table>
      </div>
    </>
  );
}
