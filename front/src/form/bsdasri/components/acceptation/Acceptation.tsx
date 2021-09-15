import RedErrorMessage from "common/components/RedErrorMessage";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { Field, FieldProps, useFormikContext } from "formik";
import { BsdasriWasteAcceptation } from "generated/graphql/types";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import React, { InputHTMLAttributes } from "react";

export default function Acceptation({
  field: { name, value },
  form,
  id,
  ...props
}: FieldProps<BsdasriWasteAcceptation | null> &
  InputHTMLAttributes<HTMLInputElement>) {
  const { setFieldValue } = useFormikContext();

  function handleAcceptationToggle() {
    setFieldValue(`${name}.refusedWeight`, null);
    setFieldValue(`${name}.refusalReason`, null);
    setFieldValue(`${name}.status`, "ACCEPTED");
  }
  return (
    <>
      <fieldset>
        <legend className="tw-font-semibold">Lot accepté</legend>
        <Field
          name={`${name}.status`}
          id="ACCEPTED"
          label="Accepté en totalité"
          component={RadioButton}
          disabled={props?.disabled}
          onChange={handleAcceptationToggle}
        />
        <Field
          name={`${name}.status`}
          id="REFUSED"
          label="Refusé"
          component={RadioButton}
          disabled={props?.disabled}
        />
        <Field
          name={`${name}.status`}
          id="PARTIALLY_REFUSED"
          label="Refus partiel"
          component={RadioButton}
          disabled={props?.disabled}
        />
      </fieldset>

      {!!["REFUSED", "PARTIALLY_REFUSED"].includes(value?.status ?? "") ? (
        <>
          <div className="form__row">
            <label>
              Quantité refusée
              <Field
                component={NumberInput}
                name={`${name}.refusedWeight`}
                className="td-input dasri__waste-details__weight"
                disabled={props?.disabled}
                placeholder="En kg"
                min="0"
                step="0.1"
              />
              <span className="tw-ml-2">kg</span>
            </label>

            <RedErrorMessage name="emission.quantity" />
          </div>
          <div className="form__row">
            <label>
              Motif de refus
              <Field
                component="textarea"
                name={`${name}.refusalReason`}
                className="td-textarea"
                disabled={props?.disabled}
              />{" "}
            </label>
          </div>
        </>
      ) : null}
    </>
  );
}
