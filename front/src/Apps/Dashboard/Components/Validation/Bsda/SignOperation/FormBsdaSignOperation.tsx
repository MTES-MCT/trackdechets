import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { format, subMonths } from "date-fns";
import { SIGN_BSDA, UPDATE_BSDA } from "form/bsda/stepper/queries";
import Operation from "form/bsda/stepper/steps/Operation";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { getComputedState } from "form/common/getComputedState";
import { FastField as Field, Form, Formik } from "formik";
import {
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaArgs,
} from "generated/graphql/types";
import React, { useCallback, useContext, useMemo } from "react";
import CancelButton from "../../CancelButton";
import * as yup from "yup";
import ErrorBsdaSign from "../Common/ErrorBsdaSign";
import { ValidationBsdContext } from "Pages/Dashboard";

const validationSchema = yup.object({
  date: yup.date().required("La date est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

const FormBsdaSignOperation = ({ bsda, onClose }) => {
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
          destination: {
            plannedOperationCode: bsda?.plannedOperationCode,
            reception: {
              date: format(new Date(), "yyyy-MM-dd"),
              acceptationStatus: "ACCEPTED",
              refusalReason: "",
              weight: null,
            },
            operation: {
              date: format(new Date(), "yyyy-MM-dd"),
              code: "",
              nextDestination: { company: getInitialCompany() },
            },
          },
        },
        bsda
      ),
    }),
    [TODAY, bsda]
  );

  const minDate = subMonths(TODAY, 2);

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
            type: BsdaSignatureType.Operation,
          },
        },
      }).catch(() => {
        setHasValidationApiError(true);
      });
    },
    [bsda.id, signBsda, updateBsda, setHasValidationApiError]
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
            <Operation bsda={bsda} />
          </div>

          <p>
            En qualité de <strong>destinataire du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant, je confirme
            le traitement des déchets pour la quantité indiquée dans ce
            bordereau.
          </p>

          <div className="form__row">
            <label>
              Date
              <div className="td-date-wrapper">
                <Field
                  name="date"
                  component={DateInput}
                  minDate={minDate}
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

export default React.memo(FormBsdaSignOperation);
