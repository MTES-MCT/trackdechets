import React from "react";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";

export const CompanyCreateAdminRequestModalStep1 = () => {
  return (
    <CompanySelectorWrapper
      // orgId={company.orgId}
      // disabled={isLoading}
      // selectedCompanyOrgId={delegateOrgId}
      selectedCompanyError={selectedCompany => {
        // if (selectedCompany?.orgId === company.orgId) {
        //   return "Le délégant et le délégataire doivent être différents";
        // }
        // if (!selectedCompany?.siret) {
        //   return "L'entreprise doit avoir un n° de SIRET";
        // }
        return null;
      }}
      onCompanySelected={company => {
        // if (company) {
        //   setValue("delegateOrgId", company.orgId);
        // }
      }}
    />
  );
};
