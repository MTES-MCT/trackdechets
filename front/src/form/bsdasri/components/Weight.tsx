import TdSwitch from "common/components/Switch";
import { RedErrorMessage, FieldSwitch } from "common/components";
import { Field, useFormikContext } from "formik";
import { Bsdasri } from "generated/graphql/types";
import React from "react";

import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { getNestedNode } from "common/helper";

export default function WeightWidget({
  switchLabel,
  dasriPath,
  getInitialWeightFn,
  disabled = false,
}: {
  switchLabel: string;
  dasriPath: "emitter.emission" | "transporter.transport";
  getInitialWeightFn: () => any;
  disabled?: boolean;
}) {
  const { values, setFieldValue } = useFormikContext<Bsdasri>();
  const weightPath = `${dasriPath}.weight`;
  const showWeight = !!getNestedNode(values, dasriPath)?.weight;

  function handleWeightToggle() {
    if (showWeight) {
      setFieldValue(weightPath, null, false);
    } else {
      setFieldValue(weightPath, getInitialWeightFn(), false);
    }
  }

  return (
    <div className="form__row tw-mb-4">
      {!disabled && (
        <TdSwitch
          checked={showWeight}
          onChange={handleWeightToggle}
          label={switchLabel}
        />
      )}

      {showWeight && (
        <>
          <div className="form__row">
            <label>
              Quantité en kg :
              <Field
                component={NumberInput}
                name={`${weightPath}.value`}
                className="td-input dasri__waste-details__weight"
                disabled={disabled}
                placeholder="En kg"
                min="0"
                step="0.1"
              />
              <span className="tw-ml-2">kg</span>
            </label>

            <RedErrorMessage name={`${weightPath}.value`} />
          </div>

          <div className="form__row">
            <Field
              type="checkbox"
              label="Il s'agit d'une estimation"
              component={FieldSwitch}
              name={`${weightPath}.isEstimate`}
              disabled={disabled}
            />
          </div>
        </>
      )}
    </div>
  );
}
