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
        Cette action aura pour effet de valider les données du bordereau et de
        le faire apparaitre dans l'onglet "À collecter" du tableau de bord
        transporteur. Un identifiant unique lui sera attribué et vous pourrez
        générer un PDF. Le bordereau pourra cependant toujours être modifié ou
        supprimé depuis l'onglet "Suivi".
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
