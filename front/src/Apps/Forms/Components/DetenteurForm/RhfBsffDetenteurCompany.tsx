import React from "react";
import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import CompanyContactInfo from "../RhfCompanyContactInfo/RhfCompanyContactInfo";

export default function RhfBsffDetenteurCompany({
  orgId,
  disabled = false
}: {
  orgId?: string;
  disabled?: boolean;
}) {
  const { watch, setValue, formState } = useFormContext();
  const field = "emitter.company";
  const errors = formState.errors?.emitter?.["company"];
  return (
    <>
      <h4 className="fr-h4 fr-mt-4w">Détenteur</h4>
      <CompanySelectorWrapper
        orgId={orgId}
        disabled={disabled}
        searchRequired
        selectedCompanyOrgId={
          watch(`${field}.orgId`) ?? watch(`${field}.siret`)
        }
        onCompanySelected={company => {
          if (!company) return;
          setValue(
            field,
            {
              orgId: company.orgId,
              siret: company.siret,
              vatNumber: company.vatNumber ?? null,
              name: company.name ?? "",
              address: company.address ?? "",
              contact: company.contact ?? "",
              phone: company.contactPhone ?? "",
              mail: company.contactEmail ?? "",
              country: company.codePaysEtrangerEtablissement ?? null
            },
            { shouldDirty: true, shouldValidate: true }
          );
        }}
      />
      <CompanyContactInfo
        fieldName={field}
        disabled={disabled}
        requiredMarkers
        errorObject={errors}
      />
    </>
  );
}
