import { gql, useQuery } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { InlineError } from "Apps/common/Components/Error/Error";
import { Field, useField, useFormikContext } from "formik";
import {
  CompanyPrivate,
  CreateFormInput,
  Query,
} from "generated/graphql/types";
import styles from "./CompanySelector.module.scss";
import React, { useCallback, useMemo } from "react";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import { sortCompaniesByName } from "common/helper";
import { CompanyResult } from "./CompanyResults";

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
  fieldName,
  onSelect,
  siretEditable = true,
  filter,
}: {
  fieldName: string;
  onSelect: (company) => void;
  siretEditable: boolean;
  filter?: (companies: CompanyPrivate[]) => CompanyPrivate[];
}) {
  const { setFieldValue } = useFormikContext<CreateFormInput>();
  const [field] = useField({ name: fieldName });

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
      };
      setFieldValue(fieldName, company);
      if (onSelect) {
        onSelect(company);
      }
    },
    [fieldName, setFieldValue, onSelect]
  );

  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME, {
    onCompleted: data => {
      if (!siretEditable) {
        return;
      }

      // check user is member of selected company or reset emitter company
      const companies = data.me.companies;

      if (!companies.map(c => c.siret).includes(field.value.siret)) {
        if (companies.length === 1) {
          onCompanySelect(companies[0]);
        } else {
          onCompanySelect(getInitialCompany());
        }
      }
    },
  });

  const companies = useMemo(() => {
    const allCompanies = data?.me.companies ?? [];
    const filteredCompanies = filter ? filter(allCompanies) : allCompanies;
    return sortCompaniesByName(filteredCompanies);
  }, [data, filter]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <InlineError apolloError={error} />;
  }

  if (companies) {
    return (
      <>
        {siretEditable ? (
          <select
            className="td-select td-input--medium"
            value={field.value?.orgId}
            onChange={e => {
              const selectedCompany = companies.filter(
                c => c.orgId === e.target.value
              )?.[0];
              if (selectedCompany) {
                onCompanySelect(selectedCompany);
              } else {
                setFieldValue(fieldName, getInitialCompany());
              }
            }}
          >
            <option value="" label="Sélectionner un de vos établissements" />
            {companies.map(c => {
              const name =
                c.givenName && c.givenName !== "" ? c.givenName : c.name;

              return (
                <option
                  key={c.orgId}
                  value={c.orgId}
                  label={`${name} - ${c.orgId}`}
                ></option>
              );
            })}
          </select>
        ) : (
          <>
            <p>
              L'établissement émetteur n'est plus modifiable après création du
              bordereau en cas de réexpédition, regroupement ou recondtionnement
            </p>
            <CompanyResult
              item={field.value}
              selectedItem={field.value}
              onSelect={() => null}
              onUnselect={() => null}
            />
          </>
        )}
        <div className="form__row">
          <label>
            Personne à contacter
            <Field
              type="text"
              name={`${fieldName}.contact`}
              placeholder="NOM Prénom"
              className="td-input"
            />
          </label>

          <RedErrorMessage name={`${fieldName}.contact`} />
        </div>
        <div className="form__row">
          <label>
            Téléphone ou Fax
            <Field
              type="text"
              name={`${fieldName}.phone`}
              placeholder="Numéro"
              className={`td-input ${styles.companySelectorSearchPhone}`}
            />
          </label>

          <RedErrorMessage name={`${fieldName}.phone`} />
        </div>
        <div className="form__row">
          <label>
            Mail
            <Field
              type="email"
              name={`${fieldName}.mail`}
              className={`td-input ${styles.companySelectorSearchEmail}`}
            />
          </label>

          <RedErrorMessage name={`${fieldName}.mail`} />
        </div>
      </>
    );
  }

  return null;
}
