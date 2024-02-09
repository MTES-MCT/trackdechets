import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "../../../../../common/components";
import routes from "../../../../../Apps/routes";
import { UPDATE_VHU_FORM } from "../../../../../form/bsvhu/utils/queries";
import TransporterRecepisseWrapper from "../../../../../form/common/components/company/TransporterRecepisseWrapper";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import { Field, Form, Formik } from "formik";
import {
  Mutation,
  MutationSignBsvhuArgs,
  MutationUpdateBsvhuArgs,
  SignatureTypeInput
} from "@td/codegen-ui";
import React from "react";
import { generatePath, Link } from "react-router-dom";
import * as yup from "yup";
import { SignBsvhu, SIGN_BSVHU } from "./SignBsvhu";
import { subMonths } from "date-fns";

const validationSchema = yup.object({
  takenOverAt: yup.date().required("La date de prise en charge est requise"),
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
export function SignTransport({
  siret,
  bsvhuId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: Props) {
  const [updateBsvhu, { loading: loadingUpdate, error: updateError }] =
    useMutation<Pick<Mutation, "updateBsvhu">, MutationUpdateBsvhuArgs>(
      UPDATE_VHU_FORM
    );

  const [signBsvhu, { loading: loadingSign, error: signatureError }] =
    useMutation<Pick<Mutation, "signBsvhu">, MutationSignBsvhuArgs>(SIGN_BSVHU);

  const loading = loadingUpdate || loadingSign;

  return (
    <SignBsvhu
      title="Signer l'enlèvement"
      bsvhuId={bsvhuId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsvhu, onClose }) => {
        const TODAY = new Date();

        return bsvhu.metadata?.errors.some(
          error =>
            error.requiredFor === SignatureTypeInput.Transport &&
            // Transporter Receipt will be auto-completed by the transporter
            !error.path.startsWith("transporterRecepisse")
        ) ? (
          <>
            <p className="tw-mt-2 tw-text-red-700">
              Vous devez mettre à jour le bordereau et renseigner les champs
              obligatoires avant de le signer.
            </p>
            <ul className="tw-mb-2 tw-text-red-700 tw-list-disc">
              {bsvhu.metadata?.errors.map((error, idx) => (
                <li key={idx}>{error.message}</li>
              ))}
            </ul>
            <Link
              to={generatePath(routes.dashboard.bsvhus.edit, {
                siret,
                id: bsvhu.id
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
              takenOverAt: TODAY.toISOString()
            }}
            validationSchema={validationSchema}
            onSubmit={async values => {
              const { takenOverAt, ...sign } = values;

              await updateBsvhu({
                variables: {
                  id: bsvhuId,
                  input: { transporter: { transport: { takenOverAt } } }
                }
              });

              await signBsvhu({
                variables: {
                  id: bsvhu.id,
                  input: { ...sign, type: SignatureTypeInput.Transport }
                }
              });
              onClose();
            }}
          >
            {({ isSubmitting, handleReset }) => (
              <Form>
                <p>
                  En qualité de <strong>transporteur du déchet</strong>,
                  j'atteste que les informations ci-dessus sont correctes. En
                  signant ce document, je déclare prendre en charge le déchet.
                </p>
                <TransporterRecepisseWrapper transporter={bsvhu.transporter!} />

                <div className="form__row">
                  <label>
                    Date de prise en charge
                    <div className="td-date-wrapper">
                      <Field
                        name="takenOverAt"
                        component={DateInput}
                        className="td-input"
                        minDate={subMonths(TODAY, 2)}
                        maxDate={TODAY}
                        required
                      />
                    </div>
                  </label>
                  <RedErrorMessage name="takenOverAt" />
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
                    <span>
                      {loading
                        ? "Signature en cours..."
                        : "Signer l'enlèvement"}
                    </span>
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        );
      }}
    </SignBsvhu>
  );
}
