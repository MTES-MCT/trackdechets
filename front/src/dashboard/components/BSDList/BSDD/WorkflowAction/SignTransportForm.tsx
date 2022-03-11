import * as React from "react";
import { gql, useMutation } from "@apollo/client";
import { Field, Form as FormikForm, Formik } from "formik";
import * as yup from "yup";
import {
  Form,
  Mutation,
  MutationSignTransportFormArgs,
} from "generated/graphql/types";
import { fullFormFragment } from "common/fragments";
import { ActionButton, Modal, RedErrorMessage } from "common/components";
import { NotificationError } from "common/components/Error";
import { IconShipmentSignSmartphone } from "common/components/Icons";
import SignatureCodeInput from "form/common/components/custom-inputs/SignatureCodeInput";
import { WorkflowActionProps } from "./WorkflowAction";
import { FormJourneySummary } from "./FormJourneySummary";
import { FormWasteTransportSummary } from "./FormWasteTransportSummary";

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

interface SignTransportFormModalProps {
  siret: string;
  form: Form;
  onClose: () => void;
}

const validationSchema = yup.object({
  takenOverBy: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
  securityCode: yup
    .string()
    .nullable()
    .matches(/[0-9]{4}/, "Le code de signature est composé de 4 chiffres"),
});

function SignTransportFormModal({
  siret,
  form,
  onClose,
}: SignTransportFormModalProps) {
  const [signTransportForm, { loading, error }] = useMutation<
    Pick<Mutation, "signTransportForm">,
    MutationSignTransportFormArgs
  >(SIGN_TRANSPORT_FORM);
  return (
    <Modal onClose={onClose} ariaLabel="Signer pour le transporteur" isOpen>
      <h2 className="td-modal-title">Signer pour le transporteur</h2>

      <Formik
        initialValues={{
          takenOverBy: "",
          securityCode: "",
        }}
        validationSchema={validationSchema}
        onSubmit={async values => {
          try {
            await signTransportForm({
              variables: {
                id: form.id,
                input: {
                  takenOverAt: new Date().toISOString(),
                  takenOverBy: values.takenOverBy,
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

            {siret !== form.transporter?.company?.siret && (
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
                <span>
                  {loading
                    ? "Signature en cours..."
                    : "Signer pour le transporteur"}
                </span>
              </button>
            </div>
          </FormikForm>
        )}
      </Formik>
    </Modal>
  );
}

export default function SignTransportForm({
  siret,
  form,
}: WorkflowActionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ActionButton
        icon={<IconShipmentSignSmartphone size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Signer pour le transporteur
      </ActionButton>
      {isOpen && (
        <SignTransportFormModal
          siret={siret}
          form={form}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
