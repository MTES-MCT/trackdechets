import React from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { RedErrorMessage } from "../../../../../common/components";
import { Loader } from "../../../../../Apps/common/Components";
import {
  InlineError,
  NotificationError,
  SimpleNotificationError
} from "../../../../../Apps/common/Components/Error/Error";
import { fullFormFragment } from "../../../../../Apps/common/queries/fragments";
import { GET_FORM } from "../../../../../form/bsdd/utils/queries";
import {
  FormStatus,
  Mutation,
  MutationSignEmissionFormArgs,
  Query,
  QueryFormArgs
} from "codegen-ui";
import * as yup from "yup";
import { Field, Form as FormikForm, Formik } from "formik";
import { FormWasteEmissionSummary } from "./FormWasteEmissionSummary";
import { FormJourneySummary } from "./FormJourneySummary";
import SignatureCodeInput from "../../../../../form/common/components/custom-inputs/SignatureCodeInput";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import { subMonths } from "date-fns";

interface SignEmissionFormModalProps {
  title: string;
  siret: string;
  formId: string;
  onClose: () => void;
}

const validationSchema = yup.object({
  emittedAt: yup.date().required("La date d'émission est requise"),
  emittedBy: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
  securityCode: yup
    .string()
    .nullable()
    .matches(/[0-9]{4}/, "Le code de signature est composé de 4 chiffres")
});

enum EmitterType {
  Emitter = "Emitter",
  EcoOrganisme = "EcoOrganisme"
}

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

function SignEmissionFormModalContent({
  title,
  siret,
  formId,
  onClose
}: SignEmissionFormModalProps) {
  const {
    loading: formLoading,
    error: formError,
    data
  } = useQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
    variables: {
      id: formId,
      readableId: null
    },
    fetchPolicy: "no-cache"
  });

  const [signEmissionForm, { loading, error }] = useMutation<
    Pick<Mutation, "signEmissionForm">,
    MutationSignEmissionFormArgs
  >(SIGN_EMISSION_FORM, {
    // When we sign a Form, we must manually update the cached InitialForm as well
    update(cache, { data }) {
      cache.writeFragment({
        id: `InitialForm:${formId}`,
        fragment: gql`
          fragment InitialFormFragment on InitialForm {
            id
            status
          }
        `,
        data: { id: formId, status: data?.signEmissionForm.status }
      });
    }
  });

  const TODAY = new Date();

  if (formLoading) return <Loader />;
  if (formError) return <InlineError apolloError={formError} />;
  if (!data?.form) {
    return (
      <SimpleNotificationError message="Impossible de charger le bordereau" />
    );
  }
  const form = data?.form;
  const initialValues = {
    emittedAt: TODAY.toISOString(),
    emittedBy: "",
    emittedByType: EmitterType.Emitter,
    securityCode: "",
    emitter: { type: form?.emitter?.type },
    ...(form.status === FormStatus.Resealed
      ? {
          packagingInfos:
            form.temporaryStorageDetail?.wasteDetails?.packagingInfos,
          quantity: form.temporaryStorageDetail?.wasteDetails?.quantity ?? 0,
          onuCode: form.temporaryStorageDetail?.wasteDetails?.onuCode ?? "",
          transporterNumberPlate:
            form.temporaryStorageDetail?.transporter?.numberPlate ?? ""
        }
      : {
          packagingInfos: form.wasteDetails?.packagingInfos,
          quantity: form.wasteDetails?.quantity ?? 0,
          onuCode: form.wasteDetails?.onuCode ?? "",
          transporterNumberPlate: form.transporter?.numberPlate ?? ""
        })
  };

  const handlesubmit = async values => {
    try {
      await signEmissionForm({
        variables: {
          id: form.id,
          input: {
            quantity: values.quantity,
            onuCode: values.onuCode,
            packagingInfos: values.packagingInfos,
            transporterNumberPlate: values.transporterNumberPlate,
            emittedAt: values.emittedAt,
            emittedBy: values.emittedBy,
            emittedByEcoOrganisme:
              values.emittedByType === EmitterType.EcoOrganisme
          },
          securityCode: values.securityCode
            ? Number(values.securityCode)
            : undefined
        }
      });
      onClose();
    } catch (err) {
      // Ignore error
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handlesubmit}
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
          [EmitterType.EcoOrganisme]: "éco-organisme"
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
              informations ci-dessus sont correctes. En signant ce document, je
              déclare transférer le déchet.
            </p>

            <div className="form__row">
              <label>
                Date d'émission
                <div className="td-date-wrapper">
                  <Field
                    name="emittedAt"
                    component={DateInput}
                    minDate={subMonths(TODAY, 2)}
                    maxDate={TODAY}
                    required
                    className="td-input"
                  />
                </div>
              </label>
              <RedErrorMessage name="emittedAt" />
            </div>

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
  );
}

export default SignEmissionFormModalContent;
