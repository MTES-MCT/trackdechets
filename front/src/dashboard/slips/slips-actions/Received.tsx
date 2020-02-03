import React, { useEffect } from "react";
import { Formik, Field, Form, getIn } from "formik";
import { DateTime } from "luxon";
import NumberInput from "../../../form/custom-inputs/NumberInput";
import DateInput from "../../../form/custom-inputs/DateInput";
import { SlipActionProps } from "../SlipActions";
import { InlineRadioButton } from "../../../form/custom-inputs/RadioButton";
import { receivedFormSchema } from "../../../form/schema";
import { WasteAcceptationStatus } from "../../../Constants";

const textConfig = {
  [WasteAcceptationStatus.ACCEPTED]: {
    validationText:
      "En validant, je confirme la réception des déchets indiqués dans ce bordereau."
  },
  [WasteAcceptationStatus.REFUSED]: {
    validationText:
      "En refusant ce déchet, je le retourne à son producteur. Un mail automatique Trackdéchets, informera le producteur de ce refus, accompagné du BSD en pdf. L'inspection des ICPE et ma société en recevront une copie",
    refusalReasonText: "Motif du refus"
  },
  [WasteAcceptationStatus.PARTIALLY_REFUSED]: {
    validationText:
      "En validant, je confirme la réception des déchets pour la quantité indiquée dans ce bordereau. Un mail automatique Trackdéchets, informera le producteur de ce refus partiel, accompagné du BSD en pdf. L'inspection des ICPE et ma société en recevront une copie",
    refusalReasonText: "Motif du refus partiel"
  }
};
const FieldError = ({ fieldError }) =>
  !!fieldError ? <p className="text-red mt-0 mb-0">{fieldError}</p> : null;

export default function Received(props: SlipActionProps) {
  return (
    <div>
      <Formik
        initialValues={{
          receivedBy: "",
          receivedAt: DateTime.local().toISODate(),
          quantityReceived: "",
          wasteAcceptationStatus: "",
          wasteRefusalReason: ""
        }}
        onSubmit={values => props.onSubmit({ info: values })}
      >
        {({ values, errors, touched, handleReset, setFieldValue }) => {
          const hasErrors = !!Object.keys(errors).length;
          const isTouched = !!Object.keys(touched).length;

          return (
            <Form>
              <div className="form__group">
                <fieldset>
                  <div style={{ display: "flex" }}>
                    <h4 className="mr-2">Lot accepté: </h4>
                    <Field
                      name="wasteAcceptationStatus"
                      id={WasteAcceptationStatus.ACCEPTED}
                      label="Oui"
                      component={InlineRadioButton}
                      onChange={() => {
                        // clear wasteRefusalReason if waste is accepted
                        setFieldValue("wasteRefusalReason", "");
                        setFieldValue(
                          "wasteAcceptationStatus",
                          WasteAcceptationStatus.ACCEPTED
                        );
                      }}
                    />
                    <Field
                      name="wasteAcceptationStatus"
                      id={WasteAcceptationStatus.REFUSED}
                      label="Non"
                      component={InlineRadioButton}
                      onChange={() => {
                        setFieldValue("quantityReceived", 0);
                        setFieldValue(
                          "wasteAcceptationStatus",
                          WasteAcceptationStatus.REFUSED
                        );
                      }}
                    />
                    <Field
                      name="wasteAcceptationStatus"
                      id={WasteAcceptationStatus.PARTIALLY_REFUSED}
                      label="Partiellement"
                      component={InlineRadioButton}
                    />
                  </div>
                </fieldset>
              </div>

              <label>
                Nom du responsable
                <Field type="text" name="receivedBy" placeholder="NOM Prénom" />
                <FieldError fieldError={errors.receivedBy} />
              </label>
              <label>
                Date de réception
                <Field component={DateInput} name="receivedAt" />
                <FieldError fieldError={errors.receivedAt} />
              </label>
              <label>
                Poids à l'arrivée
                <Field
                  component={NumberInput}
                  name="quantityReceived"
                  placeholder="En tonnes"
                  disabled={
                    values.wasteAcceptationStatus ===
                    WasteAcceptationStatus.REFUSED
                  }
                />
                <FieldError fieldError={errors.quantityReceived} />
                <span>
                  Poids indicatif émis: {props.form.wasteDetails.quantity}{" "}
                  tonnes
                </span>
              </label>
              {/* Display wasteRefusalReason field if waste is refused or partially refused*/}
              {[
                WasteAcceptationStatus.REFUSED.toString(),
                WasteAcceptationStatus.PARTIALLY_REFUSED.toString()
              ].includes(values.wasteAcceptationStatus) && (
                <label>
                  {textConfig[values.wasteAcceptationStatus].refusalReasonText}
                  <Field name="wasteRefusalReason" />
                  <FieldError fieldError={errors.wasteRefusalReason} />
                </label>
              )}
              <p>
                {values.wasteAcceptationStatus &&
                  textConfig[values.wasteAcceptationStatus].validationText}
              </p>
              <div className="form__group button__group">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    handleReset();
                    props.onCancel();
                  }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className={
                    hasErrors || !isTouched
                      ? "button button--disabled"
                      : "button"
                  }
                  disabled={hasErrors || !isTouched}
                >
                  Je valide
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
