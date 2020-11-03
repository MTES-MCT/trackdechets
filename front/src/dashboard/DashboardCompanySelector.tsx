import React from "react";
import { CompanyPrivate } from "generated/graphql/types";

interface IProps {
  siret: string;
  companies: CompanyPrivate[];
  handleCompanyChange: (siret: string) => void;
}

export const SIRET_STORAGE_KEY = "td-selectedSiret";

export default function DashboardCompanySelector({
  siret,
  companies,
  handleCompanyChange,
}: IProps) {
  const handleChange = (siret: string) => {
    handleCompanyChange(siret);
  };

  return (
    <select
      className="td-select"
      value={siret}
      onChange={e => handleChange(e.target.value)}
    >
      {companies.map(c => (
        <option key={c.siret} value={c.siret}>
          {c.givenName || c.name} ({c.siret})
        </option>
      ))}
    </select>
  );
}
