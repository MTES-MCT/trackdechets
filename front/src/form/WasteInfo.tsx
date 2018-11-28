import React, { useState } from "react";
import WasteCode from "./waste-code/WasteCode";

export default function WasteInfo() {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <React.Fragment>
      <h4>Description du déchet</h4>
      <div className="form__group">
          <WasteCode value="" />
      </div>

      <div className="form__group">
        <label>
          Code ADR:
          <input type="text" />
        </label>
      </div>

      <h4>Conditionnement</h4>
      <div className="form__group">
        <fieldset>
          <legend>Conditionnement du déchet:</legend>
          <label className="label-inline">
            <input type="checkbox" name="checkbox" value="benne" />
            Benne
          </label>
          <br />
          <label className="label-inline">
            <input type="checkbox" name="checkbox" value="citerne" />
            Citerne
          </label>
          <br />
          <label className="label-inline">
            <input type="checkbox" name="checkbox" value="GRV" />
            GRV
          </label>
          <br />
          <label htmlFor="checkbox-ananas" className="label-inline">
            <input type="checkbox" name="checkbox" value="fût" />
            Fût
          </label>
          <br />
          <label className="label-inline">
            <input
              type="checkbox"
              name="checkbox"
              value="other"
              onChange={() => setIsChecked(!isChecked)}
            />
            Autre (à préciser)
          </label>
        </fieldset>

        {isChecked && (
          <label>
            <input type="text" />
          </label>
        )}

        <label>
          Nombre de colis:
          <input type="number" />
        </label>
      </div>

      <h4>Quantité</h4>
      <div className="form__group">
        <label>
          Quantité (en tonnes):
          <input type="number" step="0.001" />
        </label>

        <fieldset>
          <legend>Cette quantité est</legend>
          <label className="label-inline">
            <input type="radio" name="radio" value="1" />
            Réelle
          </label>
          <label className="label-inline">
            <input type="radio" name="radio" value="0" />
            Estimée
          </label>
        </fieldset>
      </div>
    </React.Fragment>
  );
}
