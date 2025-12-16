// See RhfOperation mode for an amazing, breath-taking react-hook-form compliant component
import React, { useEffect, useMemo } from "react";
import { Field, useFormikContext } from "formik";
import { RadioButton } from "../../form/common/components/custom-inputs/RadioButton";
import RedErrorMessage from "./RedErrorMessage";
import { getOperationModeLabel } from "../../Apps/common/operationModes";
import Tooltip from "../../Apps/common/Components/Tooltip/Tooltip";
import { getOperationModes } from "@td/constants";
import { OperationMode } from "@td/codegen-ui";

const OperationModeSelect = ({ operationCode, name }) => {
  const { setFieldValue, values } = useFormikContext();

  const modeValue = values?.["destination"]?.operation?.mode;

  const modes = useMemo(
    () => getOperationModes(operationCode),
    [operationCode]
  );

  useEffect(() => {
    setFieldValue(name, null);
  }, [operationCode, setFieldValue, name]);

  useEffect(() => {
    // No mode possible. Still, explicitely set to null
    if (!modes.length) {
      setFieldValue(name, null);
    }
    // If the available modes change, and only ONE option is available,
    // select it by default.
    else if (!modeValue && modes.length === 1) {
      setFieldValue(name, modes[0]);
    }
  }, [modes, name, setFieldValue, modeValue]);

  if (!modes.length) return null;

  return (
    <div className="form__row">
      <fieldset>
        <legend>
          Mode de traitement{" "}
          <Tooltip title="Le mode de traitement correspond à l'un des choix de la hiérarchie des modes de traitement. Selon l'opération réalisée, il s'impose de lui-même ou doit être précisé." />
        </legend>
        <div className="tw-flex">
          {modes.map(mode => (
            <Field
              key={mode}
              name={name}
              id={mode}
              label={getOperationModeLabel(mode as OperationMode)}
              component={RadioButton}
            />
          ))}
        </div>
      </fieldset>

      <RedErrorMessage name={name} />
    </div>
  );
};
export default OperationModeSelect;
