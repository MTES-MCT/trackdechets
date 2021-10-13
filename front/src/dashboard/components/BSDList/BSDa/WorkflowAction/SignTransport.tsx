import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { GET_BSDS } from "common/queries";
import routes from "common/routes";
import { UPDATE_BSDA } from "form/bsda/stepper/queries";
import { Transport } from "form/bsda/stepper/steps/Transport";
import { getComputedState } from "form/common/stepper/GenericStepList";
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
import { generatePath, Link } from "react-router-dom";
import * as yup from "yup";
import { SignBsda, SIGN_BSDA } from "./SignBsda";

const validationSchema = yup.object({
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

type Props = { siret: string; bsdaId: string };
export function SignTransport({ siret, bsdaId }: Props) {
  const [updateBsda] = useMutation<
    Pick<Mutation, "updateBsda">,
    MutationUpdateBsdaArgs
  >(UPDATE_BSDA);
  const [signBsda, { loading }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BSDA, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  return (
    <SignBsda title="Signer l'enlèvement" bsdaId={bsdaId}>
      {({ bsda, onClose }) =>
        bsda.metadata?.errors.some(
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
              to={generatePath(routes.dashboard.bsdas.edit, {
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
              ...getComputedState(
                {
                  transporter: {
                    recepisse: {
                      isExempted: false,
                      number: "",
                      department: "",
                      validityLimit: null,
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
              const { id, author, ...update } = values;
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
                <p>
                  En qualité de <strong>transporteur du déchet</strong>,
                  j'atteste que les informations ci-dessus sont correctes. En
                  signant ce document, je déclare prendre en charge le déchet.
                  La signature est horodatée.
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
