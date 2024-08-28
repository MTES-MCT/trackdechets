import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "../../../../../common/components";
import routes from "../../../../../Apps/routes";
import { format, subMonths } from "date-fns";
import { UPDATE_BSDA } from "../../../../../Apps/common/queries/bsda/queries";
import Operation from "../../../../../form/bsda/stepper/steps/Operation";
import { getComputedState } from "../../../../../Apps/Dashboard/Creation/getComputedState";
import { Field, Form, Formik } from "formik";
import {
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaArgs
} from "@td/codegen-ui";
import React from "react";
import { generatePath, Link } from "react-router-dom";
import * as yup from "yup";
import { SignBsda, SIGN_BSDA } from "./SignBsda";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import { getInitialCompany } from "../../../../../Apps/common/data/initialState";

const validationSchema = yup.object({
  date: yup.date().required("La date est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis")
});

type Props = {
  siret: string;
  bsdaId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};
export function SignOperation({
  siret,
  bsdaId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: Props) {
  const [updateBsda, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsda">,
    MutationUpdateBsdaArgs
  >(UPDATE_BSDA);
  const [signBsda, { loading, error: signatureError }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BSDA);

  const TODAY = new Date();

  return (
    <SignBsda
      title="Signer le traitement"
      bsdaId={bsdaId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsda, onClose }) =>
        bsda.metadata?.errors?.some(
          error => error?.requiredFor === BsdaSignatureType.Emission
        ) ? (
          <>
            <p className="tw-mt-2 tw-text-red-700">
              Vous devez mettre à jour le bordereau et renseigner les champs
              obligatoires avant de le signer.
            </p>

            <Link
              to={generatePath(routes.dashboard.bsdas.edit, {
                siret,
                id: bsda.id
              })}
              className="btn btn--primary"
            >
              Mettre le bordereau à jour pour le signer
            </Link>
          </>
        ) : (
          <Formik
            initialValues={{
              author: "",
              date: TODAY.toISOString(),
              ...getComputedState(
                {
                  destination: {
                    plannedOperationCode:
                      bsda.destination?.plannedOperationCode,
                    reception: {
                      date: format(new Date(), "yyyy-MM-dd"),
                      acceptationStatus: "ACCEPTED",
                      refusalReason: "",
                      weight: null
                    },
                    operation: {
                      date: format(new Date(), "yyyy-MM-dd"),
                      code: "",
                      nextDestination: { company: getInitialCompany() }
                    }
                  }
                },
                bsda
              )
            }}
            validationSchema={validationSchema}
            onSubmit={async values => {
              const { id, author, date, ...update } = values;
              await updateBsda({
                variables: {
                  id: bsda.id,
                  input: update
                }
              });
              await signBsda({
                variables: {
                  id: bsda.id,
                  input: {
                    date,
                    author,
                    type: BsdaSignatureType.Operation
                  }
                }
              });
              onClose();
            }}
          >
            {({ isSubmitting, handleReset }) => (
              <Form>
                <div className="tw-mb-6">
                  <Operation bsda={bsda} />
                </div>

                <p>
                  En qualité de <strong>destinataire du déchet</strong>,
                  j'atteste que les informations ci-dessus sont correctes. En
                  signant, je confirme le traitement des déchets pour la
                  quantité indiquée dans ce bordereau.
                </p>

                <div className="form__row">
                  <label>
                    Date
                    <div className="td-date-wrapper">
                      <Field
                        name="date"
                        component={DateInput}
                        minDate={subMonths(TODAY, 2)}
                        maxDate={TODAY}
                        required
                        className="td-input"
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
                  <div className="notification notification--error">
                    {updateError.message}
                  </div>
                )}
                {signatureError && (
                  <div className="notification notification--error">
                    {signatureError.message}
                  </div>
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
                    {loading ? "Signature en cours..." : "Signer"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )
      }
    </SignBsda>
  );
}
export default React.memo(SignOperation);
