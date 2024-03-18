import React, { useEffect, useMemo } from "react";
import { Field, Form, useFormikContext } from "formik";
import { RadioButton } from "../../form/common/components/custom-inputs/RadioButton";
import RedErrorMessage from "./RedErrorMessage";
import {
  getOperationModeLabel,
  getOperationModesFromOperationCode
} from "../operationModes";
import Tooltip from "./Tooltip";

const OperationModeSelect = ({ operationCode, name }) => {
  const { setFieldValue } = useFormikContext();
  const modes = useMemo(
    () => getOperationModesFromOperationCode(operationCode),
    [operationCode]
  );

  useEffect(() => {
    // No mode possible. Still, explicitely set to null
    if (!modes.length) {
      setFieldValue(name, null);
    }
    // If the available modes change, and only ONE option is available,
    // select it by default. Else, reset the selection
    else if (modes.length > 1) {
      setFieldValue(name, undefined);
    } else {
      setFieldValue(name, modes[0]);
    }
  }, [modes, name, setFieldValue]);

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
