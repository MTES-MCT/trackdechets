import React from "react";
import { fullFormFragment } from "../../../../../Apps/common/queries/fragments";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Field, Form as FormikForm, Formik } from "formik";
import * as yup from "yup";
import {
  EmitterType,
  Mutation,
  MutationSignTransportFormArgs,
  MutationUpdateFormArgs,
  Query,
  QueryFormArgs,
  TransportMode
} from "@td/codegen-ui";
import { RedErrorMessage } from "../../../../../common/components";
import { Loader } from "../../../../../Apps/common/Components";
import {
  InlineError,
  NotificationError,
  SimpleNotificationError
} from "../../../../../Apps/common/Components/Error/Error";
import { FormWasteTransportSummary } from "./FormWasteTransportSummary";
import { FormJourneySummary } from "./FormJourneySummary";
import SignatureCodeInput from "../../../../../form/common/components/custom-inputs/SignatureCodeInput";
import TransporterRecepisseWrapper from "../../../../../form/common/components/company/TransporterRecepisseWrapper";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import { subMonths } from "date-fns";
import {
  GET_FORM,
  UPDATE_FORM
} from "../../../../../Apps/common/queries/bsdd/queries";
import { cleanPackagings } from "../../../../../Apps/Forms/Components/PackagingList/helpers";
import { packagingInfo } from "../../../../../form/bsdd/utils/schema";

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
  update: yup.object({ packagingInfos: yup.array().of(packagingInfo) })
});
interface SignTransportFormModalProps {
  title: string;
  siret: string;
  formId: string;
  onClose: () => void;
}

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
  formId: string;
}

export default function SignTransportFormModalContent({
  title,
  siret,
  formId,
  onClose
}: SignTransportFormModalProps) {
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
  const [signTransportForm, { loading, error }] = useMutation<
    Pick<Mutation, "signTransportForm">,
    MutationSignTransportFormArgs
  >(SIGN_TRANSPORT_FORM, {
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
        data: { id: formId, status: data?.signTransportForm.status }
      });
    }
  });

  const [updateForm, { error: updateError }] = useMutation<
    Pick<Mutation, "updateForm">,
    MutationUpdateFormArgs
  >(UPDATE_FORM);

  if (formLoading) return <Loader />;
  if (formError) return <InlineError apolloError={formError} />;
  if (!data?.form) {
    return (
      <SimpleNotificationError message="Impossible de charger le bordereau" />
    );
  }
  const form = data?.form;

  const signingTransporter = [
    ...form.transporters,
    form.temporaryStorageDetail?.transporter
  ].find(
    t =>
      t !== null &&
      t !== undefined &&
      !t.takenOverAt &&
      t.company?.orgId === siret
  );

  const TODAY = new Date();

  return (
    <Formik
      initialValues={{
        takenOverBy: "",
        takenOverAt: TODAY.toISOString(),
        securityCode: "",
        transporterNumberPlate: signingTransporter?.numberPlate ?? "",
        transporterTransportMode: signingTransporter?.mode ?? null,
        emitter: { type: form?.emitter?.type },
        update: {
          quantity: form.wasteDetails?.quantity ?? 0,
          sampleNumber: form.wasteDetails?.sampleNumber ?? "",
          packagingInfos: form.wasteDetails?.packagingInfos ?? []
        }
      }}
      validationSchema={validationSchema}
      onSubmit={async values => {
        try {
          const { update } = values;
          const packagingsInfoUpdate = cleanPackagings(update.packagingInfos);
          if (
            update.sampleNumber ||
            (form.emitter?.type === EmitterType.Appendix1Producer &&
              (update.quantity || packagingsInfoUpdate.length > 0))
          ) {
            await updateForm({
              variables: {
                updateFormInput: {
                  id: form.id,
                  wasteDetails: {
                    ...(update.quantity && { quantity: update.quantity }),
                    ...(update.sampleNumber && {
                      sampleNumber: update.sampleNumber
                    }),
                    ...(update.packagingInfos.length > 0 && {
                      packagingInfos: packagingsInfoUpdate
                    })
                  }
                }
              }
            });
          }

          await signTransportForm({
            variables: {
              id: form.id,
              input: {
                takenOverAt: values.takenOverAt,
                takenOverBy: values.takenOverBy,
                transporterNumberPlate: values.transporterNumberPlate,
                transporterTransportMode:
                  values.transporterTransportMode as TransportMode
              },
              securityCode: values.securityCode
                ? Number(values.securityCode)
                : undefined
            }
          });
          onClose();
        } catch (_) {
          // Ignore error
        }
      }}
    >
      {() => (
        <FormikForm>
          <FormWasteTransportSummary form={form} />
          <FormJourneySummary form={form} />
          {form.emitter?.type !== EmitterType.Appendix1Producer && (
            <TransporterRecepisseWrapper transporter={signingTransporter!} />
          )}
          <p>
            En qualité de <strong>transporteur du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant ce document,
            je déclare prendre en charge le déchet.
          </p>

          <div className="form__row">
            <label>
              Date de prise en charge
              <div className="td-date-wrapper">
                <Field
                  name="takenOverAt"
                  component={DateInput}
                  minDate={subMonths(TODAY, 2)}
                  maxDate={TODAY}
                  required
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
            ...(form.transporters ?? []).map(t => t.company?.orgId),
            form.temporaryStorageDetail?.transporter?.company?.orgId
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
          {updateError && <NotificationError apolloError={updateError} />}

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
  );
}
