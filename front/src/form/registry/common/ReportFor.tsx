import React, { useState } from "react";
import { type UseFormReturn, Controller } from "react-hook-form";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

import { RegistryCompanySwitcher } from "../../../dashboard/registry/RegistryCompanySwitcher";
import { formatError } from "../builder/error";

type Props = {
  methods: UseFormReturn<any>;
  reportForLabel: string;
  reportAsLabel: string;
};

export function ReportFor({ methods, reportForLabel, reportAsLabel }: Props) {
  const [showReportAs, setShowReportAs] = useState(false);
  const { errors } = methods.formState;

  return (
    <div className="fr-col">
      <div className="fr-grid-row fr-grid-row--gutters">
        <Controller
          name="reportForCompanySiret"
          control={methods.control}
          render={({ field }) => (
            <RegistryCompanySwitcher
              wrapperClassName="fr-col-8"
              label={reportForLabel}
              defaultSiret={field.value}
              onCompanySelect={(siret, isDelegation) => {
                field.onChange(siret);
                setShowReportAs(isDelegation);
              }}
            />
          )}
        />
        {errors?.reportForCompanySiret && (
          <Alert
            description={formatError(errors.reportForCompanySiret)}
            severity="error"
            small
          />
        )}

        {showReportAs && (
          <Controller
            name="reportAsCompanySiret"
            control={methods.control}
            render={({ field }) => (
              <RegistryCompanySwitcher
                wrapperClassName="fr-col-8"
                label={reportAsLabel}
                defaultSiret={field.value}
                onCompanySelect={siret => {
                  field.onChange(siret);
                }}
                excludeDelegations={true}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
