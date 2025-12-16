import React, { useEffect, useMemo } from "react";

import { useFormContext } from "react-hook-form";
import { getOperationModeLabel } from "../../operationModes";
import Tooltip from "../Tooltip/Tooltip";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { getOperationModes } from "@td/constants";
import { OperationMode } from "@td/codegen-ui";

const RhfOperationModeSelect = ({
  operationCode,
  path,
  addedDsfrClass = ""
}) => {
  const { setValue, watch, getFieldState } = useFormContext();
  const { error: fieldError } = getFieldState(path);
  const modes = useMemo(
    () => getOperationModes(operationCode),
    [operationCode]
  );
  const fieldValue = watch(path);

  useEffect(() => {
    setValue(path, null);
  }, [operationCode, setValue, path]);

  useEffect(() => {
    // No mode possible. Still, explicitely set to null
    if (!modes.length) {
      setValue(path, null);
    }
    // If the available modes change, and only ONE option is available,
    // select it by default
    else if (!fieldValue && modes.length === 1) {
      setValue(path, modes[0]);
    }
  }, [modes, path, setValue, fieldValue]);

  if (!modes.length) return null;

  return (
    <div className="form__row">
      <fieldset>
        <legend className={`fr-pb-2w fr-grid-row ${addedDsfrClass}`}>
          Mode de traitement
          <Tooltip
            className="fr-ml-1w"
            title="Le mode de traitement correspond à un des 4 choix de la hiérarchie des modes de traitement, il s'impose de lui même ou doit être précisé selon l'opération réalisée"
          />
        </legend>

        <RadioButtons
          className="fr-mb-1w"
          orientation="horizontal"
          state={fieldError && "error"}
          stateRelatedMessage={(fieldError?.message as string) ?? ""}
          options={modes.map(mode => ({
            label: getOperationModeLabel(mode as OperationMode),
            nativeInputProps: {
              value: mode,
              onChange: () => setValue(path, mode),

              checked: fieldValue === mode
            }
          }))}
        />
      </fieldset>
    </div>
  );
};
export default RhfOperationModeSelect;
