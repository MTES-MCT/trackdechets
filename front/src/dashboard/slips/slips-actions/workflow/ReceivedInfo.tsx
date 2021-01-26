import React from "react";
import { Field, Form, Formik } from "formik";
import { isBefore, formatISO, startOfDay } from "date-fns";
import { parseDate } from "common/datetime";
import * as yup from "yup";
import { RedErrorMessage } from "common/components";
import NumberInput from "form/custom-inputs/NumberInput";
import DateInput from "form/custom-inputs/DateInput";
import { InlineRadioButton, RadioButton } from "form/custom-inputs/RadioButton";
import {
  WasteAcceptationStatusInput as WasteAcceptationStatus,
  FormStatus,
  Form as TdForm,
  QuantityType,
} from "generated/graphql/types";

export const textConfig: {
  [id: string]: {
    validationText: string;
    refusalReasonText?: string;
  };
} = {
  [WasteAcceptationStatus.Accepted]: {
    validationText:
      "En validant, je confirme la réception des déchets indiqués dans ce bordereau.",
  },
  [WasteAcceptationStatus.Refused]: {
    validationText:
      "En refusant ce déchet, je le retourne à son producteur. Un mail automatique Trackdéchets, informera le producteur de ce refus, accompagné du BSD en pdf. L'inspection des ICPE et ma société en recevront une copie",
    refusalReasonText: "Motif du refus",
  },
  [WasteAcceptationStatus.PartiallyRefused]: {
    validationText:
      "En validant, je confirme la réception des déchets pour la quantité indiquée dans ce bordereau. Un mail automatique Trackdéchets, informera le producteur de ce refus partiel, accompagné du BSD en pdf. L'inspection des ICPE et ma société en recevront une copie",
    refusalReasonText: "Motif du refus partiel",
  },
};

export type ReceivedInfoValues = {
  receivedBy: string;
  receivedAt: string;
  signedAt: string;
  quantityReceived: number | null;
  wasteAcceptationStatus: WasteAcceptationStatus | null;
  wasteRefusalReason: string;
  quantityType?: QuantityType;
};

const validationSchema = (form: TdForm) =>
  yup.object({
    wasteAcceptationStatus: yup
      .string()
      .nullable()
      .required("Le statut d'acceptation du lot est un champ requis"),
    quantityReceived: yup
      .number()
      .nullable()
      .required("Le poids à l'arrivée est un champ requis"),
    receivedAt: yup
      .date()
      .nullable()
      .required("La date de présentation est un champ requis")
      // we only care about the day, not the exact time
      .transform(value => startOfDay(parseDate(value)))
      .min(
        startOfDay(parseDate(form.sentAt!)),
        "La date de réception du déchet ne peut pas être antérieure à sa date d'émission."
      ),
    receivedBy: yup
      .string()
      .nullable()
      .required("Le nom du responsable est un champ requis"),
    signedAt: yup
      .date()
      .nullable()
      .required("La date de signature est un champ requis")
      .transform(value => startOfDay(parseDate(value))),
  });

/**
 * Reception info form shared between markAsReceived and markAsTempStored
 */
export default function ReceivedInfo({
  form,
  close,
  onSubmit,
}: {
  form: TdForm;
  onSubmit: (values: ReceivedInfoValues) => Promise<any>;
  close: () => void;
}) {
  return (
    <Formik<ReceivedInfoValues>
      initialValues={{
        receivedBy: "",
        receivedAt: formatISO(new Date(), { representation: "date" }),
        signedAt: formatISO(new Date(), { representation: "date" }),
        quantityReceived: null,
        wasteAcceptationStatus: null,
        wasteRefusalReason: "",
        ...(form.recipient?.isTempStorage &&
          form.status === FormStatus.Sent && {
            quantityType: QuantityType.Real,
          }),
      }}
      onSubmit={(values, { setSubmitting }) =>
        onSubmit(values).finally(() => setSubmitting(false))
      }
      validationSchema={() => validationSchema(form)}
    >
      {({ values, isSubmitting, handleReset, setFieldValue }) => (
        <Form>
          <p className="form__row">
            <label>
              Date de présentation
              <Field
                min={formatISO(parseDate(form.sentAt!), {
                  representation: "date",
                })}
                component={DateInput}
                name="receivedAt"
                className="td-input"
              />
            </label>
            <RedErrorMessage name="receivedAt" />
          </p>
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
          <p className="form__row">
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
          </p>
          {form.recipient?.isTempStorage && form.status === FormStatus.Sent && (
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
                label="Estimée"
                component={RadioButton}
              />
            </fieldset>
          )}
          {/* Display wasteRefusalReason field if waste is refused or partially refused*/}
          {values.wasteAcceptationStatus &&
            [
              WasteAcceptationStatus.Refused.toString(),
              WasteAcceptationStatus.PartiallyRefused.toString(),
            ].includes(values.wasteAcceptationStatus) && (
              <p className="form__row">
                <label>
                  {textConfig[values.wasteAcceptationStatus].refusalReasonText}
                  <Field name="wasteRefusalReason" className="td-input" />
                </label>
                <RedErrorMessage name="wasteRefusalReason" />
              </p>
            )}
          <p className="form__row">
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
          </p>
          <p className="form__row">
            <label>
              Date d'acceptation
              <Field
                min={formatISO(parseDate(form.sentAt!), {
                  representation: "date",
                })}
                component={DateInput}
                name="signedAt"
                className="td-input"
              />
            </label>
            <RedErrorMessage name="signedAt" />
          </p>
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
  );
}
