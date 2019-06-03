import React, { useEffect } from "react";
import { Me } from "../login/model";

export const currentSiretService = {
  getSiret: () => window.localStorage.getItem(SIRET_STORAGE_KEY) || "",
  setSiret: (value: string) =>
    window.localStorage.setItem(SIRET_STORAGE_KEY, value)
};

interface IProps {
  me: Me;
  setActiveSiret: (s: string) => void;
}

export const SIRET_STORAGE_KEY = "td-selectedSiret";
export default function CompanySelector({ me, setActiveSiret }: IProps) {
  if (me.companies.length === 1) return null;

  const selectedCompany = currentSiretService.getSiret();
  useEffect(() => {
    if (selectedCompany) setActiveSiret(selectedCompany);
  }, []);

  const handleChange = (siret: string) => {
    currentSiretService.setSiret(siret);
    setActiveSiret(siret);
  };

  return (
    <select
      value={selectedCompany}
      onChange={e => handleChange(e.target.value)}
    >
      {me.companies.map(c => (
        <option key={c.siret} value={c.siret}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
