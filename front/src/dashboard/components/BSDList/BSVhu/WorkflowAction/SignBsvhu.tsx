import React from "react";
import { RedErrorMessage, ActionButton } from "common/components";
import * as yup from "yup";

import { Formik, Field, Form } from "formik";
import {
  Mutation,
  MutationSignBsvhuArgs,
  SignatureTypeInput,
  BsvhuStatus,
} from "generated/graphql/types";
import { gql, useMutation } from "@apollo/client";
import { Link, generatePath } from "react-router-dom";
import routes from "common/routes";
import { TdModalTrigger } from "common/components/Modal";
import { IconCheckCircle1 } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import { WorkflowActionProps } from "./WorkflowAction";

const SIGN_BSVHU = gql`
  mutation SignBsvhu($id: ID!, $input: BsvhuSignatureInput!) {
    signBsvhu(id: $id, input: $input) {
      id
      status
    }
  }
`;

const validationSchema = yup.object({
  author: yup.string().nullable().required("Le nom du signataire est requis"),
});

const settings: {
  [id: string]: {
    label: string;
    signatureType: SignatureTypeInput;
    validationText: string;
  };
} = {
  [BsvhuStatus.Initial]: {
    label: "Signature producteur",
    signatureType: SignatureTypeInput.Emission,
    validationText:
      "En signant, je confirme la remise du déchet au transporteur. La signature est horodatée.",
  },

  [BsvhuStatus.SignedByProducer]: {
    label: "Signature transporteur",
    signatureType: SignatureTypeInput.Transport,
    validationText:
      "En signant, je confirme l'emport du déchet. La signature est horodatée.",
  },
  [BsvhuStatus.Sent]: {
    label: "Signature réception & opération",
    signatureType: SignatureTypeInput.Operation,
    validationText:
      "En signant, je confirme le traitement des déchets pour la quantité indiquée dans ce bordereau. La signature est horodatée.",
  },
};

export default function SignBsvhu({
  form,
  siret,
  signatureType,
}: WorkflowActionProps & { signatureType: SignatureTypeInput }) {
  const [signBsvhu, { error }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU);

  const config = settings[form["bsvhuStatus"]];

  return (
    <TdModalTrigger
      ariaLabel={config.label}
      trigger={open => (
        <ActionButton icon={<IconCheckCircle1 size="24px" />} onClick={open}>
          {config.label}
        </ActionButton>
      )}
      modalContent={close => (
        <div>
          <Formik
            initialValues={{
              author: "",
            }}
            validationSchema={validationSchema}
            onSubmit={async values => {
              await signBsvhu({
                variables: {
                  id: form.id,
                  input: { ...values, type: signatureType },
                },
              });
              close();
            }}
          >
            {({ isSubmitting, handleReset }) => (
              <Form>
                <div>{config.validationText}</div>
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
                    disabled={isSubmitting}
                  >
                    Signer
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          {error && (
            <>
              <p className="tw-mt-2 tw-text-red-700">
                Vous devez mettre à jour le bordereau et renseigner les champs
                nécessaires avant de le signer.
              </p>
              <NotificationError className="action-error" apolloError={error} />

              <Link
                to={generatePath(routes.dashboard.bsvhus.edit, {
                  siret,
                  id: form.id,
                })}
                className="btn btn--primary"
              >
                Mettre le bordereau à jour pour le signer
              </Link>
            </>
          )}
        </div>
      )}
    />
  );
}
