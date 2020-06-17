import cogoToast from "cogo-toast";
import React from "react";
import { SlipActionProps } from "../SlipActions";

export default function Sealed(props: SlipActionProps) {
  function onSubmit() {
    cogoToast.success(
      `Le numéro #${props.form.readableId} a été affecté au bordereau`
    );
    props.onSubmit({});
  }

  return (
    <div>
      <p>
        Cette action aura pour effet de finaliser votre bordereau, c'est à dire
        qu'il ne sera plus éditable. Cette action est nécessaire pour générer un
        bordereau PDF et permet au bordereau d'entrer dans le circuit de
        validation.
      </p>
      <div className="form__actions">
        <button
          type="button"
          className="button-outline primary"
          onClick={props.onCancel}
        >
          Annuler
        </button>
        <button type="submit" className="button no-margin" onClick={onSubmit}>
          Je valide
        </button>
      </div>
    </div>
  );
}
