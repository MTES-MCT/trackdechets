import React from "react";
import CompanySelector from "./company/CompanySelector";

export default function Emitter() {
  return (
    <React.Fragment>
      <h4>Type d'émetteur</h4>

      <div className="form__group">
        <fieldset>
          <legend>L'émetteur est:</legend>
          <label className="label-inline">
            <input type="radio" name="radio" value="1" checked readOnly />
            Producteur du déchet
          </label>
          <label className="label-inline">
            <input type="radio" name="radio" value="0" />
            Autre détenteur
          </label>
        </fieldset>
      </div>

      <h4>Entreprise émettrice</h4>
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
    </React.Fragment>
  );
}
