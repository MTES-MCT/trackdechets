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
  title: string;
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

enum EmitterType {
  Emitter = "Emitter",
  EcoOrganisme = "EcoOrganisme",
}

function SignEmissionFormModal({
  title,
  siret,
  form,
  onClose,
}: SignEmissionFormModalProps) {
  const [signEmissionForm, { loading, error }] = useMutation<
    Pick<Mutation, "signEmissionForm">,
    MutationSignEmissionFormArgs
  >(SIGN_EMISSION_FORM);

  return (
    <Modal onClose={onClose} ariaLabel={title} isOpen>
      <h2 className="td-modal-title">{title}</h2>

      <Formik
        initialValues={{
          packagingInfos: form.stateSummary?.packagingInfos,
          quantity: form.stateSummary?.quantity ?? 0,
          onuCode: form.stateSummary?.onuCode ?? "",
          transporterNumberPlate:
            form.stateSummary?.transporterNumberPlate ?? "",
          emittedBy: "",
          emittedByType: EmitterType.Emitter,
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
                    values.emittedByType === EmitterType.EcoOrganisme,
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

          if (form.status === FormStatus.Resealed) {
            signatureAuthorSiret = form.recipient?.company?.siret;
          } else {
            if (values.emittedByType === EmitterType.EcoOrganisme) {
              signatureAuthorSiret = form.ecoOrganisme?.siret;
            } else {
              signatureAuthorSiret = form.emitter?.company?.siret;
            }
          }

          const EMITTER_TYPE_LABEL: Record<EmitterType, string> = {
            [EmitterType.Emitter]:
              form.status === FormStatus.Sealed
                ? "émetteur du déchet"
                : "entreposage provisoire",
            [EmitterType.EcoOrganisme]: "éco-organisme",
          };
          const emitterLabel = EMITTER_TYPE_LABEL[values.emittedByType];

          return (
            <FormikForm>
              <FormWasteEmissionSummary form={form} />
              <FormJourneySummary form={form} />

              {form.status === FormStatus.Sealed && form.ecoOrganisme && (
                <>
                  {Object.entries(EMITTER_TYPE_LABEL).map(([value, label]) => (
                    <div key={value} className="form__row">
                      <label>
                        <Field
                          type="radio"
                          name="emittedByType"
                          value={value}
                          className="td-radio"
                        />
                        Signer en tant que <strong>{label}</strong>
                      </label>
                    </div>
                  ))}
                </>
              )}

              <p className="tw-mt-4">
                En qualité d'<strong>{emitterLabel}</strong>, j'atteste que les
                informations ci-dessus sont correctes. En signant ce document,
                je déclare transférer le déchet.
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
                    Code de signature de l'{emitterLabel}
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
          );
        }}
      </Formik>
    </Modal>
  );
}

export default function SignEmissionForm({ siret, form }: WorkflowActionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  let emitterSirets = [form.emitter?.company?.siret, form.ecoOrganisme?.siret];
  let emitterLabel = "émetteur";

  if (FormStatus.Resealed) {
    emitterSirets = [form.recipient?.company?.siret];
    emitterLabel = "entreposage provisoire";
  }

  const currentUserIsEmitter = emitterSirets.includes(siret);
  const title = currentUserIsEmitter
    ? `Signer en tant que ${emitterLabel}`
    : `Faire signer l'${emitterLabel}`;

  return (
    <>
      <ActionButton
        icon={<IconShipmentSignSmartphone size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        {title}
      </ActionButton>
      {isOpen && (
        <SignEmissionFormModal
          title={title}
          siret={siret}
          form={form}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
