import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { subMonths } from "date-fns";
import { SIGN_BSDA, UPDATE_BSDA } from "form/bsda/stepper/queries";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { getComputedState } from "form/common/getComputedState";
import { FastField as Field, Form, Formik } from "formik";
import {
  BsdaConsistence,
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaArgs,
} from "generated/graphql/types";
import React, { useCallback, useContext, useMemo } from "react";
import * as yup from "yup";
import ErrorBsdaSign from "../Common/ErrorBsdaSign";
import CancelButton from "../../CancelButton";
import { WasteInfoWorker } from "form/bsda/stepper/steps/WasteInfo";
import { ValidationBsdContext } from "Pages/Dashboard";

const validationSchema = yup.object({
  date: yup.date().required("La date est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

const FormBsdaSignWork = ({ bsda, onClose }) => {
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
      date: TODAY.toISOString(),
      author: "",
      ...getComputedState(
        {
          waste: {
            familyCode: "",
            materialName: "",
            adr: "",
            consistence: BsdaConsistence.Solide,
            sealNumbers: [],
          },
          weight: {
            value: null,
            isEstimate: false,
          },
          packagings: [],
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
            author,
            date,
            type: BsdaSignatureType.Work,
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
            <WasteInfoWorker disabled={false} />
          </div>

          <p>
            En qualité <strong>d'entreprise de travaux</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant ce document,
            j'autorise le transporteur à prendre en charge le déchet.
          </p>

          <div className="form__row">
            <label>
              Date
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
              {loading ? "Signature en cours..." : "Signer"}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default React.memo(FormBsdaSignWork);
