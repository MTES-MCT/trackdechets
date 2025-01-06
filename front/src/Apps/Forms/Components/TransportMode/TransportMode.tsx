import * as React from "react";

import { transportModeLabels } from "../../../../dashboard/constants";
import { useFormContext } from "react-hook-form";
import { Select } from "@codegouvfr/react-dsfr/Select";

export function RhfTransportModeSelect({ fieldPath, disabled = false }) {
  const { register } = useFormContext();

  return (
    <Select
      label="Mode de transport"
      nativeSelectProps={{ ...register(fieldPath) }}
      disabled={disabled}
    >
      {Object.entries(transportModeLabels).map(([k, v]) => (
        <option value={`${k}`} key={k}>
          {v}
        </option>
      ))}
    </Select>
  );
}
