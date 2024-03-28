import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "../../../../../common/components";
import routes from "../../../../../Apps/routes";
import { Transport } from "../../../../../form/bsda/stepper/steps/Transport";
import TransporterRecepisseWrapper from "../../../../../form/common/components/company/TransporterRecepisseWrapper";
import { Field, Form, Formik } from "formik";
import {
  BsdaSignatureType,
  BsdaTransportInput,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaTransporterArgs,
  SignatureInput,
  TransportMode
} from "@td/codegen-ui";
import React from "react";
import { generatePath, Link } from "react-router-dom";
import * as yup from "yup";
import { SignBsda, SIGN_BSDA } from "./SignBsda";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import { subMonths } from "date-fns";
import { UPDATE_BSDA_TRANSPORTER } from "../../../../../Apps/Forms/Components/query";

const validationSchema = yup.object({
  signature: yup.object({
    date: yup.date().required("La date est requise"),
    author: yup
      .string()
      .ensure()
      .min(1, "Le nom et prénom de l'auteur de la signature est requis")
  })
});

type Props = {
  siret: string;
  bsdaId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};

type FormikValues = {
  transport: BsdaTransportInput;
  signature: SignatureInput;
};

export function SignTransport({
  siret,
  bsdaId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: Props) {
  const [updateBsdaTransporter, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsdaTransporter">,
    MutationUpdateBsdaTransporterArgs
  >(UPDATE_BSDA_TRANSPORTER);

  const [signBsda, { loading, error: signatureError }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BSDA);

  const TODAY = new Date();

  return (
    <SignBsda
      title="Signer l'enlèvement"
      bsdaId={bsdaId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsda, onClose }) => {
        if (
          (bsda.metadata?.errors ?? []).some(
            error =>
              error &&
              error.requiredFor === BsdaSignatureType.Transport &&
              // Transporter Receipt will be auto-completed by the transporter
              !error.path.startsWith("transporterRecepisse") &&
              error.path !== "transporterTransportPlates"
          )
        ) {
          return (
            <>
              <p className="tw-m-2 tw-text-red-700">
                Vous devez mettre à jour le bordereau et renseigner les champs
                obligatoires avant de le signer.
              </p>

              <ul className="tw-mb-2 tw-text-red-700 tw-list-disc">
                {bsda.metadata?.errors?.map((error, idx) => (
                  <li key={idx}>{error?.message}</li>
                ))}
              </ul>
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
          );
        }

        const signingTransporter = bsda.transporters?.find(
          t => !t.transport?.signature?.date
        )!;

        console.log(signingTransporter);

        return (
          <Formik<FormikValues>
            initialValues={{
              transport: {
                mode: signingTransporter.transport?.mode ?? TransportMode.Road,
                plates: signingTransporter.transport?.plates ?? [],
                takenOverAt:
                  signingTransporter.transport?.takenOverAt ??
                  new Date().toISOString()
              },
              signature: {
                author: "",
                date: TODAY.toISOString()
              }
            }}
            validationSchema={validationSchema}
            onSubmit={async values => {
              const { transport, signature } = values;
              await updateBsdaTransporter({
                variables: {
                  id: signingTransporter.id,
                  input: { transport: transport }
                }
              });
              await signBsda({
                variables: {
                  id: bsda.id,
                  input: {
                    date: signature.date,
                    author: signature.author,
                    type: BsdaSignatureType.Transport
                  }
                }
              });
              onClose();
            }}
          >
            {({ isSubmitting, handleReset }) => (
              <Form>
                <div className="tw-mb-6">
                  <Transport disabled={false} required={true} />
                </div>
                <div className="form__row">
                  <label>
                    ADR:
                    <input
                      type="text"
                      className="td-input"
                      disabled
                      value={bsda.waste?.adr ?? ""}
                    />
                  </label>
                </div>
                <p className="tw-pt-2">
                  En qualité de <strong>transporteur du déchet</strong>,
                  j'atteste que les informations ci-dessus sont correctes. En
                  signant ce document, je déclare prendre en charge le déchet.
                </p>
                <TransporterRecepisseWrapper transporter={signingTransporter} />

                <div className="form__row">
                  <label>
                    Date de signature
                    <div className="td-date-wrapper">
                      <Field
                        name="signature.date"
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
                      name="signature.author"
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
    </SignBsda>
  );
}

export default React.memo(SignTransport);
