import { RedErrorMessage } from "../../common/components";
import { useQuery } from "@apollo/client";
import CompanySelectorWrapper from "../common/components/CompanySelectorWrapper/CompanySelectorWrapper";
import { Field, useFormikContext, useField } from "formik";
import {
  FavoriteType,
  FormCompany,
  Query,
  QueryCompanyPrivateInfosArgs,
  CompanySearchResult,
  BsvhuEmitterInput
} from "codegen-ui";
import { useParams } from "react-router-dom";
import { COMPANY_SELECTOR_PRIVATE_INFOS } from "../../Apps/common/queries/company/query";
import React, { useMemo, useState } from "react";
import CompanySelectorFields from "../common/components/company/CompanySelectorFields";

export default function Emitter({ disabled }) {
  const { setFieldValue } = useFormikContext<{
    emitter: BsvhuEmitterInput;
  }>();
  const { siret } = useParams<{ siret: string }>();
  const [currentCompany, setCurrentCompany] = useState<
    CompanySearchResult | undefined
  >();
  const [shouldUpdateFields, setShouldUpdateFields] = useState(false);

  const [field] = useField<FormCompany>({ name: "emitter.company" });
  const orgId = useMemo(
    () => field.value?.orgId ?? field.value?.siret ?? null,
    [field.value?.siret, field.value?.orgId]
  );

  const { data: companyPrivateData, loading: _ } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_SELECTOR_PRIVATE_INFOS, {
    variables: {
      // Compatibility with intermediaries that don't have orgId
      clue: orgId!
    },
    skip: !orgId,
    onCompleted: data =>
      setCurrentCompany(data.companyPrivateInfos as CompanySearchResult)
  });

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
          currentCompany ??
          (companyPrivateData?.companyPrivateInfos as CompanySearchResult)
        }
        onCompanySelected={emitter => {
          setCurrentCompany(emitter);
          setShouldUpdateFields(true);

          setFieldValue(
            "emitter.agrementNumber",
            emitter?.vhuAgrementDemolisseur?.agrementNumber
          );
        }}
      />

      {currentCompany && (
        <CompanySelectorFields
          currentCompany={currentCompany}
          name={"emitter.company"}
          disabled={disabled}
          key={currentCompany.orgId}
          shouldUpdateFields={shouldUpdateFields}
        />
      )}

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
