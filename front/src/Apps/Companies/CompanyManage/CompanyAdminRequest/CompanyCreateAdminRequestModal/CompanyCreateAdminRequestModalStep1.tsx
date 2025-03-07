import React, { useEffect } from "react";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { useFormContext } from "react-hook-form";

export const CompanyCreateAdminRequestModalStep1 = () => {
  const { register, setValue, watch } = useFormContext();

  const companyOrgId = watch("companyOrgId");

  useEffect(() => {
    // register fields managed under the hood by company selector
    register("companyOrgId");
  }, [register]);

  return (
    <CompanySelectorWrapper
      orgId={companyOrgId}
      selectedCompanyOrgId={companyOrgId}
      onCompanySelected={company => {
        if (company) {
          setValue("companyOrgId", company?.orgId);
          setValue("companyName", company?.name);
        } else {
          setValue("companyOrgId", null);
          setValue("companyName", null);
        }
      }}
    />
  );
};
