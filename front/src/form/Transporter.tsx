import React from "react";
import CompanySelector from "./company/CompanySelector";

export default function Transporter() {
  return (
    <React.Fragment>
      <h4>Transporteur</h4>
      <CompanySelector value={null} />

      <h4>Informations complémentaires</h4>
      <div className="form__group">
        <label>
          Personne à contacter:
          <input type="text" />
        </label>

        <label>
          Téléphone ou Fax:
          <input type="text" />
        </label>

        <label>
          Mail:
          <input type="text" />
        </label>
      </div>

      <h4>Autorisations</h4>
      <div className="form__group">
        <label>
          Numéro de récépissé:
          <input type="text" />
        </label>

        <label>
         Département:
          <input type="text" />
        </label>

        <label>
          Limite de validité
          <input type="date" />
        </label>

        <label>
          Personne à contacter:
          <input type="text" />
        </label>
      </div>
    </React.Fragment>
  );
}
