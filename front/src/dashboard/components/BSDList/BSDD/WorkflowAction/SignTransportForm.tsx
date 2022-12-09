import * as React from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Field, Form as FormikForm, Formik } from "formik";
import * as yup from "yup";
import {
  Mutation,
  MutationSignTransportFormArgs,
  Query,
  QueryFormArgs,
} from "generated/graphql/types";
import { fullFormFragment } from "common/fragments";
import { ActionButton, Modal, RedErrorMessage } from "common/components";
import {
  NotificationError,
  SimpleNotificationError,
  InlineError,
} from "common/components/Error";
import { IconShipmentSignSmartphone } from "common/components/Icons";
import SignatureCodeInput from "form/common/components/custom-inputs/SignatureCodeInput";
import { WorkflowActionProps } from "./WorkflowAction";
import { FormJourneySummary } from "./FormJourneySummary";
import { FormWasteTransportSummary } from "./FormWasteTransportSummary";
import { GET_FORM } from "form/bsdd/utils/queries";
import Loader from "common/components/Loaders";
import DateInput from "form/common/components/custom-inputs/DateInput";

const SIGN_TRANSPORT_FORM = gql`
  mutation SignTransportForm(
    $id: ID!
    $input: SignTransportFormInput!
    $securityCode: Int
  ) {
    signTransportForm(id: $id, input: $input, securityCode: $securityCode) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

const validationSchema = yup.object({
  takenOverAt: yup.date().required("La date de prise en charge est requise"),
  takenOverBy: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
  securityCode: yup
    .string()
    .nullable()
    .matches(/[0-9]{4}/, "Le code de signature est composé de 4 chiffres"),
});
interface SignTransportFormModalProps {
  title: string;
  siret: string;
  formId: string;
  onClose: () => void;
}
function SignTransportFormModal({
  title,
  siret,
  formId,
  onClose,
}: SignTransportFormModalProps) {
  const {
    loading: formLoading,
    error: formError,
    data,
  } = useQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
    variables: {
      id: formId,
      readableId: null,
    },
    fetchPolicy: "no-cache",
  });
  const [signTransportForm, { loading, error }] =
    useMutation<
      Pick<Mutation, "signTransportForm">,
      MutationSignTransportFormArgs
    >(SIGN_TRANSPORT_FORM);

  if (formLoading) return <Loader />;
  if (formError) return <InlineError apolloError={formError} />;
  if (!data?.form) {
    return (
      <SimpleNotificationError message="Impossible de charger le bordereau" />
    );
  }
  const form = data?.form;
  return (
    <Modal onClose={onClose} ariaLabel={title} isOpen>
      <h2 className="td-modal-title">{title}</h2>

      <Formik
        initialValues={{
          takenOverBy: "",
          takenOverAt: new Date().toISOString(),
          securityCode: "",
          transporterNumberPlate:
            form.stateSummary?.transporterNumberPlate ?? "",
        }}
        validationSchema={validationSchema}
        onSubmit={async values => {
          try {
            await signTransportForm({
              variables: {
                id: form.id,
                input: {
                  takenOverAt: values.takenOverAt,
                  takenOverBy: values.takenOverBy,
                  transporterNumberPlate: values.transporterNumberPlate,
                },
                securityCode: values.securityCode
                  ? Number(values.securityCode)
                  : undefined,
              },
            });
            onClose();
          } catch (err) {}
        }}
      >
        {() => (
          <FormikForm>
            <FormWasteTransportSummary form={form} />
            <FormJourneySummary form={form} />

            <p>
              En qualité de <strong>transporteur du déchet</strong>, j'atteste
              que les informations ci-dessus sont correctes. En signant ce
              document, je déclare prendre en charge le déchet.
            </p>

            <div className="form__row">
              <label className="tw-font-semibold">
                Date de prise en charge
                <div className="td-date-wrapper">
                  <Field
                    name="takenOverAt"
                    component={DateInput}
                    className="td-input"
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
                  name="takenOverBy"
                  placeholder="NOM Prénom"
                />
              </label>
              <RedErrorMessage name="takenOverBy" />
            </div>

            {![
              form.transporter?.company?.siret,
              form.temporaryStorageDetail?.transporter?.company?.siret,
            ].includes(siret) && (
              <div className="form__row">
                <label>
                  Code de signature du transporteur
                  <Field
                    component={SignatureCodeInput}
                    className="td-input"
                    name="securityCode"
                    placeholder="1234"
                  />
                </label>
                <RedErrorMessage name="securityCode" />
              </div>
            )}

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
                <span>{loading ? "Signature en cours..." : title}</span>
              </button>
            </div>
          </FormikForm>
        )}
      </Formik>
    </Modal>
  );
}

interface SignTransportFormModalProps {
  siret: string;
  formId: string;
}

export default function SignTransportForm({
  siret,
  form,
}: WorkflowActionProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const title = "Signature transporteur";

  return (
    <>
      <ActionButton
        icon={<IconShipmentSignSmartphone size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        {title}
      </ActionButton>
      {isOpen && (
        <SignTransportFormModal
          title={title}
          siret={siret}
          formId={form.id}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
