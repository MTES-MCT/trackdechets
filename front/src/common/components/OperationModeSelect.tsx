import React, { useEffect, useMemo } from "react";
import { Field, Form, useFormikContext } from "formik";
import { RadioButton } from "../../form/common/components/custom-inputs/RadioButton";
import RedErrorMessage from "./RedErrorMessage";
import {
  getOperationModeLabel,
  getOperationModesFromOperationCode
} from "../operationModes";
import Tooltip from "./Tooltip";
import { deepValue } from "../../dashboard/detail/common/utils";

const OperationModeSelect = ({ operationCode, name }) => {
  const { setFieldValue, values } = useFormikContext();
  const modes = useMemo(
    () => getOperationModesFromOperationCode(operationCode),
    [operationCode]
  );

  useEffect(() => {
    const value = deepValue(values, name);

    if (!value || !modes.includes(value)) {
      setFieldValue(name, modes[0]);
    }
  }, [modes, name, setFieldValue, values]);

  if (!modes.length) return null;

  return (
    <Form>
      <div className="form__row">
        <fieldset>
          <legend>
            Mode de traitement{" "}
            <Tooltip msg="Le mode de traitement correspond à un des 4 choix de la hiérarchie des modes de traitement, il s'impose de lui même ou doit être précisé selon l'opération réalisée" />
          </legend>
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
