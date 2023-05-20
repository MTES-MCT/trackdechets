import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { GET_BSDS } from "Apps/common/queries";
import routes from "Apps/routes";
import { UPDATE_BSDA } from "form/bsda/stepper/queries";
import { Transport } from "form/bsda/stepper/steps/Transport";
import TransporterReceipt from "form/common/components/company/TransporterReceipt";
import { getComputedState } from "form/common/getComputedState";
import { Field, Form, Formik } from "formik";
import {
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaArgs,
  SignatureTypeInput,
  TransportMode,
} from "generated/graphql/types";
import React from "react";
import { generatePath, Link, useRouteMatch } from "react-router-dom";
import * as yup from "yup";
import { SignBsda, SIGN_BSDA } from "./SignBsda";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { subMonths } from "date-fns";

const validationSchema = yup.object({
  date: yup.date().required("La date est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

type Props = {
  siret: string;
  bsdaId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};
export function SignTransport({
  siret,
  bsdaId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton,
}: Props) {
  const [updateBsda, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsda">,
    MutationUpdateBsdaArgs
  >(UPDATE_BSDA);
  const [signBsda, { loading, error: signatureError }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BSDA, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  const TODAY = new Date();
  const isV2Routes = !!useRouteMatch("/v2/dashboard/");
  const dashboardRoutePrefix = !isV2Routes ? "dashboard" : "dashboardv2";

  return (
    <SignBsda
      title="Signer l'enlèvement"
      bsdaId={bsdaId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsda, onClose }) =>
        bsda.metadata?.errors?.some(
          error => error.requiredFor === SignatureTypeInput.Transport
        ) ? (
          <>
            <p className="tw-m-2 tw-text-red-700">
              Vous devez mettre à jour le bordereau et renseigner les champs
              obligatoires avant de le signer.
            </p>

            <ul className="tw-mb-2 tw-text-red-700 tw-list-disc">
              {bsda.metadata?.errors.map((error, idx) => (
                <li key={idx}>{error.message}</li>
              ))}
            </ul>
            <Link
              to={generatePath(routes[dashboardRoutePrefix].bsdas.edit, {
                siret,
                id: bsda.id,
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
              date: TODAY,
              ...getComputedState(
                {
                  transporter: {
                    recepisse: {
                      isExempted: false,
                    },
                    transport: {
                      mode: TransportMode.Road,
                      plates: [],
                      takenOverAt: new Date().toISOString(),
                    },
                  },
                },
                bsda
              ),
            }}
            validationSchema={validationSchema}
            onSubmit={async values => {
              const { id, author, date, ...update } = values;
              await updateBsda({
                variables: {
                  id: bsda.id,
                  input: update,
                },
              });
              await signBsda({
                variables: {
                  id: bsda.id,
                  input: {
                    date,
                    author,
                    type: BsdaSignatureType.Transport,
                  },
                },
              });
              onClose();
            }}
          >
            {({ isSubmitting, handleReset }) => (
              <Form>
                <div className="tw-mb-6">
                  <Transport disabled={false} />
                </div>
                <div className="form__row">
                  <label>
                    ADR:
                    <input
                      type="text"
                      className="td-input"
                      disabled
                      value={bsda.waste?.adr}
                    />
                  </label>
                </div>
                <p className="tw-pt-2">
                  En qualité de <strong>transporteur du déchet</strong>,
                  j'atteste que les informations ci-dessus sont correctes. En
                  signant ce document, je déclare prendre en charge le déchet.
                </p>
                <TransporterReceipt transporter={bsda.transporter!} />

                <div className="form__row">
                  <label>
                    Date de signature
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
        )
      }
    </SignBsda>
  );
}

export default React.memo(SignTransport);
