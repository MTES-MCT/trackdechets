import React from "react";
import { SlipActionProps } from "../SlipActions";

export default function Sealed(props: SlipActionProps) {
  return (
    <div>
      <p>
        Cette action aura pour effet de finaliser votre bordereau, c'est à dire
        qu'il ne sera plus éditable. Cette action est nécessaire pour générer un
        bordereau PDF et permet au bordereau d'entrer dans le circuit de
        validation.
      </p>
      <div className="form__group button__group">
        <button
          type="button"
          className="button secondary"
          onClick={props.onCancel}
        >
          Annuler
        </button>
        <button type="submit" className="button" onClick={() => props.onSubmit({})}>
          Je valide
        </button>
      </div>
    </div>
  );
}
