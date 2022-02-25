import { gql, useQuery } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import { InlineError } from "common/components/Error";
import { Field, useField, useFormikContext } from "formik";
import { CreateFormInput, Query } from "generated/graphql/types";
import styles from "./CompanySelector.module.scss";
import React from "react";

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
      }
    }
  }
`;

export default function MyCompanySelector({ fieldName }) {
  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME);

  const { setFieldValue } = useFormikContext<CreateFormInput>();
  const [field] = useField({ name: fieldName });

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <InlineError apolloError={error} />;
  }

  if (data) {
    return (
      <>
        <Field
          className="td-select td-input--medium"
          as="select"
          name={`${fieldName}.siret`}
          onChange={e => {
            field.onChange(e);
            const selectedCompany = data.me.companies.filter(
              c => c.siret === e.target.value
            )?.[0];
            setFieldValue(`${fieldName}.name`, selectedCompany.name);
            setFieldValue(
              `${fieldName}.mail`,
              selectedCompany.contactEmail ?? ""
            );
            setFieldValue(
              `${fieldName}.phone`,
              selectedCompany.contactPhone ?? ""
            );
          }}
          value={field.value.siret}
        >
          <option value="" label="Sélectionner un de vos établissements" />
          {data.me.companies.map(c => (
            <option
              key={c.siret}
              value={c.siret}
              label={`${c.givenName ?? c.name ?? ""} - ${c.siret}`}
            ></option>
          ))}
        </Field>
        <div className="form__row">
          <label>
            Personne à contacter
            <Field
              type="text"
              name={`${fieldName.name}.contact`}
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
