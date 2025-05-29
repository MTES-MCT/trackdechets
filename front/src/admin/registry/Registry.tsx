import React, { useState } from "react";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { RegistryV2ExportProvider } from "../../dashboard/registry/RegistryV2ExportContext";
import { RegistryV2ExportModalProvider } from "../../dashboard/registry/RegistryV2ExportModalContext";
import { MyExports } from "../../dashboard/registry/MyExports";
import { RegistryExhaustiveExportProvider } from "../../dashboard/registry/RegistryExhaustiveExportContext";
import { RegistryExhaustiveExportModalProvider } from "../../dashboard/registry/RegistryExhaustiveExportModalContext";

export function Registry() {
  const [registryType, setRegistryType] = useState<"registryV2" | "exhaustive">(
    "registryV2"
  );

  return (
    <div>
      <h3 className="fr-sr-only">Registre</h3>
      <Select
        className="fr-col-3 fr-mb-5v"
        label="Type de registre"
        nativeSelectProps={{
          onChange: e =>
            setRegistryType(e.target.value as "registryV2" | "exhaustive"),
          value: registryType
        }}
      >
        <option value="registryV2">Registre V2</option>
        <option value="exhaustive">Registre exhaustif</option>
      </Select>
      {registryType === "registryV2" && (
        <div>
          <RegistryV2ExportProvider asAdmin={true}>
            <RegistryV2ExportModalProvider asAdmin={true}>
              <MyExports />
            </RegistryV2ExportModalProvider>
          </RegistryV2ExportProvider>
        </div>
      )}
      {registryType === "exhaustive" && (
        <div>
          <RegistryExhaustiveExportProvider asAdmin={true}>
            <RegistryExhaustiveExportModalProvider asAdmin={true}>
              <MyExports />
            </RegistryExhaustiveExportModalProvider>
          </RegistryExhaustiveExportProvider>
        </div>
      )}
    </div>
  );
}
