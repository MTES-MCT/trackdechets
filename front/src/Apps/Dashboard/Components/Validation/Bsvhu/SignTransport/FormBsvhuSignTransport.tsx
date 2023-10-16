import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { SIGN_BSVHU } from "dashboard/components/BSDList/BSVhu/WorkflowAction/SignBsvhu";
import { subMonths } from "date-fns";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { FastField as Field, Form, Formik } from "formik";
import {
  Mutation,
  MutationSignBsvhuArgs,
  MutationUpdateBsvhuArgs,
  SignatureTypeInput,
} from "generated/graphql/types";
import React, { useCallback, useContext } from "react";
import * as yup from "yup";
import CancelButton from "../../CancelButton";
import { UPDATE_VHU_FORM } from "form/bsvhu/utils/queries";
import TransporterReceipt from "form/common/components/company/TransporterReceipt";
import { ValidationBsdContext } from "Pages/Dashboard";

const validationSchema = yup.object({
  takenOverAt: yup.date().required("La date de prise en charge est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

const FormBsvhuSignTransport = ({ bsvhu, onClose }) => {
  const [updateBsvhu, { loading: loadingUpdate, error: updateError }] =
    useMutation<Pick<Mutation, "updateBsvhu">, MutationUpdateBsvhuArgs>(
      UPDATE_VHU_FORM
    );

  const [signBsvhu, { loading: loadingSign, error: signatureError }] =
    useMutation<Pick<Mutation, "signBsvhu">, MutationSignBsvhuArgs>(SIGN_BSVHU);

  const loading = loadingUpdate || loadingSign;
  const TODAY = new Date();

  const { setHasValidationApiError } = useContext(ValidationBsdContext);

  const onSubmit = useCallback(
    async values => {
      const { takenOverAt, ...sign } = values;

      await updateBsvhu({
        variables: {
          id: bsvhu!.id,
          input: { transporter: { transport: { takenOverAt } } },
        },
      });

      signBsvhu({
        variables: {
          id: bsvhu.id,
          input: { ...sign, type: SignatureTypeInput.Transport },
        },
      })
        .then(() => {
          onClose();
        })
        .catch(() => {
          setHasValidationApiError(true);
        });
    },
    [updateBsvhu, bsvhu, signBsvhu, setHasValidationApiError, onClose]
  );

  return (
    <Formik
      initialValues={{
        author: "",
        takenOverAt: TODAY.toISOString(),
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, handleReset }) => (
        <Form>
          <p>
            En qualité de <strong>transporteur du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant ce document,
            je déclare prendre en charge le déchet.
          </p>
          <TransporterReceipt transporter={bsvhu.transporter!} />

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
            <CancelButton handleReset={handleReset} onClose={onClose} />
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              <span>
                {loading ? "Signature en cours..." : "Signer l'enlèvement"}
              </span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default React.memo(FormBsvhuSignTransport);
