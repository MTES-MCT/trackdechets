import React from "react";
import { Field, Form } from "formik";

import { RedErrorMessage } from "common/components";

import { BsdasriStatus, Bsdasri } from "generated/graphql/types";

export const textsConfig: {
  [id: string]: {
    title: string;
    validationText: string;
  };
} = {
  [BsdasriStatus.Initial]: {
    title: "Signature producteur",
    validationText:
      "En signant, je confirme la remise du déchet au transporteur. La signature est horodatée.",
  },
  [BsdasriStatus.SignedByProducer]: {
    title: "Signature transporteur",
    validationText:
      "En signant, je confirme l'emport du déchet. La signature est horodatée.",
  },
  [BsdasriStatus.Sent]: {
    title: "Signature reception",
    validationText:
      "En signant, je confirme la réception des déchets pour la quantité indiquée dans ce bordereau. La signature est horodatée.",
  },
  [BsdasriStatus.Received]: {
    title: "Signature traitement",
    validationText:
      "En signant, je confirme le traitement des déchets pour la quantité indiquée dans ce bordereau. La signature est horodatée.",
  },
};

export type SignatureInfoValues = {
  author: string;
};

export default function SignatureInfo({
  form,
  close,
  handleReset,
}: {
  form: Bsdasri;

  handleReset: () => void;
  close: () => void;
}) {
  const txt = textsConfig[form["bsdasriStatus"]];
  return (
    <Form>
      <div>{txt}</div>
      <div className="form__row">
        <label>
          Nom du signataire
          <Field
            type="text"
            name="author"
            placeholder="NOM Prénom"
            className="td-input"
          />
        </label>
        <RedErrorMessage name="author" />
      </div>

      <div className="form__actions">
        <button
          type="button"
          className="btn btn--outline-primary"
          onClick={() => {
            handleReset();
            close();
          }}
        >
          Annuler
        </button>

        <button
          type="submit"
          className="btn btn--primary"
          // disabled={isSubmitting}
        >
          Signer
        </button>
      </div>
    </Form>
  );
}
