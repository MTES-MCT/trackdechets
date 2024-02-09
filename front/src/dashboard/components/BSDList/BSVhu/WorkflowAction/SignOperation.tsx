import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "../../../../../common/components";
import { getInitialCompany } from "../../../../../form/bsdd/utils/initial-state";
import Operation from "../../../../../form/bsvhu/Operation";
import { UPDATE_VHU_FORM } from "../../../../../form/bsvhu/utils/queries";
import { getComputedState } from "../../../../../form/common/getComputedState";
import { Field, Form, Formik } from "formik";
import {
  Mutation,
  MutationSignBsvhuArgs,
  MutationUpdateBsvhuArgs,
  SignatureTypeInput
} from "@td/codegen-ui";
import React from "react";
import * as yup from "yup";
import { SignBsvhu, SIGN_BSVHU } from "./SignBsvhu";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import { subMonths } from "date-fns";

const validationSchema = yup.object({
  date: yup.date().required("La date est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis")
});

type Props = {
  siret: string;
  bsvhuId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};
export function SignOperation({
  bsvhuId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: Props) {
  const [updateBsvhu, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsvhu">,
    MutationUpdateBsvhuArgs
  >(UPDATE_VHU_FORM);
  const [signBsvhu, { loading, error: signError }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU);

  const TODAY = new Date();

  return (
    <SignBsvhu
      title="Signer le traitement"
      bsvhuId={bsvhuId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsvhu, onClose }) => (
        <Formik
          initialValues={{
            author: "",
            date: TODAY.toISOString(),
            ...getComputedState(
              {
                destination: {
                  type: bsvhu.destination.type,
                  reception: {
                    date: TODAY.toISOString(),
                    acceptationStatus: null,
                    refusalReason: "",
                    quantity: null,
                    weight: null,
                    identification: {
                      numbers: []
                    }
                  },
                  operation: {
                    date: TODAY.toISOString(),
                    code: "",
                    nextDestination: { company: getInitialCompany() }
                  }
                }
              },
              bsvhu
            )
          }}
          validationSchema={validationSchema}
          onSubmit={async values => {
            const { id, author, date, ...update } = values;
            await updateBsvhu({
              variables: {
                id: bsvhuId,
                input: update
              }
            });
            await signBsvhu({
              variables: {
                id: bsvhu.id,
                input: { author, date, type: SignatureTypeInput.Operation }
              }
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
                dans ce bordereau.
              </p>

              <div className="form__row">
                <label>
                  Date de signature
                  <div className="td-date-wrapper">
                    <Field
                      name="date"
                      component={DateInput}
                      className="td-input"
                      minDate={subMonths(TODAY, 2)}
                      maxDate={TODAY}
                      required
                    />
                  </div>
                </label>
                <RedErrorMessage name="date" />
              </div>

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

              {updateError && (
                <div className="error-message">{updateError.message}</div>
              )}
              {signError && (
                <div className="error-message">{signError.message}</div>
              )}

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
