import { RedErrorMessage } from "common/components";
import Tooltip from "common/components/Tooltip";
import DateInput from "form/common/components/custom-inputs/DateInput";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import { Field, useFormikContext } from "formik";
import { Bsvhu, BsvhuDestinationType } from "generated/graphql/types";
import React from "react";
import TagsInput from "common/components/tags-input/TagsInput";

export default function Operation() {
  const { values } = useFormikContext<Bsvhu>();

  return (
    <>
      <h4 className="form__section-heading">Réception</h4>
      <div className="form__row">
        <label>
          Date de réception
          <Field
            component={DateInput}
            name="destination.reception.date"
            className="td-input td-input--small"
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

        {!!["REFUSED", "PARTIALLY_REFUSED"].includes(
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

      <div className="form__row">
        <label>
          En tonnes
          <Field
            component={NumberInput}
            name="destination.reception.weight"
            className="td-input td-input--small"
            placeholder="0"
            min="0"
            step="1"
          />
        </label>

        <RedErrorMessage name="destination.reception.weight" />
      </div>

      {values.destination?.type === BsvhuDestinationType.Demolisseur && (
        <>
          <h4 className="form__section-heading">Identification</h4>
          <div className="form__row">
            <label>
              Identification des numeros entrant des lots ou des VHU (livre de
              police)
              <Tooltip msg="Saisissez les identifications une par une. Appuyez sur la touche <Entrée> pour valider chacune" />
              <TagsInput name="destination.reception.identification.numbers" />
            </label>
          </div>
        </>
      )}

      <h4 className="form__section-heading">Quantité</h4>
      <div className="form__row">
        <label>
          En nombre
          <Field
            component={NumberInput}
            name="destination.reception.quantity"
            className="td-input td-input--small"
          />
        </label>

        <RedErrorMessage name="destination.reception.quantity" />
      </div>

      <h4 className="form__section-heading">Opération</h4>
      <div className="form__row">
        <label>
          Date de l'opération
          <Field
            component={DateInput}
            name="destination.operation.date"
            className="td-input td-input--small"
          />
        </label>

        <RedErrorMessage name="destination.operation.date" />
      </div>

      <div className="form__row tw-pb-6">
        <label>Opération d’élimination / valorisation effectuée</label>
        <Field
          as="select"
          name="destination.operation.code"
          className="td-select"
        >
          <option value="...">Sélectionnez une valeur...</option>
          <option value="R 4">
            R 4 - Recyclage ou récupération des métaux et des composés
            métalliques
          </option>
          <option value="R 12">
            R 12 - Échange de déchets en vue de les soumettre à l'une des
            opérations numérotées R1 à R11
          </option>
        </Field>
      </div>
    </>
  );
}
