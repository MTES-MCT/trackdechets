import { RedErrorMessage } from "../../common/components";
import CompanySelectorWrapper from "../../Apps/common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { Field, useField } from "formik";
import { FavoriteType, BsvhuEmitter } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import React, { useMemo } from "react";
import CompanyContactInfo from "../../Apps/Forms/Components/CompanyContactInfo/CompanyContactInfo";

export default function Emitter({ disabled }) {
  const { siret } = useParams<{ siret: string }>();

  const [field, _, { setValue }] = useField<BsvhuEmitter>({ name: "emitter" });

  const emitter = field.value;

  const orgId = useMemo(
    () => emitter?.company?.orgId ?? emitter?.company?.siret ?? null,
    [emitter?.company?.orgId, emitter?.company?.siret]
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
        orgId={siret}
        favoriteType={FavoriteType.Emitter}
        disabled={disabled}
        selectedCompanyOrgId={orgId}
        onCompanySelected={company => {
          if (company) {
            let companyData = {
              orgId: company.orgId,
              siret: company.siret,
              vatNumber: company.vatNumber,
              name: company.name ?? "",
              address: company.address ?? "",
              contact: company.contact ?? "",
              phone: company.contactPhone ?? "",
              mail: company.contactEmail ?? "",
              country: company.codePaysEtrangerEtablissement
            };
            let agrementNumber =
              company?.vhuAgrementDemolisseur?.agrementNumber ?? "";

            // don't override field with api data keep the user data value
            if (company.siret === emitter?.company?.siret) {
              companyData = {
                orgId: company.orgId,
                siret: company.siret,
                vatNumber: company.vatNumber,
                name: (emitter?.company?.name || company.name) as string,
                address: (emitter?.company?.address ||
                  company.address) as string,
                contact: (emitter?.company?.contact ||
                  company.contact) as string,
                phone: (emitter?.company?.phone ||
                  company.contactPhone) as string,
                mail: (emitter?.company?.mail ||
                  company.contactEmail) as string,
                country: company.codePaysEtrangerEtablissement
              };

              agrementNumber = (emitter?.agrementNumber ||
                company?.vhuAgrementDemolisseur?.agrementNumber) as string;
            }

            setValue({
              ...emitter,
              company: {
                ...emitter.company,
                ...companyData
              },
              agrementNumber
            });
          }
        }}
      />

      <CompanyContactInfo
        fieldName={"emitter.company"}
        disabled={disabled}
        key={orgId}
      />

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
