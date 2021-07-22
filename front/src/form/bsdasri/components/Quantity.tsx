import TdSwitch from "common/components/Switch";
import { RedErrorMessage } from "common/components";
import { Field, useFormikContext } from "formik";
import { Bsdasri } from "generated/graphql/types";
import React from "react";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import NumberInput from "form/common/components/custom-inputs/NumberInput";

export default function QuantityWidget({
  switchLabel,
  dasriSection,
  getInitialQuantityFn,
  disabled = false,
}: {
  switchLabel: string;
  dasriSection: "emission" | "transport";
  getInitialQuantityFn: () => any;
  disabled?: boolean;
}) {
  const { values, setFieldValue } = useFormikContext<Bsdasri>();

  const showQuantity = !!values[dasriSection]?.wasteDetails?.quantity;

  function handleQuantityToggle() {
    if (showQuantity) {
      setFieldValue(`${dasriSection}.wasteDetails.quantity`, null, false);
    } else {
      setFieldValue(
        `${dasriSection}.wasteDetails.quantity`,
        getInitialQuantityFn(),
        false
      );
    }
  }

  return (
    <div className="form__row tw-mb-4">
      {!disabled && (
        <TdSwitch
          checked={showQuantity}
          onChange={handleQuantityToggle}
          label={switchLabel}
        />
      )}

      {showQuantity && (
        <>
          <div className="form__row">
            <label>
              Quantité en kg :
              <Field
                component={NumberInput}
                name={`${dasriSection}.wasteDetails.quantity.value`}
                className="td-input dasri__waste-details__quantity"
                disabled={disabled}
                placeholder="En kg"
                min="0"
                step="0.1"
              />
              <span className="tw-ml-2">kg</span>
            </label>

            <RedErrorMessage
              name={`${dasriSection}.wasteDetails.quantity.value`}
            />
          </div>

          <div className="form__row">
            <fieldset>
              <legend className="tw-font-semibold">Cette quantité est</legend>
              <Field
                name={`${dasriSection}.wasteDetails.quantity.type`}
                id="REAL"
                label="Réélle"
                component={RadioButton}
                disabled={disabled}
              />
              <Field
                name={`${dasriSection}.wasteDetails.quantity.type`}
                id="ESTIMATED"
                label="Estimée"
                component={RadioButton}
                disabled={disabled}
              />
            </fieldset>
          </div>
        </>
      )}
    </div>
  );
}
