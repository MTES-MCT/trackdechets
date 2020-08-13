import React from "react";
import countries from "world-countries";
import { FormCompany } from "../../generated/graphql/types";

interface CompanyAddressProps {
  company: FormCompany;
}

export default function CompanyAddress({
  company,
  ...props
}: CompanyAddressProps) {
  const companyCountry = company.country
    ? countries.find(country => country.cca2 === company.country)!.translations
        .fra.common
    : null;

  return (
    <address className="address" {...props}>
      {company.name} ({company.siret ?? companyCountry})
      <br /> {company.address}
    </address>
  );
}
