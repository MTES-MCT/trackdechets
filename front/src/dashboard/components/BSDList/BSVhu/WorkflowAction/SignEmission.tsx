import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { GET_BSDS } from "Apps/common/queries";
import routes from "Apps/routes";
import { Field, Form, Formik } from "formik";
import {
  Mutation,
  MutationSignBsvhuArgs,
  SignatureTypeInput,
} from "generated/graphql/types";
import React from "react";
import { generatePath, Link, useRouteMatch } from "react-router-dom";
import * as yup from "yup";
import { SignBsvhu, SIGN_BSVHU } from "./SignBsvhu";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { subMonths } from "date-fns";

const getValidationSchema = (today: Date) =>
  yup.object({
    date: yup
      .date()
      .required("La date d'émission est requise")
      .max(today, "La date d'émission ne peut être dans le futur")
      .min(
        subMonths(today, 2),
        "La date d'émission ne peut être antérieure à 2 mois"
      ),
    author: yup
      .string()
      .ensure()
      .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
  });

type Props = {
  siret: string;
  bsvhuId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};
export function SignEmission({
  siret,
  bsvhuId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton,
}: Props) {
  const [signBsvhu, { loading }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  const TODAY = new Date();
  const isV2Routes = !!useRouteMatch("/v2/dashboard/");
  const dashboardRoutePrefix = !isV2Routes ? "dashboard" : "dashboardv2";

  return (
    <SignBsvhu
      title="Signer"
      bsvhuId={bsvhuId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsvhu, onClose }) =>
        bsvhu.metadata?.errors.some(
          error => error.requiredFor === SignatureTypeInput.Emission
        ) ? (
          <>
            <p className="tw-mt-2 tw-text-red-700">
              Vous devez mettre à jour le bordereau et renseigner les champs
              obligatoires avant de le signer.
            </p>

            <Link
              to={generatePath(routes[dashboardRoutePrefix].bsvhus.edit, {
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
              date: TODAY.toISOString(),
            }}
            validationSchema={getValidationSchema(TODAY)}
            onSubmit={async values => {
              await signBsvhu({
                variables: {
                  id: bsvhu.id,
                  input: {
                    ...values,
                    type: SignatureTypeInput.Emission,
                  },
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
                  document, j'autorise le transporteur à prendre en charge le
                  déchet.
                </p>

                <div className="form__row">
                  <label>
                    Date d'émission
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
                    {loading ? "Signature en cours..." : "Signer l'enlèvement"}
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
