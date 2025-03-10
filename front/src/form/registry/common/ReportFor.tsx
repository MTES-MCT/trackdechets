import React, { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { RegistryCompanySwitcher } from "../../../dashboard/registry/RegistryCompanySwitcher";

type Props = {
  methods: UseFormReturn<any>;
  reportForLabel: string;
  reportAsLabel: string;
};

export function ReportFor({ methods, reportForLabel, reportAsLabel }: Props) {
  const [showReportAs, setShowReportAs] = useState(false);

  return (
    <div className="fr-col">
      <div className="fr-grid-row fr-grid-row--gutters">
        <RegistryCompanySwitcher
          wrapperClassName="fr-col-8"
          label={reportForLabel}
          onCompanySelect={siret => {
            methods.setValue("reportForCompanySiret", siret);
            setShowReportAs(true); // TODO 2eme param isDelegation=true
          }}
        />

        {showReportAs && (
          <RegistryCompanySwitcher
            wrapperClassName="fr-col-8"
            label={reportAsLabel}
            onCompanySelect={siret => {
              methods.setValue("reportAsCompanySiret", siret);
            }}
          />
        )}
      </div>
    </div>
  );
}
