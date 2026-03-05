import React, { useContext, useEffect, useMemo } from "react";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";

import { CompanySearchResult, FavoriteType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { clearCompanyError } from "../../utils";

const EmitterBsff = () => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch, formState, clearErrors } =
    useFormContext();

  const emitter = watch("emitter", {});
  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    // register fields managed under the hood by company selector
    register("emitter.company.orgId");
    register("emitter.company.siret");
    register("emitter.company.name");
    register("emitter.company.vatNumber");
    register("emitter.company.address");
    register("emitter.company.city");
  }, [register]);

  useEffect(() => {
    if (emitter?.company?.siret) {
      setValue("emitter", emitter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orgId = useMemo(
    () => emitter?.company?.orgId ?? emitter?.company?.siret ?? null,
    [emitter?.company?.orgId, emitter?.company?.siret]
  );

  const selectedCompanyError = (company?: CompanySearchResult) => {
    if (company) {
      if (!company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets. Il ne peut être visé comme opérateur sur ce bordereau.";
      } else if (formState.errors?.emitter?.["company"]?.siret?.message) {
        return formState.errors?.emitter?.["company"]?.siret?.message;
      }
    }
    return null;
  };

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <div className="fr-col-md-10">
        <h4 className="fr-h4">Opérateur</h4>

        <CompanySelectorWrapper
          orgId={siret}
          favoriteType={FavoriteType.Emitter}
          disabled={sealedFields.includes(`emitter.company.siret`)}
          selectedCompanyOrgId={orgId}
          selectedCompanyError={selectedCompanyError}
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

              // [tra-13734] don't override field with api data keep the user data value
              if (company.siret === emitter?.company?.siret) {
                companyData = {
                  orgId: company.orgId,
                  siret: company.siret,
                  vatNumber: company.vatNumber,
                  name: (emitter?.company?.name || company.name) as string,
                  address: (emitter?.company?.address ||
                    company.address) as string,
                  contact: emitter?.company?.contact,
                  phone: emitter?.company?.phone,
                  mail: emitter?.company?.mail,
                  country: company.codePaysEtrangerEtablissement
                };
              }

              clearCompanyError(emitter, "emitter", clearErrors);

              setValue("emitter", {
                ...emitter,
                company: {
                  ...emitter.company,
                  ...companyData
                }
              });
            }
          }}
        />
        {!emitter?.company?.siret &&
          formState.errors?.emitter?.["company"]?.siret && (
            <p className="fr-text--sm fr-error-text fr-mb-4v">
              {formState.errors?.emitter?.["company"]?.siret?.message}
            </p>
          )}
        <CompanyContactInfo
          fieldName={"emitter.company"}
          errorObject={formState.errors?.emitter?.["company"]}
          disabled={sealedFields.includes(`emitter.company.siret`)}
          key={orgId}
        />
      </div>
    </>
  );
};

export default EmitterBsff;
