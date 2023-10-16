import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { SIGN_BSVHU } from "dashboard/components/BSDList/BSVhu/WorkflowAction/SignBsvhu";
import { subMonths } from "date-fns";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { FastField as Field, Form, Formik } from "formik";
import {
  Mutation,
  MutationSignBsvhuArgs,
  SignatureTypeInput,
} from "generated/graphql/types";
import React, { useCallback, useContext } from "react";
import * as yup from "yup";
import CancelButton from "../../CancelButton";
import { ValidationBsdContext } from "Pages/Dashboard";

const validationSchema = yup.object({
  date: yup.date().required("La date d'émission est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

const FormBsvhuSignEmission = ({ bsvhu, onClose }) => {
  const [signBsvhu, { loading }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU);

  const TODAY = new Date();

  const { setHasValidationApiError } = useContext(ValidationBsdContext);

  const onSubmit = useCallback(
    async values => {
      signBsvhu({
        variables: {
          id: bsvhu!.id,
          input: {
            ...values,
            type: SignatureTypeInput.Emission,
          },
        },
      })
        .then(() => {
          onClose();
        })
        .catch(() => {
          setHasValidationApiError(true);
        });
    },
    [signBsvhu, bsvhu, setHasValidationApiError, onClose]
  );

  return (
    <Formik
      initialValues={{
        author: "",
        date: TODAY.toISOString(),
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, handleReset }) => (
        <Form>
          <p>
            En qualité <strong>d'émetteur du déchet</strong>, j'atteste que les
            informations ci-dessus sont correctes. En signant ce document,
            j'autorise le transporteur à prendre en charge le déchet.
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
            <CancelButton handleReset={handleReset} onClose={onClose} />

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
  );
};

export default React.memo(FormBsvhuSignEmission);
