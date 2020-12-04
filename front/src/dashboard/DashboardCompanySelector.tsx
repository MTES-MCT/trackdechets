import React from "react";
import { CompanyPrivate } from "generated/graphql/types";

interface IProps {
  siret: string;
  companies: CompanyPrivate[];
  handleCompanyChange: (siret: string) => void;
}

const sortCompaniesByName = values => {
  return [...values].sort((a, b) => {
    const aName = a.givenName || a.name || "";
    const bName = b.givenName || b.name || "";
    return aName.localeCompare(bName);
  });
};

export const SIRET_STORAGE_KEY = "td-selectedSiret";

export default function DashboardCompanySelector({
  siret,
  companies,
  handleCompanyChange,
}: IProps) {
  const handleChange = (siret: string) => {
    handleCompanyChange(siret);
  };

  const sortedCompanies = sortCompaniesByName(companies);

  return (
    <select
      className="td-select"
      value={siret}
      onChange={e => handleChange(e.target.value)}
    >
      {sortedCompanies.map(c => (
        <option key={c.siret} value={c.siret}>
          {c.givenName || c.name} ({c.siret})
        </option>
      ))}
    </select>
  );
}
