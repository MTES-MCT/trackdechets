import React from "react";
import { Field, Form, Formik } from "formik";
import { startOfDay } from "date-fns";
import { parseDate } from "../../../../../common/datetime";
import * as yup from "yup";
import { RedErrorMessage } from "../../../../../common/components";
import { Loader } from "../../../../../Apps/common/Components";
import NumberInput from "../../../../../form/common/components/custom-inputs/NumberInput";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import {
  InlineRadioButton,
  RadioButton
} from "../../../../../form/common/components/custom-inputs/RadioButton";
import {
  WasteAcceptationStatus,
  FormStatus,
  Form as TdForm,
  QuantityType,
  MutationMarkAsReceivedArgs,
  Mutation,
  MutationMarkAsTempStoredArgs
} from "@td/codegen-ui";
import { gql, useMutation } from "@apollo/client";
import { statusChangeFragment } from "../../../../../Apps/common/queries/fragments";
import { GET_BSDS } from "../../../../../Apps/common/queries";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import EstimatedQuantityTooltip from "../../../../../common/components/EstimatedQuantityTooltip";

export const textConfig: {
  [id: string]: {
    validationText: string;
    refusalReasonText?: string;
  };
} = {
  [WasteAcceptationStatus.Accepted]: {
    validationText:
      "En validant, je confirme la réception des déchets indiqués dans ce bordereau."
  },
  [WasteAcceptationStatus.Refused]: {
    validationText:
      "En refusant ce déchet, je le retourne à son producteur. Un mail automatique Trackdéchets, informera le producteur de ce refus, accompagné du récépissé en PDF. L'inspection des ICPE et ma société en recevront une copie",
    refusalReasonText: "Motif du refus"
  },
  [WasteAcceptationStatus.PartiallyRefused]: {
    validationText:
      "En validant, je confirme la réception des déchets pour la quantité indiquée dans ce bordereau. Un mail automatique Trackdéchets informera le producteur de ce refus partiel, accompagné du récépissé en PDF. L'inspection des ICPE et ma société en recevront une copie",
    refusalReasonText: "Motif du refus partiel"
  }
};

export type ReceivedInfoValues = {
  receivedBy: string;
  receivedAt: Date;
  signedAt: Date;
  quantityReceived: number | null;
  wasteAcceptationStatus: WasteAcceptationStatus | null;
  wasteRefusalReason: string;
  quantityType?: QuantityType;
};

const validationSchema = (form: TdForm, today: Date) => {
  return yup.object({
    wasteAcceptationStatus: yup.string().nullable(),
    quantityReceived: yup
      .number()
      .nullable()
      .required("Le poids à l'arrivée est un champ requis"),
    receivedAt: yup
      .date()
      .nullable()
      .required("La date de présentation est un champ requis")
      .min(
        startOfDay(parseDate(form.takenOverAt!)),
        "La date de réception du déchet ne peut pas être antérieure à sa date d'enlèvement."
      )
      // we only care about the day, not the exact time
      .transform(value => startOfDay(parseDate(value))),
    receivedBy: yup
      .string()
      .nullable()
      .required("Le nom du responsable est un champ requis"),
    signedAt: yup
      .date()
      .nullable()
      .required("La date d'acceptation est un champ requis")
      .when("receivedAt", receivedAt =>
        receivedAt
          ? yup
              .date()
              .min(
                startOfDay(parseDate(receivedAt)),
                "La date d'acceptation ne peut pas être antérieure à la date de réception."
              )
          : yup.date().required("La date d'acceptation est un champ requis")
      )
      .max(today, "La date d'acceptation ne peut être dans le futur")
      // we only care about the day, not the exact time
      .transform(value => {
        startOfDay(value);
      })
  });
};

