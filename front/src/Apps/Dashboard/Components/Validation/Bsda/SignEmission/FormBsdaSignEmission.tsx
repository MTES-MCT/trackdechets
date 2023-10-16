import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { subMonths } from "date-fns";
import { SIGN_BSDA } from "form/bsda/stepper/queries";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { FastField as Field, Form, Formik } from "formik";
import {
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
} from "generated/graphql/types";
import React, { useCallback, useContext, useMemo } from "react";
import * as yup from "yup";
import ErrorBsdaSign from "../Common/ErrorBsdaSign";
import CancelButton from "../../CancelButton";
import { ValidationBsdContext } from "Pages/Dashboard";

const validationSchema = yup.object({
  date: yup.date().required("La date d'émission est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

const FormBsdaSignEmission = ({ bsda, onClose }) => {
  const [signBsda, { loading, error }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BSDA);

  const TODAY = useMemo(() => new Date(), []);

  const initialValues = useMemo(
    () => ({
      date: TODAY.toISOString(),
      author: "",
    }),
    [TODAY]
  );

  const { setHasValidationApiError } = useContext(ValidationBsdContext);

  const onSubmit = useCallback(
    async values => {
      signBsda({
        variables: {
          id: bsda.id,
          input: { ...values, type: BsdaSignatureType.Emission },
        },
      }).catch(() => {
        setHasValidationApiError(true);
      });
    },
    [setHasValidationApiError, bsda.id, signBsda]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, handleReset }) => (
        <Form>
          <p>
            En qualité <strong>d'émetteur du déchet</strong>, j'atteste que les
            informations ci-dessus sont correctes. En signant ce document,
            j'autorise l'entreprise de travaux à prendre en charge le déchet.
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

          {error && <ErrorBsdaSign message={error.message} />}

          <div className="form__actions">
            <CancelButton handleReset={handleReset} onClose={onClose} />

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
  );
};

export default React.memo(FormBsdaSignEmission);
