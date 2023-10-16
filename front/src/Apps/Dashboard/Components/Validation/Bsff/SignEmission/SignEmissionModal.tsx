import { useMutation, useQuery } from "@apollo/client";
import { NotificationError } from "Apps/common/Components/Error/Error";
import Loader from "Apps/common/Components/Loader/Loaders";
import TdModal from "Apps/common/Components/Modal/Modal";
import { ValidationBsdContext } from "Pages/Dashboard";
import { RedErrorMessage } from "common/components";
import { BsffSummary } from "dashboard/components/BSDList/BSFF/WorkflowAction/BsffSummary";
import { subMonths } from "date-fns";
import { GET_BSFF_FORM, SIGN_BSFF } from "form/bsff/utils/queries";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { Field, Form, Formik } from "formik";
import {
  Bsff,
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
  Query,
  QueryBsffArgs,
} from "generated/graphql/types";
import React, { useContext, useEffect, useState } from "react";
import * as yup from "yup";

const validationSchema = yup.object({
  date: yup.date().required("La date d'émission est requise"),
  signatureAuthor: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

const SignEmissionModal = ({ bsffId, isOpen, onClose }) => {
  const [bsff, setBsff] = useState<Bsff | undefined>();

  const { data } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: {
      id: bsffId,
    },
  });

  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  useEffect(() => {
    setBsff(data?.bsff);
  }, [data]);

  const title = "Signature émetteur";
  const TODAY = new Date();
  const { setHasValidationApiError } = useContext(ValidationBsdContext);

  const onSubmit = async values => {
    signBsff({
      variables: {
        id: bsff!.id,
        input: {
          type: BsffSignatureType.Emission,
          author: values.signatureAuthor,
          date: values.date.toISOString(),
        },
      },
    }).catch(() => {
      setHasValidationApiError(true);
    });
  };

  return bsff ? (
    <TdModal onClose={onClose} ariaLabel={title} isOpen={isOpen}>
      <h2 className="td-modal-title">{title}</h2>
      <BsffSummary bsff={bsff} />
      <Formik
        initialValues={{
          signatureAuthor: "",
          date: TODAY,
        }}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {() => (
          <Form>
            <p>
              En qualité <strong>d'émetteur du déchet</strong>, j'atteste que
              les informations ci-dessus sont correctes. En signant ce document,
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
                NOM et prénom du signataire
                <Field
                  className="td-input"
                  name="signatureAuthor"
                  placeholder="NOM Prénom"
                />
              </label>
              <RedErrorMessage name="signatureAuthor" />
            </div>

            {signBsffResult.error && (
              <NotificationError apolloError={signBsffResult.error} />
            )}

            <div className="td-modal-actions">
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={onClose}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={signBsffResult.loading}
              >
                <span>
                  {signBsffResult.loading ? "Signature en cours..." : "Signer"}
                </span>
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </TdModal>
  ) : (
    <Loader />
  );
};

export default React.memo(SignEmissionModal);
