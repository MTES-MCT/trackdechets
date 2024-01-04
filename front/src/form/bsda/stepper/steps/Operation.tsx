import { RedErrorMessage } from "../../../../common/components";
import OperationModeSelect from "../../../../common/components/OperationModeSelect";
import { subMonths } from "date-fns";
import DateInput from "../../../common/components/custom-inputs/DateInput";
import NumberInput from "../../../common/components/custom-inputs/NumberInput";
import { RadioButton } from "../../../common/components/custom-inputs/RadioButton";
import { Field, useFormikContext } from "formik";
import { Bsda } from "@td/codegen-ui";
import React, { useEffect } from "react";

type Props = {
  bsda: Bsda;
};

export default function Operation({ bsda }: Props) {
  const { values, setFieldValue } = useFormikContext<Bsda>();

  useEffect(() => {
    const acceptationStatus = values.destination?.reception?.acceptationStatus;
    if (acceptationStatus === "REFUSED") {
      setFieldValue("destination.reception.weight", 0);
      setFieldValue("destination.operation.code", "");
      setFieldValue("destination.operation.date", null);
    }
    if (acceptationStatus === "ACCEPTED") {
      setFieldValue("destination.reception.refusalReason", "");
    }
  }, [values.destination?.reception?.acceptationStatus, setFieldValue]);

  const TODAY = new Date();

  return (
    <>
      <h4 className="form__section-heading">Réception</h4>
      <div className="form__row">
        <label>
          Date de réception
          <Field
            component={DateInput}
            minDate={subMonths(TODAY, 2)}
            maxDate={TODAY}
            name="destination.reception.date"
            className={`td-input td-input--small`}
          />
        </label>

        <RedErrorMessage name="destination.reception.date" />
      </div>

      <div className="form__row">
        <fieldset>
          <legend className="tw-font-semibold">Lot accepté</legend>
          <Field
            name={`destination.reception.acceptationStatus`}
            id="ACCEPTED"
            label="Accepté en totalité"
            component={RadioButton}
          />
          <Field
            name={`destination.reception.acceptationStatus`}
            id="REFUSED"
            label="Refusé"
            component={RadioButton}
          />
          <Field
            name={`destination.reception.acceptationStatus`}
            id="PARTIALLY_REFUSED"
            label="Refus partiel"
            component={RadioButton}
          />
        </fieldset>

        {["REFUSED", "PARTIALLY_REFUSED"].includes(
          values.destination?.reception?.acceptationStatus ?? ""
        ) ? (
          <div className="form__row">
            <label>
              Motif de refus
              <Field
                component="textarea"
                name={`destination.reception.refusalReason`}
                className="td-textarea"
              />
            </label>
          </div>
        ) : null}
      </div>
      {values.destination?.reception?.acceptationStatus !== "REFUSED" && (
        <>
          <h4 className="form__section-heading">Quantité</h4>

          <div className="form__row">
            <label>
              Quantité présentée en tonnes
              <Field
                component={NumberInput}
                name="destination.reception.weight"
                className="td-input td-input--small"
              />
            </label>

            <RedErrorMessage name="destination.reception.weight" />
          </div>
          {bsda.weight?.value && (
            <p className="tw-text-sm">
              <em>Quantité prévue: {bsda.weight?.value} tonnes</em>
            </p>
          )}

          <h4 className="form__section-heading">Opération</h4>
          <div className="form__row">
            <label>
              Date de l'opération
              <Field
                component={DateInput}
                minDate={subMonths(TODAY, 2)}
                maxDate={TODAY}
                name="destination.operation.date"
                className={`td-input td-input--small`}
              />
            </label>

            <RedErrorMessage name="destination.operation.date" />
          </div>

          <div className="form__row">
            <label>Opération d'élimination / valorisation effectuée</label>
            <Field
              as="select"
              name="destination.operation.code"
              className="td-select"
            >
              <option value="...">Sélectionnez une valeur...</option>
              <option value="R 5">
                R 5 - Recyclage ou récupération d'autres matières inorganiques
                (dont vitrification)
              </option>
              <option value="D 5">
                D 5 - Mise en décharge aménagée et autorisée en ISDD ou ISDND
              </option>
              <option value="D 9">
                D 9 - Traitement chimique ou prétraitement (dont vitrification)
              </option>
              <option value="R 13">
                R 13 - Opérations de transit incluant le groupement sans
                transvasement préalable à R 5
              </option>
              <option value="D 15">
                D 15 - Transit incluant le groupement sans transvasement
              </option>
            </Field>
            <p>Opération prévue: {values.destination?.plannedOperationCode}</p>
          </div>

          <OperationModeSelect
            operationCode={values.destination?.operation?.code}
            name="destination.operation.mode"
          />

          <div className="form__row">
            <label>
              Description de l'opération (Optionnel)
              <Field
                type="text"
                name="destination.operation.description"
                placeholder="ISDD, ISDND, etc."
                className="td-input"
              />
            </label>
          </div>
        </>
      )}
    </>
  );
}
