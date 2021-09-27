import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { GET_BSDS } from "common/queries";
import routes from "common/routes";
import { Field, Form, Formik } from "formik";
import {
  Mutation,
  MutationSignBsvhuArgs,
  SignatureTypeInput,
} from "generated/graphql/types";
import React from "react";
import { generatePath, Link } from "react-router-dom";
import * as yup from "yup";
import { SignBsvhu, SIGN_BSVHU } from "./SignBsvhu";

const validationSchema = yup.object({
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

type Props = { siret: string; bsvhuId: string };
export function SignTransport({ siret, bsvhuId }: Props) {
  const [signBsvhu, { loading }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  return (
    <SignBsvhu title="Signer l'enlèvement" bsvhuId={bsvhuId}>
      {({ bsvhu, onClose }) =>
        bsvhu.metadata?.errors.some(
          error => error.requiredFor === SignatureTypeInput.Transport
        ) ? (
          <>
            <p className="tw-mt-2 tw-text-red-700">
              Vous devez mettre à jour le bordereau et renseigner les champs
              obligatoires avant de le signer.
            </p>

            <Link
              to={generatePath(routes.dashboard.bsvhus.edit, {
                siret,
                id: bsvhu.id,
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
            }}
            validationSchema={validationSchema}
            onSubmit={async values => {
              await signBsvhu({
                variables: {
                  id: bsvhu.id,
                  input: { ...values, type: SignatureTypeInput.Transport },
                },
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
    </SignBsvhu>
  );
}
