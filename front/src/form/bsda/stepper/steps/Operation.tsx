import { RedErrorMessage } from "common/components";
import DateInput from "form/common/components/custom-inputs/DateInput";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import { Field, useFormikContext } from "formik";
import { Bsda } from "generated/graphql/types";
import React from "react";

export default function Operation() {
  const { values } = useFormikContext<Bsda>();

  return (
    <>
      <h4 className="form__section-heading">Réception</h4>
      <div className="form__row">
        <label>
          Date de réception
          <Field
            component={DateInput}
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

      <h4 className="form__section-heading">Quantité</h4>

      <div className="form__row">
        <label>
          Quantité présentée
          <Field
            component={NumberInput}
            name="destination.reception.weight"
            className="td-input td-input--small"
          />
        </label>

        <RedErrorMessage name="destination.reception.weight" />
      </div>

      <h4 className="form__section-heading">Opération</h4>
      <div className="form__row">
        <label>
          Date de l'opération
          <Field
            component={DateInput}
            name="destination.operation.date"
            className={`td-input td-input--small`}
          />
        </label>

        <RedErrorMessage name="destination.operation.date" />
      </div>

      <div className="form__row">
        <label>Opération d’élimination / valorisation effectuée</label>
        <Field
          as="select"
          name="destination.operation.code"
          className="td-select"
        >
          <option value="...">Sélectionnez une valeur...</option>
          <option value="D 5">
            D 5 - Mise en décharge aménagée et autorisée en ISDD ou ISDND
          </option>
          <option value="D 9">
            D 9 - Vitrification, traitement chimique ou prétraitement
          </option>
          <option value="D 13">D 13 - Groupement de déchets</option>
          <option value="D 15">D 15 - Entreposage provisoire</option>
        </Field>
      </div>
    </>
  );
}
