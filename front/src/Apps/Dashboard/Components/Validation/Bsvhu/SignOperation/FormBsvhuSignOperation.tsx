import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { SIGN_BSVHU } from "dashboard/components/BSDList/BSVhu/WorkflowAction/SignBsvhu";
import { subMonths } from "date-fns";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import Operation from "form/bsvhu/Operation";
import { UPDATE_VHU_FORM } from "form/bsvhu/utils/queries";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { getComputedState } from "form/common/getComputedState";
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
import { ValidationBsdContext } from "Pages/Dashboard";

const validationSchema = yup.object({
  date: yup.date().required("La date est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

const FormBsvhuSignOperation = ({ bsvhu, onClose }) => {
  const [updateBsvhu, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsvhu">,
    MutationUpdateBsvhuArgs
  >(UPDATE_VHU_FORM);
  const [signBsvhu, { loading, error: signError }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU);

  const TODAY = new Date();

  const { setHasValidationApiError } = useContext(ValidationBsdContext);

  const onSubmit = useCallback(
    async values => {
      const { id, author, date, ...update } = values;
      await updateBsvhu({
        variables: {
          id: bsvhu!.id,
          input: update,
        },
      });
      signBsvhu({
        variables: {
          id: bsvhu.id,
          input: { author, date, type: SignatureTypeInput.Operation },
        },
      })
        .then(() => {
          onClose();
        })
        .catch(() => {
          setHasValidationApiError(true);
        });
    },
    [bsvhu, onClose, setHasValidationApiError, signBsvhu, updateBsvhu]
  );

  return (
    <Formik
      initialValues={{
        author: "",
        date: TODAY.toISOString(),
        ...getComputedState(
          {
            destination: {
              type: bsvhu.destination.type,
              reception: {
                date: TODAY.toISOString(),
                acceptationStatus: null,
                refusalReason: "",
                quantity: null,
                weight: null,
                identification: {
                  numbers: [],
                },
              },
              operation: {
                date: TODAY.toISOString(),
                code: "",
                nextDestination: { company: getInitialCompany() },
              },
            },
          },
          bsvhu
        ),
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, handleReset }) => (
        <Form>
          <Operation />
          <p>
            En qualité de <strong>destinataire du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant, je confirme
            le traitement des déchets pour la quantité indiquée dans ce
            bordereau.
          </p>

          <div className="form__row">
            <label>
              Date de signature
              <div className="td-date-wrapper">
                <Field
                  name="date"
                  component={DateInput}
                  className="td-input"
                  minDate={subMonths(TODAY, 2)}
                  maxDate={TODAY}
                  required
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

          {updateError && (
            <div className="error-message">{updateError.message}</div>
          )}
          {signError && (
            <div className="error-message">{signError.message}</div>
          )}

          <div className="form__actions">
            <CancelButton handleReset={handleReset} onClose={onClose} />

            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              <span>
                {loading ? "Signature en cours..." : "Signer le traitement"}
              </span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default React.memo(FormBsvhuSignOperation);
