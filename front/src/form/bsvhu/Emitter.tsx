import { RedErrorMessage } from "../../common/components";
import { useQuery } from "@apollo/client";
import CompanySelectorWrapper from "../common/components/CompanySelectorWrapper/CompanySelectorWrapper";
import { Field, useFormikContext, useField } from "formik";
import {
  FavoriteType,
  FormCompany,
  Query,
  QueryCompanyPrivateInfosArgs,
  CompanySearchResult
} from "codegen-ui";
import { useParams } from "react-router-dom";
import { COMPANY_SELECTOR_PRIVATE_INFOS } from "../../Apps/common/queries/company/query";
import React, { useMemo } from "react";
import styles from "../common/components/company/CompanySelector.module.scss";

export default function Emitter({ disabled }) {
  const { setFieldValue } = useFormikContext();
  const { siret } = useParams<{ siret: string }>();

  const [field] = useField<FormCompany>({ name: "emitter.company" });
  const orgId = useMemo(
    () => field.value?.orgId ?? field.value?.siret ?? null,
    [field.value?.siret, field.value?.orgId]
  );

  const { data: companyPrivateData, loading: isLoadingCompanyPrivateData } =
    useQuery<Pick<Query, "companyPrivateInfos">, QueryCompanyPrivateInfosArgs>(
      COMPANY_SELECTOR_PRIVATE_INFOS,
      {
        variables: {
          // Compatibility with intermediaries that don't have orgId
          clue: orgId!
        },
        skip: !orgId
      }
    );

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}
      <h4 className="form__section-heading">Entreprise émettrice</h4>

      <CompanySelectorWrapper
        siret={siret}
        favoriteType={FavoriteType.Emitter}
        disabled={disabled}
        currentCompany={
          companyPrivateData?.companyPrivateInfos as CompanySearchResult
        }
        onCompanySelected={emitter => {
          const fields = {
            orgId: emitter?.orgId,
            siret: emitter?.siret,
            vatNumber: emitter?.vatNumber,
            name:
              emitter?.name && !(emitter.name === "---" || emitter.name === "")
                ? emitter.name
                : "",
            address: emitter?.address ?? "",
            contact: emitter?.contact ?? "",
            phone: emitter?.contactPhone ?? "",
            mail: emitter?.contactEmail ?? ""
          };

          Object.keys(fields).forEach(key => {
            setFieldValue(`emitter.company.${key}`, fields[key]);
          });

          setFieldValue(
            "emitter.agrementNumber",
            emitter?.vhuAgrementDemolisseur?.agrementNumber
          );
        }}
      />

      <div className="form__row">
        <label>
          Personne à contacter
          <Field
            type="text"
            name="emitter.company.contact"
            placeholder="NOM Prénom"
            className="td-input"
            disabled={disabled}
          />
        </label>
        <RedErrorMessage name="emitter.company.contact" />
      </div>
      <div className="form__row">
        <label>
          Téléphone ou Fax
          <Field
            type="text"
            name="emitter.company.phone"
            placeholder="Numéro"
            className={`td-input ${styles.companySelectorSearchPhone}`}
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="emitter.company.phone" />
      </div>
      <div className="form__row">
        <label>
          Mail
          <Field
            type="email"
            name="emitter.company.mail"
            className={`td-input ${styles.companySelectorSearchEmail}`}
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="emitter.company.mail" />
      </div>

      <div className="form__row">
        <label>
          Numéro d'agrément démolisseur
          <Field
            disabled={disabled}
            type="text"
            name="emitter.agrementNumber"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="emitter.agrementNumber" />
      </div>
    </>
  );
}
