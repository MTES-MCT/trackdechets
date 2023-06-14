import React from "react";
import { CompanyPrivate } from "generated/graphql/types";
import { sortCompaniesByName } from "common/helper";
import { usePermissions } from "common/contexts/PermissionsContext";

interface IProps {
  orgId: string;
  companies: CompanyPrivate[];
  handleCompanyChange: (orgId: string) => void;
}

export const SIRET_STORAGE_KEY = "td-selectedSiret";

export default function DashboardCompanySelector({
  orgId,
  companies,
  handleCompanyChange,
}: IProps) {
  const { updatePermissions } = usePermissions();

  const handleChange = (orgId: string) => {
    const currentCompany = companies.find(company => company.orgId === orgId);
    if (currentCompany) {
      updatePermissions(currentCompany?.userPermissions);
    }

    handleCompanyChange(orgId);
  };

  const sortedCompanies = sortCompaniesByName(companies);

  return (
    <select
      className="td-select"
      value={orgId}
      onChange={e => handleChange(e.target.value)}
    >
      {sortedCompanies.map(c => (
        <option key={c.orgId} value={c.orgId}>
          {c.givenName || c.name} ({c.orgId})
        </option>
      ))}
    </select>
  );
}
