import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { GET_BSDS } from "common/queries";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import Operation from "form/bsvhu/Operation";
import { UPDATE_VHU_FORM } from "form/bsvhu/utils/queries";
import { getComputedState } from "form/common/stepper/GenericStepList";
import { Field, Form, Formik } from "formik";
import {
  Mutation,
  MutationSignBsvhuArgs,
  MutationUpdateBsvhuArgs,
  SignatureTypeInput,
} from "generated/graphql/types";
import React from "react";
import * as yup from "yup";
import { SignBsvhu, SIGN_BSVHU } from "./SignBsvhu";

const validationSchema = yup.object({
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

type Props = { siret: string; bsvhuId: string };
export function SignOperation({ siret, bsvhuId }: Props) {
  const [updateBsvhu] = useMutation<
    Pick<Mutation, "updateBsvhu">,
    MutationUpdateBsvhuArgs
  >(UPDATE_VHU_FORM);
  const [signBsvhu, { loading }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  return (
    <SignBsvhu title="Signer le traitement" bsvhuId={bsvhuId}>
      {({ bsvhu, onClose }) => (
        <Formik
          initialValues={{
            author: "",
            ...getComputedState(
              {
                destination: {
                  reception: {
                    date: new Date().toISOString(),
                    acceptationStatus: null,
                    refusalReason: "",
                    quantity: null,
                    weight: null,
                    identification: {
                      numbers: [],
                    },
                  },
                  operation: {
                    date: new Date().toISOString(),
                    code: "",
                    nextDestination: { company: getInitialCompany() },
                  },
                },
              },
              bsvhu
            ),
          }}
          validationSchema={validationSchema}
          onSubmit={async values => {
            const { id, author, ...update } = values;
            await updateBsvhu({
              variables: {
                id: bsvhuId,
                input: update,
              },
            });
            await signBsvhu({
              variables: {
                id: bsvhu.id,
                input: { author, type: SignatureTypeInput.Operation },
              },
            });
            onClose();
          }}
        >
          {({ isSubmitting, handleReset }) => (
            <Form>
              <Operation />
              <p>
                En qualité de <strong>destinataire du déchet</strong>, j'atteste
                que les informations ci-dessus sont correctes. En signant, je
                confirme le traitement des déchets pour la quantité indiquée
                dans ce bordereau. La signature est horodatée.
              </p>
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
                    onClose();
                  }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isSubmitting}
                >
                  <span>
                    {loading ? "Signature en cours..." : "Signer le traitement"}
                  </span>
                </button>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </SignBsvhu>
  );
}
