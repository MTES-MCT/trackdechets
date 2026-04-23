import React, { useCallback, useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import Select from "@codegouvfr/react-dsfr/Select";

import { CompanyPrivate, Query } from "@td/codegen-ui";
import { getInitialCompany } from "../../../../common/data/initialState";
import { sortCompaniesByName } from "../../../../../common/helper";
import { InlineError } from "../../../../common/Components/Error/Error";

export const GET_ME = gql`
  {
    me {
      id
      companies {
        id
        name
        givenName
        siret
        orgId
        vatNumber
        contact
        contactEmail
        contactPhone
        address
        companyTypes
        transporterReceipt {
          receiptNumber
          validityLimit
          department
        }
      }
    }
  }
`;

type Props = {
  value: any;
  onChange: (company: any) => void;
  filter?: (companies: CompanyPrivate[]) => CompanyPrivate[];
};

export default function MyBsffCompanySelector({
  value,
  onChange,
  filter
}: Props) {
  const company = value ?? getInitialCompany();

  const onCompanySelect = useCallback(
    (privateCompany: Partial<CompanyPrivate>) => {
      const selectedCompany = {
        orgId: privateCompany.orgId ?? "",
        siret: privateCompany.siret ?? "",
        vatNumber: privateCompany.vatNumber ?? "",
        name: privateCompany.name ?? "",
        contact: privateCompany.contact ?? "",
        mail: privateCompany.contactEmail ?? "",
        phone: privateCompany.contactPhone ?? "",
        address: privateCompany.address ?? ""
      };

      onChange(selectedCompany);
    },
    [onChange]
  );

  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME, {
    onCompleted: data => {
      const companies = data.me.companies ?? [];
      const exists = companies.some(c => c.siret === company.siret);

      if (!exists) {
        companies.length === 1
          ? onCompanySelect(companies[0])
          : onCompanySelect(getInitialCompany());
      }
    }
  });

  const companies = useMemo(() => {
    const allCompanies = data?.me.companies ?? [];
    const filteredCompanies = filter ? filter(allCompanies) : allCompanies;
    return sortCompaniesByName(filteredCompanies);
  }, [data, filter]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <InlineError apolloError={error} />;

  return (
    <Select
      className="fr-col-md-8 fr-mt-2w"
      label="Établissement concerné"
      nativeSelectProps={{
        value: company.orgId,
        onChange: e => {
          const selected = companies.find(c => c.orgId === e.target.value);

          selected
            ? onCompanySelect(selected)
            : onCompanySelect(getInitialCompany());
        }
      }}
    >
      <option value="">Sélectionner un de vos établissements</option>

      {companies.map(c => {
        const name = c.givenName || c.name;
        return (
          <option key={c.orgId} value={c.orgId}>
            {name} - {c.orgId}
          </option>
        );
      })}
    </Select>
  );
}
