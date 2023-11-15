import React, { useMemo, useEffect } from "react";
import { Field, useField, useFormikContext } from "formik";
import RedErrorMessage from "../../../../common/components/RedErrorMessage";
import {
  FormCompany,
  CompanySearchResult,
  BsdasriTransporterInput,
  BsdaTransporterInput,
  BsvhuTransporterInput,
  TransporterInput,
  BsffTransporterInput,
  Maybe
} from "codegen-ui";
import { isForeignVat } from "shared/constants";
import styles from "./CompanySelector.module.scss";
import TransporterReceipt from "./TransporterReceipt";

interface CompanySelectorFieldsProps {
  currentCompany: CompanySearchResult;
  name: string;
  allowForeignCompanies?: boolean;
  disabled?: boolean;
  optionalMail?: boolean;
  shouldUpdateFields?: boolean;
}

export default function CompanySelectorFields({
  currentCompany,
  allowForeignCompanies = false,
  name,
  disabled = false,
  optionalMail = false,
  shouldUpdateFields = true
}: CompanySelectorFieldsProps) {
  const [field] = useField<FormCompany>({ name });
  const { setFieldValue, setFieldTouched, values } = useFormikContext<{
    transporter:
      | Maybe<TransporterInput>
      | Maybe<BsdaTransporterInput>
      | Maybe<BsdasriTransporterInput>
      | Maybe<BsvhuTransporterInput>
      | Maybe<BsffTransporterInput>;
  }>();
  // determine if the current Form company is foreign
  const isForeignCompany =
    (field.value?.country && field.value?.country !== "FR") ||
    isForeignVat(field.value?.vatNumber!) ||
    isForeignVat(currentCompany.vatNumber!);
  const displayForeignCompanyWithUnknownInfos =
    isForeignVat(currentCompany.vatNumber!) &&
    isUnknownCompanyName(currentCompany.name!);

  // Memoize for changes in field.value.siret and field.value.orgId
  // To support both FormCompany and Intermediary (which doesn't have orgId)
  const orgId = useMemo(
    () => field.value?.orgId ?? field.value?.siret ?? null,
    [field.value?.siret, field.value?.orgId]
  );

  // Disable the name field for foreign companies whose name is filled
  const disableNameField =
    disabled ||
    (!!currentCompany.name && !displayForeignCompanyWithUnknownInfos);

  // Disable the address field for foreign companies whose address is filled
  const disableAddressField =
    disabled ||
    (!!currentCompany.address && !displayForeignCompanyWithUnknownInfos);

  function isUnknownCompanyName(companyName?: string): boolean {
    return companyName === "---" || companyName === "";
  }

  useEffect(() => {
    if (shouldUpdateFields) {
      const fields: FormCompany = {
        orgId: currentCompany.orgId,
        siret: currentCompany.siret,
        vatNumber: currentCompany.vatNumber,
        name:
          currentCompany.name && !isUnknownCompanyName(currentCompany.name)
            ? currentCompany.name
            : "",
        address: currentCompany.address ?? "",
        contact: currentCompany.contact ?? "",
        phone: currentCompany.contactPhone ?? "",
        mail: currentCompany.contactEmail ?? "",
        country: currentCompany.codePaysEtrangerEtablissement
      };

      Object.keys(fields).forEach(key => {
        setFieldValue(`${field.name}.${key}`, fields[key]);
      });
      setFieldTouched(`${field.name}`, true, true);
    }
  }, [
    currentCompany,
    shouldUpdateFields,
    field.name,
    setFieldTouched,
    setFieldValue
  ]);

  return (
    <>
      <div className="form__row">
        {allowForeignCompanies && isForeignCompany && (
          <>
            <label>
              Nom de l'entreprise
              <Field
                type="text"
                className="td-input"
                name={`${field.name}.name`}
                placeholder="Nom"
                disabled={disableNameField}
              />
            </label>

            <RedErrorMessage name={`${field.name}.name`} />

            <label>
              Adresse de l'entreprise
              <Field
                type="text"
                className="td-input"
                name={`${field.name}.address`}
                placeholder="Adresse"
                disabled={disableAddressField}
              />
            </label>

            <RedErrorMessage name={`${field.name}.address`} />
            <label>
              Pays de l'entreprise
              <Field
                type="text"
                className="td-input"
                name={`${field.name}.country`}
                disabled={true}
              />
            </label>

            <RedErrorMessage name={`${field.name}.country`} />
          </>
        )}
        <label>
          Personne à contacter
          <Field
            type="text"
            name={`${field.name}.contact`}
            placeholder="NOM Prénom"
            className="td-input"
            disabled={disabled}
          />
        </label>
        <RedErrorMessage name={`${field.name}.contact`} />
      </div>
      <div className="form__row">
        <label>
          Téléphone ou Fax
          <Field
            type="text"
            name={`${field.name}.phone`}
            placeholder="Numéro"
            className={`td-input ${styles.companySelectorSearchPhone}`}
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name={`${field.name}.phone`} />
      </div>
      <div className="form__row">
        <label>
          Mail {optionalMail ? "(optionnel)" : null}
          <Field
            type="email"
            name={`${field.name}.mail`}
            className={`td-input ${styles.companySelectorSearchEmail}`}
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name={`${field.name}.mail`} />
      </div>

      {values.transporter && !!orgId && name === "transporter.company" && (
        <TransporterReceipt transporter={values.transporter!} />
      )}
    </>
  );
}
