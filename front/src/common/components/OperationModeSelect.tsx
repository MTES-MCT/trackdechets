import React, { useEffect, useMemo } from "react";
import { Field, Form, useFormikContext } from "formik";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import RedErrorMessage from "./RedErrorMessage";
import {
  getOperationModeLabel,
  getOperationModesFromOperationCode,
} from "common/operationModes";

const OperationModeSelect = ({ operationCode, name }) => {
  const { setFieldValue, values } = useFormikContext();
  const modes = useMemo(
    () => getOperationModesFromOperationCode(operationCode),
    [operationCode]
  );

  useEffect(() => {
    // @ts-ignore
    if (!values[name] || !modes.includes(values[name])) {
      setFieldValue(name, modes[0]);
    }
  }, [modes, name, setFieldValue, values]);

  if (!modes.length) return null;

  return (
    <Form>
      <div className="form__row">
        <fieldset>
          <legend>Mode de traitement</legend>
          <div className="tw-flex">
            {modes.map(mode => (
              <Field
                key={mode}
                name={name}
                id={mode}
                label={getOperationModeLabel(mode)}
                component={RadioButton}
              />
            ))}
          </div>
        </fieldset>

        <RedErrorMessage name={name} />
      </div>
    </Form>
  );
};
export default OperationModeSelect;