const MARK_AS_RECEIVED = gql`
  mutation MarkAsReceived($id: ID!, $receivedInfo: ReceivedFormInput!) {
    markAsReceived(id: $id, receivedInfo: $receivedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

const MARK_AS_TEMP_STORED = gql`
  mutation MarkAsTempStored($id: ID!, $tempStoredInfos: TempStoredFormInput!) {
    markAsTempStored(id: $id, tempStoredInfos: $tempStoredInfos) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

/**
 * Reception info form shared between markAsReceived and markAsTempStored
 */
export default function ReceivedInfo({
  form,
  close,
  isTempStorage
}: {
  form: TdForm;
  close: () => void;
  isTempStorage: boolean;
}) {
  const [
    markAsReceived,
    { loading: loadingMarkAsReceived, error: errorMarkAsReceived }
  ] = useMutation<Pick<Mutation, "markAsReceived">, MutationMarkAsReceivedArgs>(
    MARK_AS_RECEIVED,
    {
      refetchQueries: [GET_BSDS],
      awaitRefetchQueries: true,
      onError: () => {
        // The error is handled in the UI
      },
      onCompleted: close
    }
  );

  const [
    markAsTempStored,
    { loading: loadingMarkAsTempStored, error: errorMarkAsTempStored }
  ] = useMutation<
    Pick<Mutation, "markAsTempStored">,
    MutationMarkAsTempStoredArgs
  >(MARK_AS_TEMP_STORED, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onError: () => {
      // The error is handled in the UI
    }
  });

  const TODAY = new Date();

  return (
    <>
      <Formik<ReceivedInfoValues>
        initialValues={{
          receivedBy: "",
          receivedAt: TODAY,
          signedAt: TODAY,
          quantityReceived: null,
          wasteAcceptationStatus: null,
          wasteRefusalReason: "",
          ...(form.recipient?.isTempStorage &&
            form.status === FormStatus.Sent && {
              quantityType: QuantityType.Real
            })
        }}
        onSubmit={async values => {
          const { errors } = await (isTempStorage
            ? markAsTempStored({
                variables: {
                  id: form.id,
                  tempStoredInfos: {
                    ...values,
                    receivedAt: parseDate(values.receivedAt).toISOString(),
                    signedAt: parseDate(values.signedAt).toISOString(),
                    quantityType: values.quantityType ?? QuantityType.Real,
                    quantityReceived: values.quantityReceived ?? 0,
                    wasteAcceptationStatus:
                      values.wasteAcceptationStatus ??
                      WasteAcceptationStatus.Accepted
                  }
                }
              })
            : markAsReceived({
                variables: {
                  id: form.id,
                  receivedInfo: {
                    ...values,
                    receivedAt: parseDate(values.receivedAt).toISOString(),
                    signedAt: parseDate(values.signedAt).toISOString()
                  }
                }
              }));
          if (!errors) {
            close();
          }
        }}
        validationSchema={() => validationSchema(form, TODAY)}
      >
        {({ values, isSubmitting, handleReset, setFieldValue }) => (
          <Form>
            <div className="form__row">
              <label>
                Date de présentation
                <Field
                  component={DateInput}
                  minDate={parseDate(form.takenOverAt!)}
                  maxDate={TODAY}
                  name="receivedAt"
                  className="td-input"
                />
              </label>
              <RedErrorMessage name="receivedAt" />
            </div>
            <div className="form__row">
              <div className="form__row">
                <fieldset className="form__radio-group">
                  <h4 className="tw-mr-2">Lot accepté: </h4>
                  <Field
                    name="wasteAcceptationStatus"
                    id={WasteAcceptationStatus.Accepted}
                    label="Oui"
                    component={InlineRadioButton}
                    onChange={() => {
                      // clear wasteRefusalReason if waste is accepted
                      setFieldValue("wasteRefusalReason", "");
                      setFieldValue(
                        "wasteAcceptationStatus",
                        WasteAcceptationStatus.Accepted
                      );
                    }}
                  />
                  <Field
                    name="wasteAcceptationStatus"
                    id={WasteAcceptationStatus.Refused}
                    label="Non"
                    component={InlineRadioButton}
                    onChange={() => {
                      setFieldValue("quantityReceived", 0);
                      setFieldValue(
                        "wasteAcceptationStatus",
                        WasteAcceptationStatus.Refused
                      );
                    }}
                  />
                  <Field
                    name="wasteAcceptationStatus"
                    id={WasteAcceptationStatus.PartiallyRefused}
                    label="Partiellement"
                    component={InlineRadioButton}
                  />
                </fieldset>
                <RedErrorMessage name="wasteAcceptationStatus" />
              </div>
            </div>
            <div className="form__row">
              <label>
                Poids à l'arrivée
                <Field
                  component={NumberInput}
                  name="quantityReceived"
                  placeholder="En tonnes"
                  className="td-input"
                  disabled={
                    values.wasteAcceptationStatus ===
                    WasteAcceptationStatus.Refused
                  }
                />
                <span>
                  Poids indicatif émis: {form.stateSummary?.quantity} tonnes
                </span>
              </label>
              <RedErrorMessage name="quantityReceived" />
            </div>
            {form.recipient?.isTempStorage &&
              form.status === FormStatus.Sent && (
                <fieldset className="form__row">
                  <legend>Cette quantité est</legend>
                  <Field
                    name="quantityType"
                    id="REAL"
                    label="Réelle"
                    component={RadioButton}
                  />
                  <Field
                    name="quantityType"
                    id="ESTIMATED"
                    label={
                      <>
                        Estimée <EstimatedQuantityTooltip />
                      </>
                    }
                    component={RadioButton}
                  />
                </fieldset>
              )}
            {/* Display wasteRefusalReason field if waste is refused or partially refused*/}
            {values.wasteAcceptationStatus &&
              [
                WasteAcceptationStatus.Refused.toString(),
                WasteAcceptationStatus.PartiallyRefused.toString()
              ].includes(values.wasteAcceptationStatus) && (
                <div className="form__row">
                  <label>
                    {
                      textConfig[values.wasteAcceptationStatus]
                        .refusalReasonText
                    }
                    <Field name="wasteRefusalReason" className="td-input" />
                  </label>
                  <RedErrorMessage name="wasteRefusalReason" />
                </div>
              )}
            <div className="form__row">
              <label>
                Nom du responsable
                <Field
                  type="text"
                  name="receivedBy"
                  placeholder="NOM Prénom"
                  className="td-input"
                />
              </label>
              <RedErrorMessage name="receivedBy" />
            </div>
            <div className="form__row">
              <label>
                {values.wasteAcceptationStatus ===
                WasteAcceptationStatus.Refused
                  ? "Date de refus"
                  : "Date d'acceptation"}
                <Field
                  component={DateInput}
                  minDate={parseDate(values.receivedAt)}
                  maxDate={TODAY}
                  name="signedAt"
                  className="td-input"
                />
              </label>
              <RedErrorMessage name="signedAt" />
            </div>
            <p>
              {values.wasteAcceptationStatus &&
                textConfig[values.wasteAcceptationStatus].validationText}
            </p>
            <div className="form__actions">
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={() => {
                  handleReset();
                  close();
                }}
              >
                Annuler
              </button>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={isSubmitting}
              >
                Je valide la réception
              </button>
            </div>
          </Form>
        )}
      </Formik>
      {errorMarkAsReceived && (
        <NotificationError
          className="action-error"
          apolloError={errorMarkAsReceived}
        />
      )}
      {errorMarkAsTempStored && (
        <NotificationError
          className="action-error"
          apolloError={errorMarkAsTempStored}
        />
      )}
      {(loadingMarkAsReceived || loadingMarkAsTempStored) && <Loader />}
    </>
  );
}
