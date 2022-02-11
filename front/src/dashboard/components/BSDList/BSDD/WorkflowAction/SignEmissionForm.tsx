import * as React from "react";
import { gql, useMutation } from "@apollo/client";
import { Field, Form as FormikForm, Formik } from "formik";
import * as yup from "yup";
import {
  Form,
  FormStatus,
  Mutation,
  MutationSignEmissionFormArgs,
} from "generated/graphql/types";
import { fullFormFragment } from "common/fragments";
import { ActionButton, Modal, RedErrorMessage } from "common/components";
import { NotificationError } from "common/components/Error";
import { IconShipmentSignSmartphone } from "common/components/Icons";
import SignatureCodeInput from "form/common/components/custom-inputs/SignatureCodeInput";
import { WorkflowActionProps } from "./WorkflowAction";
import { FormJourneySummary } from "./FormJourneySummary";
import { FormWasteEmissionSummary } from "./FormWasteEmissionSummary";

const SIGN_EMISSION_FORM = gql`
  mutation SignEmissionForm(
    $id: ID!
    $input: SignEmissionFormInput!
    $securityCode: Int
  ) {
    signEmissionForm(id: $id, input: $input, securityCode: $securityCode) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

interface SignEmissionFormModalProps {
  siret: string;
  form: Form;
  onClose: () => void;
}

const validationSchema = yup.object({
  emittedBy: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
  securityCode: yup
    .string()
    .nullable()
    .matches(/[0-9]{4}/, "Le code de signature est composé de 4 chiffres"),
});

function SignEmissionFormModal({
  siret,
  form,
  onClose,
}: SignEmissionFormModalProps) {
  const [signEmissionForm, { loading, error }] = useMutation<
    Pick<Mutation, "signEmissionForm">,
    MutationSignEmissionFormArgs
  >(SIGN_EMISSION_FORM);
  return (
    <Modal onClose={onClose} ariaLabel="Signer l'enlèvement" isOpen>
      <h2 className="td-modal-title">Signer l'enlèvement</h2>

      <Formik
        initialValues={{
          packagingInfos: form.stateSummary?.packagingInfos,
          quantity: form.stateSummary?.quantity ?? 0,
          onuCode: form.stateSummary?.onuCode ?? "",
          transporterNumberPlate:
            form.stateSummary?.transporterNumberPlate ?? "",
          emittedBy: "",
          emittedByType: "emitter",
          securityCode: "",
        }}
        validationSchema={validationSchema}
        onSubmit={async values => {
          try {
            await signEmissionForm({
              variables: {
                id: form.id,
                input: {
                  quantity: values.quantity,
                  onuCode: values.onuCode,
                  packagingInfos: values.packagingInfos,
                  transporterNumberPlate: values.transporterNumberPlate,
                  emittedAt: new Date().toISOString(),
                  emittedBy: values.emittedBy,
                  emittedByEcoOrganisme:
                    values.emittedByType === "ecoOrganisme",
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
        {({ values }) => {
          let signatureAuthorSiret: string | null | undefined = undefined;
          let signatureAuthorType =
            values.emittedByType === "emitter"
              ? "détenteur du déchet"
              : "éco-organisme";

          if (form.status === FormStatus.Resealed) {
            signatureAuthorSiret = form.recipient?.company?.siret;
          } else {
            if (values.emittedByType === "ecoOrganisme") {
              signatureAuthorSiret = form.ecoOrganisme?.siret;
            } else {
              signatureAuthorSiret = form.emitter?.company?.siret;
            }
          }

          return (
            <FormikForm>
              <FormWasteEmissionSummary form={form} />
              <FormJourneySummary form={form} />
              {form.status === FormStatus.Sealed && form.ecoOrganisme && (
                <>
                  <div className="form__row">
                    <label>
                      <Field
                        type="radio"
                        name="emittedByType"
                        value="emitter"
                        className="td-radio"
                      />
                      Signer en tant que <strong>détenteur du déchet</strong>
                    </label>
                  </div>
                  <div className="form__row">
                    <label>
                      <Field
                        type="radio"
                        name="emittedByType"
                        value="ecoOrganisme"
                        className="td-radio"
                      />
                      Signer en tant que <strong>éco-organisme</strong>
                    </label>
                  </div>
                </>
              )}

              <p className="tw-mt-4">
                En qualité de <strong>{signatureAuthorType}</strong>, j'atteste
                que les informations ci-dessus sont correctes. En signant ce
                document, je déclare prendre en charge le déchet.
              </p>

              <div className="form__row">
                <label>
                  NOM et prénom du signataire
                  <Field
                    className="td-input"
                    name="emittedBy"
                    placeholder="NOM Prénom"
                  />
                </label>
                <RedErrorMessage name="emittedBy" />
              </div>

              {siret !== signatureAuthorSiret && (
                <div className="form__row">
                  <label>
                    Code de signature
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
                    {loading ? "Signature en cours..." : "Signer l'enlèvement"}
                  </span>
                </button>
              </div>
            </FormikForm>
          );
        }}
      </Formik>
    </Modal>
  );
}

export default function SignEmissionForm({ siret, form }: WorkflowActionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ActionButton
        icon={<IconShipmentSignSmartphone size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Signer l'enlèvement
      </ActionButton>
      {isOpen && (
        <SignEmissionFormModal
          siret={siret}
          form={form}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
