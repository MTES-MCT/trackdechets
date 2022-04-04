import React from "react";
import { CompanyPrivate } from "@trackdechets/codegen/src/front.gen";
import { sortCompaniesByName } from "common/helper";

interface IProps {
  siret: string;
  companies: CompanyPrivate[];
  handleCompanyChange: (siret: string) => void;
}

export const SIRET_STORAGE_KEY = "td-selectedSiret";

export default function DashboardCompanySelector({
  siret,
  companies,
  handleCompanyChange
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
          {c.givenName || c.name} ({c.siret ?? c.vatNumber})
        </option>
      ))}
    </select>
  );
}
