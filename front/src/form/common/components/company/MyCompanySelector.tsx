import { gql, useQuery } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { InlineError } from "common/components/Error";
import { Field, useField, useFormikContext } from "formik";
import {
  CompanyPrivate,
  CreateFormInput,
  Query,
} from "generated/graphql/types";
import styles from "./CompanySelector.module.scss";
import React, { useCallback, useEffect } from "react";
import { getInitialCompany } from "form/bsdd/utils/initial-state";

export const GET_ME = gql`
  {
    me {
      id
      companies {
        id
        name
        givenName
        siret
        contactEmail
        contactPhone
        address
      }
    }
  }
`;

export default function MyCompanySelector({ fieldName }) {
  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME);

  const { setFieldValue } = useFormikContext<CreateFormInput>();
  const [field] = useField({ name: fieldName });

  const onCompanySelect = useCallback(
    (company: CompanyPrivate) => {
      setFieldValue(`${fieldName}.siret`, company.siret ?? "");
      setFieldValue(`${fieldName}.name`, company.name ?? "");
      setFieldValue(`${fieldName}.mail`, company.contactEmail ?? "");
      setFieldValue(`${fieldName}.phone`, company.contactPhone ?? "");
      setFieldValue(`${fieldName}.address`, company.address ?? "");
    },
    [fieldName, setFieldValue]
  );

  useEffect(() => {
    if (data?.me.companies?.length === 1) {
      setFieldValue(`${fieldName}.siret`, data?.me.companies[0].siret);
      onCompanySelect(data?.me.companies[0]);
    }
  }, [data, setFieldValue, fieldName, onCompanySelect]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <InlineError apolloError={error} />;
  }

  if (data) {
    return (
      <>
        <select
          className="td-select td-input--medium"
          value={field.value?.siret}
          onChange={e => {
            const selectedCompany = data.me.companies.filter(
              c => c.siret === e.target.value
            )?.[0];
            if (selectedCompany) {
              onCompanySelect(selectedCompany);
            } else {
              setFieldValue(fieldName, getInitialCompany());
            }
          }}
        >
          <option value="" label="Sélectionner un de vos établissements" />
          {data.me.companies.map(c => (
            <option
              key={c.siret}
              value={c.siret}
              label={`${c.givenName ?? c.name ?? ""} - ${c.siret}`}
            ></option>
          ))}
        </select>
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

          <RedErrorMessage name={`${fieldName.name}.contact`} />
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

          <RedErrorMessage name={`${fieldName.name}.phone`} />
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

          <RedErrorMessage name={`${fieldName.name}.mail`} />
        </div>
      </>
    );
  }

  return null;
}
