import { useMutation, useQuery } from "@apollo/client";
import { NotificationError } from "Apps/common/Components/Error/Error";
import Loader from "Apps/common/Components/Loader/Loaders";
import TdModal from "Apps/common/Components/Modal/Modal";
import { ValidationBsdContext } from "Pages/Dashboard";
import { RedErrorMessage } from "common/components";
import TagsInput from "common/components/tags-input/TagsInput";
import { BsffSummary } from "dashboard/components/BSDList/BSFF/WorkflowAction/BsffSummary";
import { subMonths } from "date-fns";
import {
  GET_BSFF_FORM,
  SIGN_BSFF,
  UPDATE_BSFF_FORM,
} from "form/bsff/utils/queries";
import TransporterReceipt from "form/common/components/company/TransporterReceipt";
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
  TransportMode,
} from "generated/graphql/types";
import React, { useContext, useEffect, useState } from "react";
import * as yup from "yup";

const validationSchema = yup.object({
  takenOverAt: yup.date().required("La date de prise en charge est requise"),
  signatureAuthor: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

const SignTransportModal = ({ bsffId, isOpen, onClose }) => {
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

  const title = "Signer l'enlèvement";
  const TODAY = new Date();
  const { setHasValidationApiError } = useContext(ValidationBsdContext);

  const onSubmit = async values => {
    await updateBsff({
      variables: {
        id: bsff!.id,
        input: {
          transporter: {
            transport: {
              takenOverAt: values.takenOverAt,
              plates: values.transporterTransportPlates,
              mode: bsff!.transporter?.transport?.mode ?? TransportMode.Road,
            },
          },
        },
      },
    });
    signBsff({
      variables: {
        id: bsff!.id,
        input: {
          type: BsffSignatureType.Transport,
          author: values.signatureAuthor,
          date: values.takenOverAt,
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
          takenOverAt: TODAY.toISOString(),
          transporterTransportPlates: bsff.transporter?.transport?.plates,
        }}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {() => (
          <Form>
            <p>
              En qualité de <strong>transporteur du déchet</strong>, j'atteste
              que les informations ci-dessus sont correctes. En signant ce
              document, je déclare prendre en charge le déchet.
            </p>
            <TransporterReceipt transporter={bsff.transporter!} />

            {!bsff.transporter?.transport?.mode ||
              (bsff.transporter?.transport?.mode === TransportMode.Road && (
                <div className="form__row">
                  <label htmlFor="transporterTransportPlates">
                    Immatriculations
                  </label>
                  <TagsInput name="transporterTransportPlates" />
                </div>
              ))}

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
                  {updateBsffResult.loading || signBsffResult.loading
                    ? "Signature en cours..."
                    : "Signer l'enlèvement"}
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

export default React.memo(SignTransportModal);
