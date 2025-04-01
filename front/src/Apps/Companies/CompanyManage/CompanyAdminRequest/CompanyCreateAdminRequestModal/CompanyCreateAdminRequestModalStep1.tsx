import React, { useEffect } from "react";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { useFormContext } from "react-hook-form";
import { isDefined } from "../../../../../common/helper";

export const CompanyCreateAdminRequestModalStep1 = ({
  onClickNext,
  onCancel
}) => {
  const { register, setValue, watch } = useFormContext();

  const companyOrgId = watch("companyOrgId");

  useEffect(() => {
    // register fields managed under the hood by company selector
    register("companyOrgId");
  }, [register]);

  return (
    <>
      <div>
        <CompanySelectorWrapper
          orgId={companyOrgId}
          selectedCompanyOrgId={companyOrgId}
          selectedCompanyError={company => {
            if (company && !company.isRegistered) {
              return "Cet établissement n'est pas inscrit sur Trackdéchets.";
            }
            return null;
          }}
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
      </div>

      <div className="td-modal-actions">
        <button className="fr-btn fr-btn--secondary" onClick={onCancel}>
          Annuler
        </button>

        <button
          className="fr-btn"
          disabled={!isDefined(companyOrgId)}
          onClick={onClickNext}
        >
          Suivant
        </button>
      </div>
    </>
  );
};
