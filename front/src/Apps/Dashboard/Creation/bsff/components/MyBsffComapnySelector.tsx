import { gql, useQuery } from "@apollo/client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CompanyPrivate, Query } from "@td/codegen-ui";
import { getInitialCompany } from "../../../../common/data/initialState";
import { sortCompaniesByName } from "../../../../../common/helper";
import { InlineError } from "../../../../common/Components/Error/Error";
import BsffCompanyResults from "./BsffCompanyResult";

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
  siretEditable?: boolean;
  filter?: (companies: CompanyPrivate[]) => CompanyPrivate[];
};

export default function MyBsffCompanySelector({
  value,
  onChange,
  siretEditable = true,
  filter
}: Props) {
  const [company, setCompany] = useState(value ?? getInitialCompany());

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

      setCompany(selectedCompany);
      onChange?.(selectedCompany);
    },
    [onChange]
  );

  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME, {
    onCompleted: data => {
      if (!siretEditable) return;

      const companies = data.me.companies ?? [];
      const exists = companies.some(c => c.siret === company.siret);

      if (!exists) {
        if (companies.length === 1) {
          onCompanySelect(companies[0]);
        } else {
          onCompanySelect(getInitialCompany());
        }
      }
    }
  });

  useEffect(() => {
    setCompany(value);
  }, [value]);

  const companies = useMemo(() => {
    const allCompanies = data?.me.companies ?? [];
    const filtered = filter ? filter(allCompanies) : allCompanies;
    return sortCompaniesByName(filtered);
  }, [data, filter]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <InlineError apolloError={error} />;

  return (
    <>
      {siretEditable ? (
        <select
          className="td-select td-input--medium"
          value={company?.orgId}
          onChange={e => {
            const selected = companies.find(c => c.orgId === e.target.value);
            selected
              ? onCompanySelect(selected)
              : onCompanySelect(getInitialCompany());
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
        </select>
      ) : (
        <>
          <p>
            L'établissement émetteur n'est plus modifiable après création du
            bordereau.
          </p>
          <BsffCompanyResults
            results={[company]}
            selectedItem={company}
            onSelect={() => {}}
            onUnselect={() => {}}
          />
        </>
      )}
    </>
  );
}
