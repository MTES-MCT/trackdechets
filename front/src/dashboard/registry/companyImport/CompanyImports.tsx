import React, { useState } from "react";
import Tabs from "@codegouvfr/react-dsfr/Tabs";

import { StatsTab } from "./StatsTab";
import { RegistryCompanySwitcher } from "../RegistryCompanySwitcher";

export function CompanyImports() {
  const [siret, setSiret] = useState<string | undefined>();
  const [selectedTabId, setSelectedTabId] = useState("API");

  return (
    <div className="tw-p-6">
      <div>
        <RegistryCompanySwitcher onCompanySelect={v => setSiret(v)} />
      </div>

      <div className="fr-mt-4w">
        <Tabs
          selectedTabId={selectedTabId}
          tabs={[
            {
              tabId: "API",
              label: "Déclaration par API"
            },
            {
              tabId: "FILE",
              label: "Déclaration par fichiers"
            }
          ]}
          onTabChange={setSelectedTabId}
        >
          <StatsTab source={selectedTabId as "API" | "FILE"} siret={siret} />
        </Tabs>
      </div>
    </div>
  );
}
