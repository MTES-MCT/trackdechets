import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { GET_BSDS } from "common/queries";
import routes from "common/routes";
import { Field, Form, Formik } from "formik";
import {
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  SignatureTypeInput,
} from "generated/graphql/types";
import React from "react";
import { generatePath, Link, useRouteMatch } from "react-router-dom";
import * as yup from "yup";
import { SignBsda, SIGN_BSDA } from "./SignBsda";
import { subtractMonths } from "common/helper";
import DateInput from "form/common/components/custom-inputs/DateInput";

const getValidationSchema = (today: Date) =>
  yup.object({
    date: yup
      .date()
      .required("La date d'émission est requise")
      .max(today, "La date d'émission ne peut être dans le futur")
      .min(
        subtractMonths(today, 2),
        "La date d'émission ne peut être antérieure à 2 mois"
      ),
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
export function SignEmission({
  siret,
  bsdaId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton,
}: Props) {
  const [signBsda, { loading, error }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BSDA, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
  });

  const TODAY = new Date();
  const isV2Routes = !!useRouteMatch("/v2/dashboard/");
  const dashboardRoutePrefix = !isV2Routes ? "dashboard" : "dashboardv2";

  return (
    <SignBsda
      title="Signature émetteur"
      bsdaId={bsdaId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsda, onClose }) =>
        bsda.metadata?.errors?.some(
          error => error.requiredFor === SignatureTypeInput.Emission
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
              date: TODAY.toISOString(),
              author: "",
            }}
            validationSchema={getValidationSchema(TODAY)}
            onSubmit={async values => {
              await signBsda({
                variables: {
                  id: bsda.id,
                  input: { ...values, type: BsdaSignatureType.Emission },
                },
              });
              onClose();
            }}
          >
            {({ isSubmitting, handleReset }) => (
              <Form>
                <p>
                  En qualité <strong>d'émetteur du déchet</strong>, j'atteste
                  que les informations ci-dessus sont correctes. En signant ce
                  document, j'autorise l'entreprise de travaux à prendre en
                  charge le déchet.
                </p>

                <div className="form__row">
                  <label>
                    Date d'émission
                    <div className="td-date-wrapper">
                      <Field
                        name="date"
                        component={DateInput}
                        minDate={subtractMonths(TODAY, 2)}
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

                {error && (
                  <div className="notification notification--error">
                    {error.message}
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
