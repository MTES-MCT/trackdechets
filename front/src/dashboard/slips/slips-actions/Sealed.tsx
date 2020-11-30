import cogoToast from "cogo-toast";
import React from "react";
import { SlipActionProps } from "./SlipActions";

export default function Sealed(props: SlipActionProps) {
  function onSubmit() {
    props
      .onSubmit({})
      .then(() =>
        cogoToast.success(
          `Le numéro #${props.form.readableId} a été affecté au bordereau. Vous pouvez le retrouver dans l'onglet "Suivi"`
        )
      );
  }

  return (
    <div>
      <p>
        Cette action aura pour effet de finaliser votre bordereau, c'est à dire
        qu'il ne sera plus éditable. Cette action est nécessaire pour générer un
        bordereau PDF et permet au bordereau d'entrer dans le circuit de
        validation.
      </p>

      <div className="td-modal-actions">
        <button
          type="button"
          className="btn btn--outline-primary"
          onClick={props.onCancel}
        >
          Annuler
        </button>
        <button type="submit" className="btn btn--primary" onClick={onSubmit}>
          Je valide
        </button>
      </div>
    </div>
  );
}
