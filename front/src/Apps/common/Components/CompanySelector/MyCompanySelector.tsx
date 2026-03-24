import { gql, useQuery } from "@apollo/client";
import React, { useCallback, useMemo, useState } from "react";
import { InlineError } from "../../../../Apps/common/Components/Error/Error";
import { CompanyPrivate, Query } from "@td/codegen-ui";
import { sortCompaniesByName } from "../../../../common/helper";
import { CompanyResult } from "./CompanyResults";
import { getInitialCompany } from "../../../../Apps/common/data/initialState";
import Select from "@codegouvfr/react-dsfr/Select";
import { useFormContext } from "react-hook-form";

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

export default function MyCompanySelector({
  fieldName, // conservé mais inutilisé (compat)
  onSelect,
  siretEditable = true,
  filter
}: {
  fieldName: string;
  onSelect: (company) => void;
  siretEditable: boolean;
  filter?: (companies: CompanyPrivate[]) => CompanyPrivate[];
}) {
  // équivalent exact de field.value
  const [companyValue, setCompanyValue] = useState(getInitialCompany());
  const methods = useFormContext();
  const { register, setValue, watch, formState } = methods;
  const onCompanySelect = useCallback(
    (
      privateCompany: Pick<
        CompanyPrivate,
        | "orgId"
        | "siret"
        | "vatNumber"
        | "name"
        | "contact"
        | "contactEmail"
        | "contactPhone"
        | "address"
      >
    ) => {
      const company = {
        orgId: privateCompany.orgId ?? "",
        siret: privateCompany.siret ?? "",
        vatNumber: privateCompany.vatNumber ?? "",
        name: privateCompany.name ?? "",
        contact: privateCompany.contact ?? "",
        mail: privateCompany.contactEmail ?? "",
        phone: privateCompany.contactPhone ?? "",
        address: privateCompany.address ?? "",
        country: companyValue.country ?? "",
        omiNumber: companyValue.omiNumber ?? ""
      };

      setCompanyValue(company); // remplace setFieldValue
      onSelect?.(company);
    },
    [onSelect]
  );

  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME, {
    onCompleted: data => {
      if (!siretEditable) return;

      const companies = data.me.companies;

      if (!companies.map(c => c.siret).includes(companyValue.siret)) {
        if (companies.length === 1) {
          onCompanySelect(companies[0]);
        } else {
          onCompanySelect(getInitialCompany());
        }
      }
    }
  });

  const companies = useMemo(() => {
    const all = data?.me.companies ?? [];
    const filtered = filter ? filter(all) : all;
    return sortCompaniesByName(filtered);
  }, [data, filter]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <InlineError apolloError={error} />;

  return (
    <>
      {siretEditable ? (
        <Select
          className="fr-col-md-8 fr-mt-2w"
          label=""
          nativeSelectProps={{
            ...register("companyValue?.orgId")
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
      ) : (
        <>
          <p>
            L'établissement émetteur n'est plus modifiable après création du
            bordereau en cas de réexpédition, regroupement ou reconditionnement
          </p>

          <CompanyResult
            item={companyValue}
            selectedItem={companyValue}
            onSelect={() => null}
            onUnselect={() => null}
          />
        </>
      )}
    </>
  );
}
