import { useMutation, useQuery } from "@apollo/client";
import { NotificationError } from "Apps/common/Components/Error/Error";
import Loader from "Apps/common/Components/Loader/Loaders";
import TdModal from "Apps/common/Components/Modal/Modal";
import { ValidationBsdContext } from "Pages/Dashboard";
import { RedErrorMessage } from "common/components";
import { BsffSummary } from "dashboard/components/BSDList/BSFF/WorkflowAction/BsffSummary";
import { subMonths } from "date-fns";
import {
  GET_BSFF_FORM,
  SIGN_BSFF,
  UPDATE_BSFF_FORM,
} from "form/bsff/utils/queries";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { Field, Form, Formik } from "formik";
import {
  Bsff,
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
  MutationUpdateBsffArgs,
  Query,
  QueryBsffArgs,
} from "generated/graphql/types";
import React, { useContext, useEffect, useState } from "react";
import * as yup from "yup";

const validationSchema = yup.object({
  receptionDate: yup.date().required("La date de réception est requise"),
  signatureAuthor: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

const SignReceptionModal = ({ bsffId, isOpen, onClose }) => {
  const [bsff, setBsff] = useState<Bsff | undefined>();

  const { data } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: {
      id: bsffId,
    },
  });

  const [updateBsff, updateBsffResult] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);
  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  useEffect(() => {
    setBsff(data?.bsff);
  }, [data]);

  const title = "Signer la réception";
  const TODAY = new Date();
  const loading = updateBsffResult.loading || signBsffResult.loading;
  const error = updateBsffResult.error ?? signBsffResult.error;

  const { setHasValidationApiError } = useContext(ValidationBsdContext);

  const onSubmit = async values => {
    await updateBsff({
      variables: {
        id: bsff!.id,
        input: {
          destination: {
            reception: {
              date: values.receptionDate,
            },
          },
        },
      },
    });
    signBsff({
      variables: {
        id: bsff!.id,
        input: {
          type: BsffSignatureType.Reception,
          author: values.signatureAuthor,
          date: values.receptionDate,
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
          receptionDate:
            bsff.destination?.reception?.date ?? TODAY.toISOString(),
          signatureAuthor: "",
        }}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        <Form>
          <p>
            En qualité de <strong>destinataire du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant ce document,
            je déclare réceptionner le déchet.
          </p>
          <div className="form__row">
            <label>
              Date de réception
              <div className="td-date-wrapper">
                <Field
                  className="td-input"
                  name="receptionDate"
                  component={DateInput}
                  minDate={subMonths(TODAY, 2)}
                  maxDate={TODAY}
                  required
                />
              </div>
            </label>
            <RedErrorMessage name="receptionDate" />
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

          {error && <NotificationError apolloError={error} />}

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
              disabled={loading}
            >
              <span>{loading ? "Signature en cours..." : "Signer"}</span>
            </button>
          </div>
        </Form>
      </Formik>
    </TdModal>
  ) : (
    <Loader />
  );
};

export default React.memo(SignReceptionModal);
