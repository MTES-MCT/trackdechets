import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import routes from "common/routes";
import { Field, Form, Formik } from "formik";
import {
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  SignatureTypeInput,
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
export function SignWork({ siret, bsdaId }: Props) {
  const [signBsda, { loading }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BSDA);

  return (
    <SignBsda title="Signer la fin de chantier" bsdaId={bsdaId}>
      {({ bsda, onClose }) =>
        bsda.metadata?.errors.some(
          error => error.requiredFor === SignatureTypeInput.Emission
        ) ? (
          <>
            <p className="tw-mt-2 tw-text-red-700">
              Vous devez mettre à jour le bordereau et renseigner les champs
              obligatoires avant de le signer.
            </p>

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
            }}
            validationSchema={validationSchema}
            onSubmit={async values => {
              await signBsda({
                variables: {
                  id: bsda.id,
                  input: { ...values, type: BsdaSignatureType.Work },
                },
              });
              onClose();
            }}
          >
            {({ isSubmitting, handleReset }) => (
              <Form>
                <p>
                  En qualité <strong>d'entreprise de travaux</strong>, j'atteste
                  que les informations ci-dessus sont correctes. En signant ce
                  document, j'autorise le transporteur à prendre en charge le
                  déchet. La signature est horodatée.
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
