import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { subMonths } from "date-fns";
import { SIGN_BSDA, UPDATE_BSDA } from "form/bsda/stepper/queries";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { getComputedState } from "form/common/getComputedState";
import { FastField as Field, Form, Formik } from "formik";
import {
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaArgs,
  TransportMode,
} from "generated/graphql/types";
import React, { useCallback, useContext, useMemo } from "react";
import * as yup from "yup";
import TransporterReceipt from "form/common/components/company/TransporterReceipt";
import { Transport } from "form/bsda/stepper/steps/Transport";
import ErrorBsdaSign from "../Common/ErrorBsdaSign";
import CancelButton from "../../CancelButton";
import { ValidationBsdContext } from "Pages/Dashboard";

const validationSchema = yup.object({
  date: yup.date().required("La date est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

const FormBsdaSignTransport = ({ bsda, onClose }) => {
  const [updateBsda, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsda">,
    MutationUpdateBsdaArgs
  >(UPDATE_BSDA);
  const [signBsda, { loading, error: signatureError }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BSDA);

  const TODAY = useMemo(() => new Date(), []);

  const initialValues = useMemo(
    () => ({
      author: "",
      date: TODAY.toISOString(),
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
    }),
    [TODAY, bsda]
  );

  const { setHasValidationApiError } = useContext(ValidationBsdContext);

  const onSubmit = useCallback(
    async values => {
      const { id, author, date, ...update } = values;
      await updateBsda({
        variables: {
          id: bsda.id,
          input: update,
        },
      });
      signBsda({
        variables: {
          id: bsda.id,
          input: {
            date,
            author,
            type: BsdaSignatureType.Transport,
          },
        },
      }).catch(() => {
        setHasValidationApiError(true);
      });
    },
    [setHasValidationApiError, updateBsda, bsda.id, signBsda]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
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
                value={bsda.waste?.adr}
              />
            </label>
          </div>
          <p className="tw-pt-2">
            En qualité de <strong>transporteur du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant ce document,
            je déclare prendre en charge le déchet.
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

          {updateError && <ErrorBsdaSign message={updateError.message} />}
          {signatureError && <ErrorBsdaSign message={signatureError.message} />}

          <div className="form__actions">
            <CancelButton onClose={onClose} handleReset={handleReset} />

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

export default React.memo(FormBsdaSignTransport);
